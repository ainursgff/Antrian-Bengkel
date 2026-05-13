const express = require('express');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Helper: format tanggal lokal YYYY-MM-DD
const getTodayLocal = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// Helper: generate nomor antrian (A001, A002, dst. per hari per layanan)
const generateNomorAntrian = async (layananId, tanggal) => {
  // Karena sekarang layanan_id bisa berisi multi id "1,2", urutan kita hitung secara global per hari saja, 
  // atau kita ambil id pertama sebagai representasi. Kita buat A001 global per hari saja.
  const [rows] = await pool.query(
    `SELECT COUNT(*) as total FROM antrian WHERE tanggal = ?`,
    [tanggal]
  );
  const seq = rows[0].total + 1;
  return `A${String(seq).padStart(3, '0')}`;
};

// GET /api/antrian — Ambil semua (admin: semua, pelanggan: milik sendiri)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'admin') {
      const tanggal = req.query.tanggal || getTodayLocal();
      query = `
        SELECT a.*, u.nama AS nama_pelanggan, u.no_hp, u.email, 
               m.nama AS nama_montir,
               (SELECT GROUP_CONCAT(nama_layanan SEPARATOR ', ') FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS nama_layanan,
               (SELECT SUM(estimasi_menit) FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS estimasi_menit,
               (SELECT SUM(harga) FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS total_harga,
               (SELECT GROUP_CONCAT(CONCAT(nama_layanan, ' (Rp ', harga, ')') SEPARATOR ', ') FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS rincian_harga
        FROM antrian a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN users m ON a.montir_id = m.id
        WHERE a.tanggal = ?
        ORDER BY a.created_at ASC
      `;
      params = [tanggal];
    } else if (req.user.role === 'montir') {
      const tanggal = req.query.tanggal || getTodayLocal();
      query = `
        SELECT a.*, u.nama AS nama_pelanggan, u.no_hp, u.email, 
               (SELECT GROUP_CONCAT(nama_layanan SEPARATOR ', ') FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS nama_layanan,
               (SELECT SUM(estimasi_menit) FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS estimasi_menit,
               (SELECT SUM(harga) FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS total_harga,
               (SELECT GROUP_CONCAT(CONCAT(nama_layanan, ' (Rp ', harga, ')') SEPARATOR ', ') FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS rincian_harga
        FROM antrian a
        JOIN users u ON a.user_id = u.id
        WHERE a.tanggal = ? AND a.montir_id = ?
        ORDER BY a.created_at ASC
      `;
      params = [tanggal, req.user.userId];
    } else {
      query = `
        SELECT a.*, 
               (SELECT GROUP_CONCAT(nama_layanan SEPARATOR ', ') FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS nama_layanan,
               (SELECT SUM(estimasi_menit) FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS estimasi_menit,
               (SELECT SUM(harga) FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS total_harga,
               (SELECT GROUP_CONCAT(CONCAT(nama_layanan, ' (Rp ', harga, ')') SEPARATOR ', ') FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS rincian_harga
        FROM antrian a
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
        LIMIT 20
      `;
      params = [req.user.userId];
    }

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// GET /api/antrian/aktif — Antrian aktif pelanggan saat ini
router.get('/aktif', authMiddleware, async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, 
             (SELECT GROUP_CONCAT(nama_layanan SEPARATOR ', ') FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS nama_layanan,
             (SELECT SUM(estimasi_menit) FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS estimasi_menit,
             (SELECT SUM(harga) FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS total_harga,
             (SELECT GROUP_CONCAT(CONCAT(nama_layanan, ' (Rp ', harga, ')') SEPARATOR ', ') FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS rincian_harga,
             (SELECT COUNT(*) FROM antrian a2 
              WHERE a2.tanggal = a.tanggal AND a2.status = 'menunggu' AND a2.created_at < a.created_at) AS posisi_antrian
      FROM antrian a
      WHERE a.user_id = ? AND a.status IN ('menunggu','dipanggil','sedang_dilayani') AND a.tanggal = ?
      ORDER BY a.created_at DESC LIMIT 1
    `, [req.user.userId, getTodayLocal()]);

    res.json(rows.length > 0 ? rows[0] : null);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/antrian — UC3: Ambil nomor antrian (pelanggan)
router.post('/', authMiddleware, async (req, res) => {
  const { layanan_id, kendaraan, catatan } = req.body;

  if (!layanan_id || layanan_id.length === 0) {
    return res.status(400).json({ error: 'Layanan wajib dipilih minimal 1' });
  }

  // Jika frontend mengirim array, jadikan string comma-separated
  const layananIdsStr = Array.isArray(layanan_id) ? layanan_id.join(',') : layanan_id;

  try {
    let targetTanggal = getTodayLocal();
    const now = new Date();
    const dayOfWeek = now.getDay(); 
    let isBookingBesok = false;

    // Cek jadwal operasional hari ini
    const [jadwalRows] = await pool.query(
      'SELECT * FROM jadwal_operasional WHERE hari = ? AND is_libur = 0 LIMIT 1',
      [dayOfWeek]
    );

    if (jadwalRows.length === 0) {
      // Jika hari ini libur, maka booking dialihkan ke besok
      isBookingBesok = true;
    } else {
      const jadwal = jadwalRows[0];
      const jamTutupParts = jadwal.jam_tutup.split(':').map(Number);
      const jamTutupMinutes = jamTutupParts[0] * 60 + jamTutupParts[1];
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      if (currentMinutes >= (jamTutupMinutes - 30)) {
        // Jika sudah melewati batas tutup hari ini, booking dialihkan ke besok
        isBookingBesok = true;
      }
    }

    let targetDayOfWeek = dayOfWeek;
    if (isBookingBesok) {
      const besok = new Date();
      besok.setDate(besok.getDate() + 1);
      const y = besok.getFullYear();
      const m = String(besok.getMonth() + 1).padStart(2, '0');
      const d = String(besok.getDate()).padStart(2, '0');
      targetTanggal = `${y}-${m}-${d}`;
      targetDayOfWeek = besok.getDay();
    }

    // Ambil jadwal operasional untuk target hari (hari ini atau besok)
    const [targetJadwalRows] = await pool.query(
      'SELECT * FROM jadwal_operasional WHERE hari = ? AND is_libur = 0 LIMIT 1',
      [targetDayOfWeek]
    );

    if (targetJadwalRows.length === 0) {
      return res.status(400).json({ error: 'Maaf, bengkel sedang libur dan jadwal operasional besok juga libur.' });
    }

    const jadwal = targetJadwalRows[0];
    const jamBukaParts = jadwal.jam_buka.split(':').map(Number);
    const jamBukaMinutes = jamBukaParts[0] * 60 + jamBukaParts[1];
    const jamTutupParts = jadwal.jam_tutup.split(':').map(Number);
    const jamTutupMinutes = jamTutupParts[0] * 60 + jamTutupParts[1];

    // Cek apakah user sudah punya antrian aktif di target tanggal
    const [existingAntrian] = await pool.query(
      `SELECT id FROM antrian WHERE user_id = ? AND tanggal = ? AND status IN ('menunggu','dipanggil','sedang_dilayani')`,
      [req.user.userId, targetTanggal]
    );
    if (existingAntrian.length > 0) {
      return res.status(409).json({ error: isBookingBesok ? 'Anda sudah memiliki antrian aktif untuk jadwal besok.' : 'Anda masih memiliki antrian aktif hari ini.' });
    }

    // Cek layanan aktif dan hitung total waktu
    const [layananRows] = await pool.query(
      `SELECT SUM(estimasi_menit) as estimasi_menit, GROUP_CONCAT(nama_layanan SEPARATOR ', ') as nama_layanan 
       FROM layanan WHERE FIND_IN_SET(id, ?) AND is_aktif = 1`, 
      [layananIdsStr]
    );
    
    if (!layananRows[0] || !layananRows[0].nama_layanan) {
      return res.status(404).json({ error: 'Layanan tidak ditemukan atau tidak aktif' });
    }

    const estimasiMenit = Number(layananRows[0].estimasi_menit) || 30;

    // Generate nomor antrian
    const nomor_antrian = await generateNomorAntrian(layananIdsStr, targetTanggal);

    // Hitung total beban waktu seluruh bengkel di target tanggal (Multi-Channel Algorithm)
    const [totalWaktuRows] = await pool.query(
      `SELECT SUM(l.estimasi_menit) as total_menit FROM antrian a JOIN layanan l ON FIND_IN_SET(l.id, a.layanan_id) WHERE a.tanggal = ? AND a.status != 'dibatalkan'`,
      [targetTanggal]
    );
    const totalMenitTarget = Number(totalWaktuRows[0].total_menit) || 0;
    const kuotaMontir = jadwal.kuota_per_slot || 1;
    
    // Rata-rata beban per montir
    let baseMinutes = jamBukaMinutes + Math.floor(totalMenitTarget / kuotaMontir);

    // Jika booking untuk besok, slot langsung dihitung dari jam buka! Jika hari ini, diambil dari waktu saat ini atau baseMinutes.
    const currentMinutesNow = now.getHours() * 60 + now.getMinutes();
    const slotMinutes = isBookingBesok ? baseMinutes : Math.max(baseMinutes, currentMinutesNow);

    // Tolak jika estimasi layanan selesai melewati jam tutup bengkel
    if ((slotMinutes + estimasiMenit) > jamTutupMinutes) {
      return res.status(400).json({ error: 'Maaf, kuota antrian sudah penuh (melewati jam tutup).' });
    }

    const slotH = Math.floor(slotMinutes / 60);
    const slotM = slotMinutes % 60;
    const slot_waktu = `${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}:00`;

    // Simpan antrian
    const [result] = await pool.query(
      `INSERT INTO antrian (user_id, layanan_id, kendaraan, jadwal_id, nomor_antrian, tanggal, slot_waktu, status, catatan)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'menunggu', ?)`,
      [req.user.userId, layananIdsStr, kendaraan || null, jadwal.id, nomor_antrian, targetTanggal, slot_waktu, catatan || null]
    );

    // Simpan relasi fisik ke tabel pivot antrian_layanan untuk memunculkan garis relasi di ERD
    const individualLayananIds = layananIdsStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
    for (const lid of individualLayananIds) {
      await pool.query(
        'INSERT INTO antrian_layanan (antrian_id, layanan_id) VALUES (?, ?)',
        [result.insertId, lid]
      );
    }

    // Buat notifikasi konfirmasi
    await pool.query(
      `INSERT INTO notifikasi (antrian_id, pesan, tipe) VALUES (?, ?, 'konfirmasi')`,
      [result.insertId, `Nomor antrian Anda: ${nomor_antrian} untuk layanan ${layananRows[0].nama_layanan}. Estimasi waktu: ${slot_waktu.substring(0,5)} WIB.`]
    );

    res.status(201).json({
      success: true,
      message: 'Nomor antrian berhasil diambil!',
      antrian: {
        id: result.insertId,
        nomor_antrian,
        layanan: layananRows[0].nama_layanan,
        tanggal: targetTanggal,
        slot_waktu,
        status: 'menunggu'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// PUT /api/antrian/:id/batalkan — Batalkan antrian (pelanggan)
router.put('/:id/batalkan', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query(
      `SELECT a.*, (SELECT GROUP_CONCAT(nama_layanan SEPARATOR ', ') FROM layanan WHERE FIND_IN_SET(id, a.layanan_id)) AS nama_layanan FROM antrian a WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Antrian tidak ditemukan' });

    const antrian = rows[0];

    if (req.user.role !== 'admin' && antrian.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Anda tidak berhak membatalkan antrian ini' });
    }

    if (!['menunggu', 'dipanggil'].includes(antrian.status)) {
      return res.status(400).json({ error: `Antrian berstatus '${antrian.status}' tidak dapat dibatalkan` });
    }

    if (req.user.role !== 'admin') {
      const createdTime = new Date(antrian.created_at).getTime();
      const now = new Date().getTime();
      if (now - createdTime > 180000) {
        return res.status(400).json({ error: 'Waktu pembatalan telah habis (maks 3 menit).' });
      }
    }

    await pool.query(`UPDATE antrian SET status = 'dibatalkan' WHERE id = ?`, [id]);

    await pool.query(
      `INSERT INTO notifikasi (antrian_id, pesan, tipe) VALUES (?, ?, 'pembatalan')`,
      [id, `Antrian ${antrian.nomor_antrian} untuk ${antrian.nama_layanan} telah dibatalkan.`]
    );

    res.json({ success: true, message: 'Antrian berhasil dibatalkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// PUT /api/antrian/:id/panggil — UC9: Panggil antrian (admin only)
router.put('/:id/panggil', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { montir_id } = req.body || {};

  try {
    const [rows] = await pool.query(`SELECT * FROM antrian WHERE id = ?`, [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Antrian tidak ditemukan' });

    const antrian = rows[0];
    if (antrian.status !== 'menunggu') return res.status(400).json({ error: 'Hanya status menunggu yang dapat dipanggil' });

    const updateQuery = montir_id 
      ? `UPDATE antrian SET status = 'dipanggil', montir_id = ? WHERE id = ?`
      : `UPDATE antrian SET status = 'dipanggil' WHERE id = ?`;
    const updateParams = montir_id ? [montir_id, id] : [id];

    await pool.query(updateQuery, updateParams);

    await pool.query(
      `INSERT INTO notifikasi (antrian_id, pesan, tipe) VALUES (?, ?, 'panggilan')`,
      [id, `🔔 Nomor antrian ${antrian.nomor_antrian} dipanggil! Segera menuju loket pelayanan.`]
    );

    res.json({ success: true, message: `Antrian ${antrian.nomor_antrian} berhasil dipanggil` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// PUT /api/antrian/:id/dilayani — Admin/Montir: set sedang_dilayani
router.put('/:id/dilayani', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'montir') {
    return res.status(403).json({ error: 'Forbidden: Hanya admin atau montir yang dapat memperbarui' });
  }
  const { id } = req.params;
  try {
    await pool.query(`UPDATE antrian SET status = 'sedang_dilayani' WHERE id = ? AND status = 'dipanggil'`, [id]);
    res.json({ success: true, message: 'Status diperbarui ke sedang_dilayani' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// PUT /api/antrian/:id/selesai — Admin/Montir: set selesai
router.put('/:id/selesai', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin' && req.user.role !== 'montir') {
    return res.status(403).json({ error: 'Forbidden: Hanya admin atau montir yang dapat memperbarui' });
  }
  const { id } = req.params;
  try {
    await pool.query(`UPDATE antrian SET status = 'selesai' WHERE id = ?`, [id]);
    res.json({ success: true, message: 'Antrian selesai dilayani' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;
