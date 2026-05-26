const express = require('express');
const pool = require('../db');
const { adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/kategori-kendaraan - Semua kategori (publik)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM kategori_kendaraan ORDER BY id ASC');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/kategori-kendaraan - Tambah kategori (admin)
router.post('/', adminMiddleware, async (req, res) => {
  const { nama_kategori, deskripsi, icon, is_active } = req.body;
  if (!nama_kategori) return res.status(400).json({ error: 'Nama kategori wajib diisi' });

  try {
    const [result] = await pool.query(
      'INSERT INTO kategori_kendaraan (nama_kategori, deskripsi, icon, is_active) VALUES (?, ?, ?, ?)',
      [nama_kategori, deskripsi || null, icon || 'directions_car', is_active !== undefined ? is_active : 1]
    );
    res.status(201).json({ success: true, message: 'Kategori berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// PUT /api/kategori-kendaraan/:id - Edit kategori (admin)
router.put('/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nama_kategori, deskripsi, icon, is_active } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE kategori_kendaraan SET nama_kategori=?, deskripsi=?, icon=?, is_active=? WHERE id=?',
      [nama_kategori, deskripsi || null, icon || 'directions_car', is_active !== undefined ? is_active : 1, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    res.json({ success: true, message: 'Kategori berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// DELETE /api/kategori-kendaraan/:id - Hapus kategori (admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM kategori_kendaraan WHERE id=?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    res.json({ success: true, message: 'Kategori berhasil dihapus' });
  } catch (error) {
    console.error(error);
    // If it's a foreign key constraint error, let the user know
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({ error: 'Kategori tidak bisa dihapus karena masih ada layanan yang menggunakannya.' });
    }
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;
