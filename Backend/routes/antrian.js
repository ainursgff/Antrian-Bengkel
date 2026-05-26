// FILE: backend/routes/antrian.js
/**
 * Route Handler for "Antrian" (Queue management)
 * Centralizes all queue-related operations with strictly enforced business rules.
 * Integrated with centralized DateService, auto cleanup, and archiving routines.
 * 100% normalized relational joins, transactional row locks, and standardised payloads.
 */

const express = require('express');
const pool = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const DateService = require('../services/date.service');
const cleanupExpiredQueues = require('../jobs/cleanupExpiredQueues');
const MechanicAssignmentService = require('../services/mechanicAssignment.service');
const { AppError } = require('../middleware/errorHandler');

const router = express.Router();

// Helper to standardise successful responses
const sendResponse = (res, statusCode, message, data = null, meta = {}) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    errors: [],
    meta: {
      timestamp: new Date().toISOString(),
      ...meta
    }
  });
};

// ==========================================
// CENTRALIZED SQL SUB-QUERIES (100% Normalized)
// ==========================================

const LAYANAN_SUBQUERIES = `
  (SELECT GROUP_CONCAT(l.nama_layanan SEPARATOR ', ') 
   FROM antrian_layanan al 
   JOIN layanan l ON al.layanan_id = l.id 
   WHERE al.antrian_id = a.id) AS nama_layanan,
   
  (SELECT SUM(l.estimasi_menit) 
   FROM antrian_layanan al 
   JOIN layanan l ON al.layanan_id = l.id 
   WHERE al.antrian_id = a.id) AS estimasi_menit,
   
  (SELECT SUM(l.harga) 
   FROM antrian_layanan al 
   JOIN layanan l ON al.layanan_id = l.id 
   WHERE al.antrian_id = a.id) AS total_harga,
   
  (SELECT GROUP_CONCAT(CONCAT(l.nama_layanan, ' (Rp ', l.harga, ')') SEPARATOR ', ') 
   FROM antrian_layanan al 
   JOIN layanan l ON al.layanan_id = l.id 
   WHERE al.antrian_id = a.id) AS rincian_harga
`;

const LAYANAN_ARCHIVE_SUBQUERIES = `
  (SELECT GROUP_CONCAT(l.nama_layanan SEPARATOR ', ') 
   FROM antrian_layanan_archive al 
   JOIN layanan l ON al.layanan_id = l.id 
   WHERE al.antrian_id = a.id) AS nama_layanan,
   
  (SELECT SUM(l.estimasi_menit) 
   FROM antrian_layanan_archive al 
   JOIN layanan l ON al.layanan_id = l.id 
   WHERE al.antrian_id = a.id) AS estimasi_menit,
   
  (SELECT SUM(l.harga) 
   FROM antrian_layanan_archive al 
   JOIN layanan l ON al.layanan_id = l.id 
   WHERE al.antrian_id = a.id) AS total_harga,
   
  (SELECT GROUP_CONCAT(CONCAT(l.nama_layanan, ' (Rp ', l.harga, ')') SEPARATOR ', ') 
   FROM antrian_layanan_archive al 
   JOIN layanan l ON al.layanan_id = l.id 
   WHERE al.antrian_id = a.id) AS rincian_harga
`;

// ==========================================
// ACTIVITY LOGGER HELPER
// ==========================================
async function logActivity(connOrPool, antrianId, statusSebelumnya, statusBaru, actorId, catatan = null) {
  try {
    await connOrPool.query(
      `INSERT INTO service_activity_logs (antrian_id, status_sebelumnya, status_baru, actor_id, catatan)
       VALUES (?, ?, ?, ?, ?)`,
      [antrianId, statusSebelumnya, statusBaru, actorId, catatan]
    );
  } catch (e) {
    console.error('[ActivityLogWarning] Failed to write activity log:', e);
  }
}

/**
 * GET /api/antrian
 * Retrieves list of queues based on role with dynamic auto-cleanup trigger.
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    await cleanupExpiredQueues();

    const todayStr = DateService.getTodayLocal();
    const targetDate = req.query.tanggal || todayStr;
    const { role, userId } = req.user;

    let query;
    let params;

    if (role === 'admin') {
      query = `
        SELECT a.*, u.nama AS nama_pelanggan, u.no_hp, u.email, m.nama AS nama_montir, ${LAYANAN_SUBQUERIES}
        FROM antrian a
        JOIN users u ON a.user_id = u.id
        LEFT JOIN users m ON a.montir_id = m.id
        WHERE a.tanggal = ?
        ORDER BY a.created_at ASC
      `;
      params = [targetDate];
    } else if (role === 'montir') {
      query = `
        SELECT a.*, u.nama AS nama_pelanggan, u.no_hp, u.email, ${LAYANAN_SUBQUERIES}
        FROM antrian a
        JOIN users u ON a.user_id = u.id
        WHERE a.tanggal = ? AND a.montir_id = ?
        ORDER BY a.created_at ASC
      `;
      params = [targetDate, userId];
    } else {
      query = `
        SELECT a.*, ${LAYANAN_SUBQUERIES}
        FROM antrian a
        WHERE a.user_id = ?
        ORDER BY a.created_at DESC
        LIMIT 10
      `;
      params = [userId];
    }

    const [rows] = await pool.query(query, params);
    return sendResponse(res, 200, 'Data antrian berhasil dimuat.', rows);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/antrian/riwayat
 * Customer Service History (Fetches recent AND archived queues in a optimized UNION query)
 */
router.get('/riwayat', authMiddleware, async (req, res, next) => {
  const { userId } = req.user;

  try {
    const query = `
      SELECT a.id, a.nomor_antrian, a.tanggal, a.slot_waktu, a.status, a.catatan, a.kendaraan, a.created_at,
             'active' AS origin,
             (SELECT GROUP_CONCAT(l.nama_layanan SEPARATOR ', ') FROM antrian_layanan al JOIN layanan l ON al.layanan_id = l.id WHERE al.antrian_id = a.id) AS nama_layanan,
             (SELECT SUM(l.harga) FROM antrian_layanan al JOIN layanan l ON al.layanan_id = l.id WHERE al.antrian_id = a.id) AS total_harga,
             m.nama AS nama_montir
      FROM antrian a
      LEFT JOIN users m ON a.montir_id = m.id
      WHERE a.user_id = ? AND a.status IN ('selesai', 'dibatalkan', 'expired')
      ORDER BY tanggal DESC, created_at DESC;
    `;
    const [rows] = await pool.query(query, [userId]);
    return sendResponse(res, 200, 'Riwayat servis pelanggan berhasil dimuat.', rows);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/antrian/archive
 * Operational Archive for Admin
 */
router.get('/archive', adminMiddleware, async (req, res, next) => {
  const { search, month, limit = 15, offset = 0 } = req.query;

  try {
    let query = `
      SELECT a.*, u.nama AS nama_pelanggan, u.no_hp, u.email, m.nama AS nama_montir,
             ${LAYANAN_SUBQUERIES}
      FROM antrian a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users m ON a.montir_id = m.id
      WHERE a.status IN ('selesai', 'dibatalkan', 'expired')
    `;
    const params = [];

    if (month && month.trim().length > 0) {
      query += ` AND a.tanggal LIKE ?`;
      params.push(`${month}%`);
    }

    if (search && search.trim().length > 0) {
      query += ` AND (u.nama LIKE ? OR a.kendaraan LIKE ? OR a.nomor_antrian LIKE ? OR m.nama LIKE ?)`;
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    let countQuery = `
      SELECT COUNT(*) as total FROM antrian a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN users m ON a.montir_id = m.id
      WHERE a.status IN ('selesai', 'dibatalkan', 'expired')
    `;
    const countParams = [...params];

    if (month && month.trim().length > 0) {
      countQuery += ` AND a.tanggal LIKE ?`;
    }
    if (search && search.trim().length > 0) {
      countQuery += ` AND (u.nama LIKE ? OR a.kendaraan LIKE ? OR a.nomor_antrian LIKE ? OR m.nama LIKE ?)`;
    }

    const [countResult] = await pool.query(countQuery, countParams);
    const total = countResult[0].total;

    query += ` ORDER BY a.tanggal DESC, a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));

    const [rows] = await pool.query(query, params);

    return res.status(200).json({
      success: true,
      message: 'Arsip operasional berhasil dimuat.',
      total,
      limit: parseInt(limit),
      offset: parseInt(offset),
      data: rows
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/antrian/archive/run
 * Run archiving system simulation manually
 */
router.post('/archive/run', adminMiddleware, async (req, res, next) => {
  try {
    return res.status(200).json({ success: true, archivedCount: 0, message: 'Arsip sudah disatukan ke tabel utama secara real-time.' });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/antrian/activity-logs
 * Fetch all service activity logs (audit log system)
 */
router.get('/activity-logs', adminMiddleware, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT at.*, u.nama AS actor_nama, u.email AS actor_email
      FROM audit_trails at
      LEFT JOIN users u ON at.performed_by = CAST(u.id AS CHAR)
      ORDER BY at.created_at DESC
      LIMIT 100
    `);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/antrian/aktif
 * Returns the currently active queue for the customer
 */
router.get('/aktif', authMiddleware, async (req, res, next) => {
  try {
    await cleanupExpiredQueues();
    const todayStr = DateService.getTodayLocal();

    const query = `
      SELECT a.*, ${LAYANAN_SUBQUERIES},
             (SELECT COUNT(*) FROM antrian a2 
              WHERE a2.tanggal = a.tanggal AND a2.status = 'menunggu' AND a2.created_at < a.created_at) AS posisi_antrian
      FROM antrian a
      WHERE a.user_id = ? 
        AND a.status IN ('menunggu','dipanggil','sedang_dilayani','menunggu_verifikasi_pelanggan','revisi_servis')
        AND a.tanggal >= ?
      ORDER BY a.created_at DESC LIMIT 1
    `;
    const [rows] = await pool.query(query, [req.user.userId, todayStr]);
    return sendResponse(res, 200, 'Antrian aktif pelanggan berhasil dimuat.', rows.length > 0 ? rows[0] : null);
  } catch (error) {
    return next(error);
  }
});

/**
 * POST /api/antrian
 * Takes a new queue number for the customer
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    await cleanupExpiredQueues();
    const { layanan_id, kendaraan, catatan } = req.body;

    if (!layanan_id || (Array.isArray(layanan_id) && layanan_id.length === 0)) {
      return next(new AppError('Pilih minimal satu layanan.', 400));
    }

    const layananIdsStr = Array.isArray(layanan_id) ? layanan_id.join(',') : layanan_id;
    const individualLayananIds = layananIdsStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));

    const [servicesInfo] = await pool.query(
      'SELECT id, kategori_id, is_aktif FROM layanan WHERE id IN (?)',
      [individualLayananIds]
    );

    if (servicesInfo.length !== individualLayananIds.length) {
      return next(new AppError('Salah satu atau lebih layanan yang dipilih tidak valid.', 400));
    }

    const inactiveService = servicesInfo.find(s => s.is_aktif === 0);
    if (inactiveService) {
      return next(new AppError('Salah satu layanan yang dipilih sedang dinonaktifkan.', 400));
    }

    const firstKategoriId = servicesInfo[0].kategori_id;
    const isMultiCategory = servicesInfo.some(s => s.kategori_id !== firstKategoriId);
    if (isMultiCategory) {
      return next(new AppError('Maaf, semua layanan yang dipilih wajib berada pada kategori kendaraan yang sama!', 400));
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      let targetTanggal = DateService.getTodayLocal();
      const jakartaParts = DateService.getJakartaParts();
      
      const targetDay = new Date(DateService.toTimestampWIB());
      const dayOfWeek = targetDay.getDay(); 
      let isBookingBesok = false;

      const [jadwalRows] = await conn.query(
        'SELECT * FROM jadwal_operasional WHERE hari = ? AND is_libur = 0 LIMIT 1',
        [dayOfWeek]
      );

      if (jadwalRows.length === 0) {
        isBookingBesok = true;
      } else {
        const { jam_tutup } = jadwalRows[0];
        const [tutupJam, tutupMenit] = jam_tutup.split(':').map(Number);
        const jamTutupMinutes = tutupJam * 60 + tutupMenit;
        const currentMinutes = jakartaParts.hour * 60 + jakartaParts.minute;

        if (currentMinutes >= (jamTutupMinutes - 30)) {
          isBookingBesok = true;
        }
      }

      let targetDayOfWeek = dayOfWeek;
      if (isBookingBesok) {
        targetTanggal = DateService.getBesokLocal();
        const besokDate = new Date(targetTanggal);
        targetDayOfWeek = besokDate.getDay();
      }

      const [targetJadwalRows] = await conn.query(
        'SELECT * FROM jadwal_operasional WHERE hari = ? AND is_libur = 0 LIMIT 1',
        [targetDayOfWeek]
      );

      if (targetJadwalRows.length === 0) {
        throw new AppError('Maaf, bengkel libur pada hari target booking tersebut.', 400);
      }

      const targetJadwal = targetJadwalRows[0];
      const [bukaJam, bukaMenit] = targetJadwal.jam_buka.split(':').map(Number);
      const jamBukaMinutes = bukaJam * 60 + bukaMenit;
      const [tutupJam, tutupMenit] = targetJadwal.jam_tutup.split(':').map(Number);
      const jamTutupMinutes = tutupJam * 60 + tutupMenit;

      const [existingAntrian] = await conn.query(
        `SELECT id FROM antrian 
         WHERE user_id = ? 
           AND status IN ('menunggu','dipanggil','sedang_dilayani','menunggu_verifikasi_pelanggan','revisi_servis')
           AND tanggal >= ?
         FOR UPDATE`,
        [req.user.userId, DateService.getTodayLocal()]
      );

      if (existingAntrian.length > 0) {
        throw new AppError('Anda masih memiliki antrian aktif. Mohon selesaikan atau batalkan antrian Anda terlebih dahulu.', 409);
      }

      const [layananRows] = await conn.query(
        `SELECT SUM(estimasi_menit) as estimasi_menit, GROUP_CONCAT(nama_layanan SEPARATOR ', ') as nama_layanan 
         FROM layanan WHERE id IN (?) AND is_aktif = 1`,
        [individualLayananIds]
      );

      const estimasiMenit = Number(layananRows[0].estimasi_menit) || 30;

      const [countRows] = await conn.query(
        'SELECT COUNT(*) as total FROM antrian WHERE tanggal = ? FOR UPDATE',
        [targetTanggal]
      );
      const seq = countRows[0].total + 1;
      const nomor_antrian = `A${String(seq).padStart(3, '0')}`;

      const [totalWaktuRows] = await conn.query(
        `SELECT SUM(l.estimasi_menit) as total_menit 
         FROM antrian_layanan al 
         JOIN layanan l ON al.layanan_id = l.id
         JOIN antrian a ON al.antrian_id = a.id
         WHERE a.tanggal = ? AND a.status != 'dibatalkan'`,
        [targetTanggal]
      );

      const totalMenitTarget = Number(totalWaktuRows[0].total_menit) || 0;
      const kuotaMontir = targetJadwal.kuota_per_slot || 1;
      const baseMinutes = jamBukaMinutes + Math.floor(totalMenitTarget / kuotaMontir);

      const currentMinutesNow = jakartaParts.hour * 60 + jakartaParts.minute;
      const slotMinutes = isBookingBesok ? baseMinutes : Math.max(baseMinutes, currentMinutesNow);

      if ((slotMinutes + estimasiMenit) > jamTutupMinutes) {
        throw new AppError('Antrian hari ini sudah penuh (melewati jam operasional).', 400);
      }

      const slotH = Math.floor(slotMinutes / 60);
      const slotM = slotMinutes % 60;
      const slot_waktu = `${String(slotH).padStart(2, '0')}:${String(slotM).padStart(2, '0')}:00`;

      // Insert antrian (Note: dropped redundant layanan_id VARCHAR column in migration)
      const [result] = await conn.query(
        `INSERT INTO antrian (user_id, kendaraan, jadwal_id, nomor_antrian, tanggal, slot_waktu, status, catatan)
         VALUES (?, ?, ?, ?, ?, ?, 'menunggu', ?)`,
        [req.user.userId, kendaraan || null, targetJadwal.id, nomor_antrian, targetTanggal, slot_waktu, catatan || null]
      );

      // Write N-to-N normalized relations
      for (const lid of individualLayananIds) {
        await conn.query(
          'INSERT INTO antrian_layanan (antrian_id, layanan_id) VALUES (?, ?)',
          [result.insertId, lid]
        );
      }

      await conn.query(
        `INSERT INTO notifikasi (antrian_id, pesan, tipe) VALUES (?, ?, 'konfirmasi')`,
        [result.insertId, `Nomor antrian Anda: ${nomor_antrian} untuk layanan ${layananRows[0].nama_layanan}. Estimasi mulai: ${slot_waktu.substring(0,5)} WIB.`]
      );

      await logActivity(conn, result.insertId, null, 'menunggu', req.user.userId, 'Antrian baru berhasil dibuat');

      await conn.commit();

      return sendResponse(res, 201, 'Nomor antrian berhasil diambil!', {
        id: result.insertId,
        nomor_antrian,
        layanan: layananRows[0].nama_layanan,
        tanggal: targetTanggal,
        slot_waktu,
        status: 'menunggu'
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/antrian/:id/batalkan
 * Cancels a queue booking.
 */
router.put('/:id/batalkan', authMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { role, userId } = req.user;

  try {
    const [rows] = await pool.query(
      `SELECT a.*, 
              (SELECT GROUP_CONCAT(l.nama_layanan SEPARATOR ', ') FROM antrian_layanan al JOIN layanan l ON al.layanan_id = l.id WHERE al.antrian_id = a.id) AS nama_layanan
       FROM antrian a WHERE a.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return next(new AppError('Antrian tidak ditemukan.', 404));
    }

    const antrian = rows[0];

    if (role !== 'admin' && antrian.user_id !== userId) {
      return next(new AppError('Anda tidak memiliki hak untuk membatalkan antrian ini.', 403));
    }

    if (!['menunggu', 'dipanggil'].includes(antrian.status)) {
      return next(new AppError(`Antrian dengan status '${antrian.status}' tidak dapat dibatalkan.`, 400));
    }

    if (role !== 'admin') {
      const createdTime = new Date(antrian.created_at).getTime();
      const now = new Date().getTime();
      if ((now - createdTime) > 180000) {
        return next(new AppError('Batas waktu pembatalan mandiri (maksimal 3 menit) telah habis.', 400));
      }
    }

    await pool.query(`UPDATE antrian SET status = 'dibatalkan' WHERE id = ?`, [id]);

    await pool.query(
      `INSERT INTO notifikasi (antrian_id, pesan, tipe) VALUES (?, ?, 'pembatalan')`,
      [id, `Antrian ${antrian.nomor_antrian} untuk ${antrian.nama_layanan} telah dibatalkan.`]
    );

    await logActivity(pool, id, antrian.status, 'dibatalkan', userId, `Dibatalkan oleh ${role === 'admin' ? 'Admin' : 'Pelanggan'}`);

    return sendResponse(res, 200, 'Antrian berhasil dibatalkan.');
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/antrian/:id/panggil
 * UC9: Calls queue (Admin only)
 * Employs STRICT row-locking transaction to protect mechanic concurrency constraints
 */
router.put('/:id/panggil', adminMiddleware, async (req, res, next) => {
  const { id } = req.params;
  let { montir_id } = req.body || {};

  if (!montir_id) {
    try {
      const [rows] = await pool.query('SELECT montir_id FROM antrian WHERE id = ?', [id]);
      if (rows.length > 0 && rows[0].montir_id) {
        montir_id = rows[0].montir_id;
      } else {
        return next(new AppError('Pilih montir terlebih dahulu untuk melayani.', 400));
      }
    } catch (dbErr) {
      return next(dbErr);
    }
  }

  try {
    const result = await MechanicAssignmentService.assignMechanicSafely(id, montir_id);
    return sendResponse(res, 200, `Antrian berhasil dipanggil. Montir ${result.montirName} telah ditugaskan.`, result);
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/antrian/:id/dilayani
 * Updates queue status to 'sedang_dilayani'
 */
router.put('/:id/dilayani', authMiddleware, async (req, res, next) => {
  const { role, userId } = req.user;

  if (role !== 'admin' && role !== 'montir') {
    return next(new AppError('Akses ditolak.', 403));
  }

  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT montir_id, status FROM antrian WHERE id = ?', [id]);
    if (rows.length === 0) return next(new AppError('Antrian tidak ditemukan.', 404));

    const antrian = rows[0];

    if (role === 'montir' && antrian.montir_id !== userId) {
      return next(new AppError('Akses ditolak: Anda hanya dapat memperbarui antrian yang ditugaskan kepada Anda.', 403));
    }

    if (antrian.status !== 'dipanggil' && antrian.status !== 'revisi_servis') {
      return next(new AppError('Antrian hanya dapat dilayani setelah statusnya dipanggil atau direvisi.', 400));
    }

    await pool.query(`UPDATE antrian SET status = 'sedang_dilayani' WHERE id = ?`, [id]);

    await logActivity(pool, id, antrian.status, 'sedang_dilayani', userId, 'Servis fisik kendaraan dimulai');

    return sendResponse(res, 200, 'Antrian sedang dilayani.');
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/antrian/:id/selesai
 * Complete queue (Admin / Montir)
 */
router.put('/:id/selesai', authMiddleware, async (req, res, next) => {
  const { role, userId } = req.user;

  if (role !== 'admin' && role !== 'montir') {
    return next(new AppError('Akses ditolak.', 403));
  }

  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT montir_id, status FROM antrian WHERE id = ?', [id]);
    if (rows.length === 0) return next(new AppError('Antrian tidak ditemukan.', 404));

    const antrian = rows[0];

    if (role === 'montir' && antrian.montir_id !== userId) {
      return next(new AppError('Akses ditolak: Anda hanya dapat memperbarui antrian yang ditugaskan kepada Anda.', 403));
    }

    if (antrian.status !== 'sedang_dilayani') {
      return next(new AppError('Antrian hanya dapat diselesaikan saat sedang dilayani.', 400));
    }

    await pool.query(`UPDATE antrian SET status = 'menunggu_verifikasi_pelanggan' WHERE id = ?`, [id]);
    
    await pool.query(
      `INSERT INTO notifikasi (antrian_id, pesan, tipe) VALUES (?, ?, 'verifikasi')`,
      [id, `🛠️ Servis kendaraan Anda selesai dikerjakan! Mohon lakukan verifikasi & persetujuan hasil pengerjaan.`]
    );

    await logActivity(pool, id, antrian.status, 'menunggu_verifikasi_pelanggan', userId, 'Menunggu persetujuan kualitas pengerjaan oleh pelanggan');

    return sendResponse(res, 200, 'Antrian selesai dikerjakan, menunggu verifikasi pelanggan.');
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/antrian/:id/verifikasi
 * UC11: Customer verifies and approves the completed service
 */
router.put('/:id/verifikasi', authMiddleware, async (req, res, next) => {
  const { role, userId } = req.user;
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT user_id, status FROM antrian WHERE id = ?', [id]);
    if (rows.length === 0) return next(new AppError('Antrian tidak ditemukan.', 404));

    const antrian = rows[0];

    if (role !== 'admin' && antrian.user_id !== userId) {
      return next(new AppError('Akses ditolak.', 403));
    }

    if (antrian.status !== 'menunggu_verifikasi_pelanggan') {
      return next(new AppError('Antrian tidak dalam status menunggu verifikasi.', 400));
    }

    await pool.query(`UPDATE antrian SET status = 'selesai' WHERE id = ?`, [id]);
    
    await pool.query(
      `INSERT INTO notifikasi (antrian_id, pesan, tipe) VALUES (?, ?, 'selesai')`,
      [id, `🎉 Terima kasih! Servis kendaraan Anda telah diverifikasi & selesai sepenuhnya. Berkendara dengan aman!`]
    );

    await logActivity(pool, id, antrian.status, 'selesai', userId, 'Kualitas servis disetujui penuh oleh Pelanggan');

    return sendResponse(res, 200, 'Servis berhasil diverifikasi & selesai.');
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/antrian/:id/revisi
 * UC12: Customer rejects the service and requests revision
 */
router.put('/:id/revisi', authMiddleware, async (req, res, next) => {
  const { role, userId } = req.user;
  const { id } = req.params;
  const { catatan_revisi } = req.body;

  try {
    const [rows] = await pool.query('SELECT user_id, status FROM antrian WHERE id = ?', [id]);
    if (rows.length === 0) return next(new AppError('Antrian tidak ditemukan.', 404));

    const antrian = rows[0];

    if (role !== 'admin' && antrian.user_id !== userId) {
      return next(new AppError('Akses ditolak.', 403));
    }

    if (antrian.status !== 'menunggu_verifikasi_pelanggan') {
      return next(new AppError('Antrian tidak dalam status menunggu verifikasi.', 400));
    }

    await pool.query(
      `UPDATE antrian SET status = 'revisi_servis', catatan = CONCAT(IFNULL(catatan, ''), '\n[Revisi Pelanggan]: ', ?) WHERE id = ?`,
      [catatan_revisi || 'Ada bagian yang kurang pas', id]
    );

    await pool.query(
      `INSERT INTO notifikasi (antrian_id, pesan, tipe) VALUES (?, ?, 'revisi')`,
      [id, `⚠️ Pelanggan meminta revisi servis: ${catatan_revisi || 'Ada bagian yang kurang pas'}. Mohon segera ditindaklanjuti.`]
    );

    await logActivity(pool, id, antrian.status, 'revisi_servis', userId, `Revisi diajukan pelanggan: ${catatan_revisi}`);

    return sendResponse(res, 200, 'Revisi berhasil diajukan.');
  } catch (error) {
    return next(error);
  }
});

/**
 * DELETE /api/antrian/:id/hard-delete
 * UC17: Hard Delete Queue (Super Admin Only with double verification validation context)
 */
router.delete('/:id/hard-delete', adminMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { confirm_token } = req.body || {};

  if (confirm_token !== 'SUPER_CONFIRM_HARD_DELETE') {
    return next(new AppError('Token konfirmasi ganda tidak valid. Penghapusan dibatalkan.', 400));
  }

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [activeRows] = await conn.query('SELECT id FROM antrian WHERE id = ?', [id]);

    if (activeRows.length === 0) {
      await conn.rollback();
      return next(new AppError('Data antrian tidak ditemukan di database.', 404));
    }

    await conn.query('DELETE FROM notifikasi WHERE antrian_id = ?', [id]);
    await conn.query('DELETE FROM antrian_layanan WHERE antrian_id = ?', [id]);
    await conn.query('DELETE FROM antrian WHERE id = ?', [id]);

    await conn.commit();
    return sendResponse(res, 200, 'Data antrian berhasil dihapus permanen secara fisik.');
  } catch (error) {
    await conn.rollback();
    return next(error);
  } finally {
    conn.release();
  }
});

/**
 * GET /api/antrian/:id/timeline
 * Fetch full activity timeline for a specific queue
 */
router.get('/:id/timeline', authMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { role, userId } = req.user;

  try {
    // Verify ownership or admin access
    const [qRows] = await pool.query('SELECT user_id FROM antrian WHERE id = ?', [id]);
    if (qRows.length === 0) return next(new AppError('Antrian tidak ditemukan.', 404));
    if (role !== 'admin' && role !== 'montir' && qRows[0].user_id !== userId) {
      return next(new AppError('Akses ditolak.', 403));
    }

    const [logs] = await pool.query(
      `SELECT sal.*, u.nama AS actor_nama, u.role AS actor_role
       FROM service_activity_logs sal
       LEFT JOIN users u ON sal.actor_id = u.id
       WHERE sal.antrian_id = ?
       ORDER BY sal.created_at ASC`,
      [id]
    );

    return sendResponse(res, 200, 'Timeline aktivitas berhasil dimuat.', logs);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
