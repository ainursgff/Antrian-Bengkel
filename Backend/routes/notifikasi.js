const express = require('express');
const pool = require('../db');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/notifikasi — Notifikasi milik user (via antrian)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let query, params;
    if (req.user.role === 'admin') {
      query = `SELECT n.*, a.nomor_antrian, u.nama AS nama_pelanggan
               FROM notifikasi n
               JOIN antrian a ON n.antrian_id = a.id
               JOIN users u ON a.user_id = u.id
               ORDER BY n.sent_at DESC LIMIT 30`;
      params = [];
    } else {
      query = `SELECT n.*, a.nomor_antrian
               FROM notifikasi n
               JOIN antrian a ON n.antrian_id = a.id
               WHERE a.user_id = ?
               ORDER BY n.sent_at DESC LIMIT 20`;
      params = [req.user.userId];
    }
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// PUT /api/notifikasi/:id/read — Tandai notifikasi sudah dibaca
router.put('/:id/read', authMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE notifikasi SET is_read = 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// PUT /api/notifikasi/read-all — Tandai semua sudah dibaca
router.put('/read-all', authMiddleware, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      await pool.query('UPDATE notifikasi SET is_read = 1');
    } else {
      await pool.query(
        `UPDATE notifikasi n JOIN antrian a ON n.antrian_id = a.id SET n.is_read = 1 WHERE a.user_id = ?`,
        [req.user.userId]
      );
    }
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;
