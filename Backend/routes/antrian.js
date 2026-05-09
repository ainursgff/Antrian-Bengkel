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
  const [rows] = await pool.query(
    `SELECT COUNT(*) as total FROM antrian WHERE layanan_id = ? AND tanggal = ? AND status != 'dibatalkan'`,
    [layananId, tanggal]
  );
  const seq = rows[0].total + 1;
  return `A${String(seq).padStart(3, '0')}`;
};

// GET /api/antrian — Ambil semua (admin: semua, pelanggan: milik sendiri)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query, params;

    if (req.user.role === 'admin') {
      // Admin melihat semua antrian hari ini
      const tanggal = req.query.tanggal || getTodayLocal();
      query = `
        SELECT a.*, u.nama AS nama_pelanggan, u.no_hp, l.nama_layanan, l.estimasi_menit
        FROM antrian a
        JOIN users u ON a.user_id = u.id
        JOIN layanan l ON a.layanan_id = l.id
        WHERE a.tanggal = ?
        ORDER BY a.created_at ASC
      `;
      params = [tanggal];
    } else {
      // Pelanggan hanya lihat antrian milik sendiri
      query = `
        SELECT a.*, l.nama_layanan, l.estimasi_menit
        FROM antrian a
        JOIN layanan l ON a.layanan_id = l.id
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
      SELECT a.*, l.nama_layanan, l.estimasi_menit,
             (SELECT COUNT(*) FROM antrian a2 
              WHERE a2.tanggal = a.tanggal AND a2.layanan_id = a.layanan_id 
              AND a2.status = 'menunggu' AND a2.created_at < a.created_at) AS posisi_antrian
      FROM antrian a
      JOIN layanan l ON a.layanan_id = l.id
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
  const { layanan_id, catatan } = req.body;

  if (!layanan_id) {
    return res.status(400).json({ error: 'Layanan wajib dipilih' });
  }

  try {
    const tanggal = getTodayLocal();
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0=Minggu, 1=Senin, dst.

    // Cek jadwal operasional hari ini
    const [jadwalRows] = await pool.query(
      'SELECT * FROM jadwal_operasional WHERE hari = ? AND is_libur = 0 LIMIT 1',
      [dayOfWeek]
    );
    if (jadwalRows.length === 0) {
      return res.status(400).json({ error: 'Maaf, bengkel sedang libur hari ini.' });
    }

    const jadwal = jadwalRows[0];

    // Cek apakah user sudah punya antrian aktif hari ini untuk layanan ini
    const [existingAntrian] = await pool.query(
      `SELECT id FROM antrian WHERE user_id = ? AND tanggal = ? AND status IN ('menunggu','dipanggil','sedang_dilayani')`,
      [req.user.userId, tanggal]
    );
    if (existingAntrian.length > 0) {
      return res.status(409).json({ error: 'Anda masih memiliki antrian aktif hari ini.' });
    }

    // Cek layanan aktif
    const [layananRows] = await pool.query('SELECT * FROM layanan WHERE id = ? AND is_aktif = 1', [layanan_id]);
    if (layananRows.length === 0) {
      return res.status(404).json({ error: 'Layanan tidak ditemukan atau tidak aktif' });
    }

    // Generate nomor antrian
    const nomor_antrian = await generateNomorAntrian(layanan_id, tanggal);

    // Hitung estimasi slot waktu berdasarkan posisi antrian
    const [totalToday] = await pool.query(
      `SELECT COUNT(*) as total FROM antrian WHERE layanan_id = ? AND tanggal = ? AND status != 'dibatalkan'`,
      [layanan_id, tanggal]
    );
    const posisi = totalToday[0].total;
    const jamBuka = jadwal.jam_buka.split(':').map(Number);
    const estimasiMenit = layananRows[0].estimasi_menit || 30;
    const slotMinutes = jamBuka[0] * 60 + jamBuka[1] + posisi * estimasiMenit;
    const slotH = Math.floor(slotMinutes / 60);
    const slotM = slotMinutes % 60;
    const slot_waktu = `${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}:00`;

    // Simpan antrian
    const [result] = await pool.query(
      `INSERT INTO antrian (user_id, layanan_id, jadwal_id, nomor_antrian, tanggal, slot_waktu, status, catatan)
       VALUES (?, ?, ?, ?, ?, ?, 'menunggu', ?)`,
      [req.user.userId, layanan_id, jadwal.id, nomor_antrian, tanggal, slot_waktu, catatan || null]
    );

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
        tanggal,
        slot_waktu,
        status: 'menunggu'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// PUT /api/antrian/:id/batalkan — UC5: Batalkan antrian (pelanggan)
router.put('/:id/batalkan', authMiddleware, async (req, res) => {
  const { id } = req.params;

  try {
    // Pastikan antrian milik user dan status masih menunggu
    const [rows] = await pool.query(
      `SELECT a.*, l.nama_layanan FROM antrian a JOIN layanan l ON a.layanan_id = l.id WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) return res.status(404).json({ error: 'Antrian tidak ditemukan' });

    const antrian = rows[0];

    // Pelanggan hanya bisa batalkan milik sendiri; admin bisa batalkan semua
    if (req.user.role !== 'admin' && antrian.user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Anda tidak berhak membatalkan antrian ini' });
    }

    if (!['menunggu', 'dipanggil'].includes(antrian.status)) {
      return res.status(400).json({ error: `Antrian berstatus '${antrian.status}' tidak dapat dibatalkan` });
    }

    await pool.query(`UPDATE antrian SET status = 'dibatalkan' WHERE id = ?`, [id]);

    // Buat notifikasi pembatalan
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

// PUT /api/antrian/:id/panggil — UC8: Panggil antrian (admin)
router.put('/:id/panggil', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT a.*, l.nama_layanan FROM antrian a JOIN layanan l ON a.layanan_id = l.id WHERE a.id = ?`, [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'Antrian tidak ditemukan' });

    const antrian = rows[0];
    if (antrian.status !== 'menunggu') {
      return res.status(400).json({ error: `Status antrian saat ini: ${antrian.status}` });
    }

    await pool.query(`UPDATE antrian SET status = 'dipanggil' WHERE id = ?`, [id]);

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

// PUT /api/antrian/:id/dilayani — Admin: set sedang_dilayani
router.put('/:id/dilayani', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(`UPDATE antrian SET status = 'sedang_dilayani' WHERE id = ? AND status = 'dipanggil'`, [id]);
    res.json({ success: true, message: 'Status diperbarui ke sedang_dilayani' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// PUT /api/antrian/:id/selesai — Admin: set selesai
router.put('/:id/selesai', adminMiddleware, async (req, res) => {
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
