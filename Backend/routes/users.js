// FILE: backend/routes/users.js
const express = require('express');
const pool = require('../db');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

const sendResponse = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({ success: true, message, data });
};

/**
 * GET /api/users/customers
 * Fetch all customers with rich operational insights (loyalty, last vehicle, transactions, blacklist status)
 */
router.get('/customers', adminMiddleware, async (req, res, next) => {
  try {
    const query = `
      SELECT u.id, u.nama, u.email, u.no_hp, u.role, u.is_aktif, u.is_blacklist,
             (SELECT COUNT(*) FROM antrian a WHERE a.user_id = u.id) AS total_servis,
             (SELECT a.kendaraan FROM antrian a WHERE a.user_id = u.id ORDER BY a.tanggal DESC, a.created_at DESC LIMIT 1) AS kendaraan_terakhir,
             (SELECT a.tanggal FROM antrian a WHERE a.user_id = u.id ORDER BY a.tanggal DESC, a.created_at DESC LIMIT 1) AS terakhir_datang,
             (SELECT SUM(l.harga) 
              FROM antrian a 
              JOIN antrian_layanan al ON a.id = al.antrian_id
              JOIN layanan l ON al.layanan_id = l.id
              WHERE a.user_id = u.id AND a.status = 'selesai') AS total_transaksi
      FROM users u
      WHERE u.role = 'pelanggan' AND u.is_deleted = 0
      ORDER BY total_servis DESC, u.nama ASC
    `;
    const [rows] = await pool.query(query);

    // Format fields & calculate loyalty score
    const formatted = rows.map(r => {
      const totalServis = parseInt(r.total_servis) || 0;
      let loyalty = 'Bronze Member';
      if (totalServis >= 10) loyalty = '🏆 Platinum Partner';
      else if (totalServis >= 5) loyalty = '⭐ Gold Member';
      else if (totalServis >= 2) loyalty = 'Silver Member';

      return {
        id: r.id,
        nama: r.nama,
        email: r.email,
        no_hp: r.no_hp,
        role: r.role,
        is_aktif: r.is_aktif,
        is_blacklist: r.is_blacklist || 0,
        total_servis: totalServis,
        kendaraan_terakhir: r.kendaraan_terakhir || 'Belum Ada',
        terakhir_datang: r.terakhir_datang || null,
        total_transaksi: parseInt(r.total_transaksi) || 0,
        loyalty
      };
    });

    return sendResponse(res, 200, 'Daftar pelanggan berhasil dimuat.', formatted);
  } catch (error) {
    return next(error);
  }
});

/**
 * PUT /api/users/:id/blacklist
 * Toggle customer blacklist status
 */
router.put('/:id/blacklist', adminMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { is_blacklist } = req.body;

  try {
    await pool.query('UPDATE users SET is_blacklist = ? WHERE id = ?', [is_blacklist ? 1 : 0, id]);
    return sendResponse(res, 200, `Status blacklist pengguna berhasil diperbarui.`);
  } catch (error) {
    return next(error);
  }
});

/**
 * GET /api/users/:id/history
 * Quick service history preview for a specific customer
 */
router.get('/:id/history', adminMiddleware, async (req, res, next) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query(`
      SELECT a.id, a.nomor_antrian, a.tanggal, a.status, a.kendaraan,
             (SELECT GROUP_CONCAT(l.nama_layanan SEPARATOR ', ') 
              FROM antrian_layanan al 
              JOIN layanan l ON al.layanan_id = l.id
              WHERE al.antrian_id = a.id) AS nama_layanan,
             (SELECT SUM(l.harga) 
              FROM antrian_layanan al 
              JOIN layanan l ON al.layanan_id = l.id
              WHERE al.antrian_id = a.id) AS total_harga
      FROM antrian a
      WHERE a.user_id = ?
      ORDER BY a.tanggal DESC, a.created_at DESC
      LIMIT 10
    `, [id]);

    return sendResponse(res, 200, 'Riwayat servis pelanggan berhasil dimuat.', rows);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
