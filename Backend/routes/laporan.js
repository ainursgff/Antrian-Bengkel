const express = require('express');
const pool = require('../db');
const { adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/laporan — UC10: Laporan antrian (admin)
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    // Statistik hari ini
    const [todayStats] = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'menunggu') AS menunggu,
        SUM(status = 'dipanggil') AS dipanggil,
        SUM(status = 'sedang_dilayani') AS sedang_dilayani,
        SUM(status = 'selesai') AS selesai,
        SUM(status = 'dibatalkan') AS dibatalkan
      FROM antrian WHERE tanggal = ?
    `, [todayStr]);

    // Statistik per layanan hari ini
    const [perLayanan] = await pool.query(`
      SELECT l.nama_layanan, COUNT(a.id) AS total,
             SUM(a.status = 'selesai') AS selesai,
             SUM(a.status = 'menunggu') AS menunggu
      FROM antrian a
      JOIN layanan l ON a.layanan_id = l.id
      WHERE a.tanggal = ?
      GROUP BY a.layanan_id, l.nama_layanan
      ORDER BY total DESC
    `, [todayStr]);

    // 7 hari terakhir
    const [weekStats] = await pool.query(`
      SELECT tanggal, COUNT(*) AS total, SUM(status='selesai') AS selesai
      FROM antrian
      WHERE tanggal >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY tanggal ORDER BY tanggal ASC
    `);

    res.json({
      hari_ini: {
        tanggal: todayStr,
        ...todayStats[0]
      },
      per_layanan: perLayanan,
      mingguan: weekStats
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;
