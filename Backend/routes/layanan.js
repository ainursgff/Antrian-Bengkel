const express = require('express');
const pool = require('../db');
const { adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/layanan — Semua layanan aktif (publik)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM layanan ORDER BY id ASC'
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/layanan — UC7: Tambah layanan (admin)
router.post('/', adminMiddleware, async (req, res) => {
  const { nama_layanan, deskripsi, estimasi_menit, is_aktif } = req.body;
  if (!nama_layanan) return res.status(400).json({ error: 'Nama layanan wajib diisi' });

  try {
    const [result] = await pool.query(
      'INSERT INTO layanan (nama_layanan, deskripsi, estimasi_menit, is_aktif) VALUES (?, ?, ?, ?)',
      [nama_layanan, deskripsi || null, estimasi_menit || 30, is_aktif !== undefined ? is_aktif : 1]
    );
    res.status(201).json({ success: true, message: 'Layanan berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// PUT /api/layanan/:id — UC7: Edit layanan (admin)
router.put('/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nama_layanan, deskripsi, estimasi_menit, is_aktif } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE layanan SET nama_layanan=?, deskripsi=?, estimasi_menit=?, is_aktif=? WHERE id=?',
      [nama_layanan, deskripsi || null, estimasi_menit || 30, is_aktif !== undefined ? is_aktif : 1, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Layanan tidak ditemukan' });
    res.json({ success: true, message: 'Layanan berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// DELETE /api/layanan/:id — Hapus layanan (admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM layanan WHERE id=?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Layanan tidak ditemukan' });
    res.json({ success: true, message: 'Layanan berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;
