const express = require('express');
const pool = require('../db');
const { adminMiddleware } = require('../middleware/auth');
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

// GET /api/laporan — UC10: Laporan antrian (admin)
router.get('/', adminMiddleware, async (req, res, next) => {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    // Statistik hari ini
    const [todayStatsRows] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'menunggu') AS menunggu,
        SUM(status = 'dipanggil') AS dipanggil,
        SUM(status = 'sedang_dilayani') AS sedang_dilayani,
        SUM(status = 'selesai') AS selesai,
        SUM(status = 'dibatalkan') AS dibatalkan
      FROM antrian WHERE tanggal = ?
    `, [todayStr]);
    const todayStats = todayStatsRows[0] || {};

    // Total pendapatan (Total income from completed services)
    const [incomeRows] = await pool.query(`
      SELECT IFNULL(SUM(l.harga), 0) AS total_pendapatan
      FROM antrian_layanan al
      JOIN antrian a ON al.antrian_id = a.id
      JOIN layanan l ON al.layanan_id = l.id
      WHERE a.status = 'selesai'
    `);
    const totalPendapatan = incomeRows[0].total_pendapatan;

    // Total servis selesai (all time)
    const [totalSelesaiRows] = await pool.query(`
      SELECT COUNT(*) AS count FROM antrian WHERE status = 'selesai'
    `);
    const totalSelesai = totalSelesaiRows[0].count;

    // Statistik per layanan hari ini (100% Normalized Relational Pivot)
    const [perLayanan] = await pool.query(`
      SELECT l.nama_layanan, COUNT(a.id) AS total,
             SUM(a.status = 'selesai') AS selesai,
             SUM(a.status = 'menunggu') AS menunggu
      FROM antrian_layanan al
      JOIN antrian a ON al.antrian_id = a.id
      JOIN layanan l ON al.layanan_id = l.id
      WHERE a.tanggal = ?
      GROUP BY l.id, l.nama_layanan
      ORDER BY total DESC
    `, [todayStr]);

    // 7 hari terakhir
    const [weekStats] = await pool.query(`
      SELECT tanggal, COUNT(*) AS total, SUM(status='selesai') AS selesai
      FROM antrian
      WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY tanggal ORDER BY tanggal ASC
    `);

    return sendResponse(res, 200, 'Laporan operasional hari ini berhasil dimuat.', {
      total_pendapatan: totalPendapatan,
      total_selesai: totalSelesai,
      hari_ini: {
        tanggal: todayStr,
        ...todayStats
      },
      per_layanan: perLayanan,
      mingguan: weekStats
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
