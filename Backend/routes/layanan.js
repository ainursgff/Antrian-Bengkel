const express = require('express');
const pool = require('../db');
const { adminMiddleware } = require('../middleware/auth');
const router = express.Router();

// GET /api/layanan — Semua layanan aktif (publik)
router.get('/', async (req, res) => {
  const { kategori_id } = req.query;
  try {
    let query = `
      SELECT l.*, k.nama_kategori 
      FROM layanan l 
      LEFT JOIN kategori_kendaraan k ON l.kategori_id = k.id 
    `;
    const params = [];
    
    if (kategori_id) {
      query += ' WHERE l.kategori_id = ? ';
      params.push(kategori_id);
    }
    
    query += ' ORDER BY l.id ASC';
    
    const [rows] = await pool.query(query, params);
    const formatted = rows.map(r => ({
      id: r.id,
      kategori_id: r.kategori_id,
      nama_layanan: r.nama_layanan,
      deskripsi: r.deskripsi,
      estimasi_menit: r.estimasi_menit,
      harga: r.harga,
      is_aktif: r.is_aktif,
      kategori: r.kategori_id ? {
        id: r.kategori_id,
        nama_kategori: r.nama_kategori
      } : null
    }));
    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/layanan — UC7: Tambah layanan (admin)
router.post('/', adminMiddleware, async (req, res) => {
  const { kategori_id, nama_layanan, deskripsi, estimasi_menit, harga, is_aktif } = req.body;
  if (!kategori_id) return res.status(400).json({ error: 'Kategori kendaraan wajib dipilih' });
  if (!nama_layanan) return res.status(400).json({ error: 'Nama layanan wajib diisi' });

  try {
    const [result] = await pool.query(
      'INSERT INTO layanan (kategori_id, nama_layanan, deskripsi, estimasi_menit, harga, is_aktif) VALUES (?, ?, ?, ?, ?, ?)',
      [kategori_id, nama_layanan, deskripsi || null, estimasi_menit || 30, harga || 0, is_aktif !== undefined ? is_aktif : 1]
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
  const { kategori_id, nama_layanan, deskripsi, estimasi_menit, harga, is_aktif } = req.body;
  if (!kategori_id) return res.status(400).json({ error: 'Kategori kendaraan wajib dipilih' });
  if (!nama_layanan) return res.status(400).json({ error: 'Nama layanan wajib diisi' });

  try {
    const [result] = await pool.query(
      'UPDATE layanan SET kategori_id=?, nama_layanan=?, deskripsi=?, estimasi_menit=?, harga=?, is_aktif=? WHERE id=?',
      [kategori_id, nama_layanan, deskripsi || null, estimasi_menit || 30, harga || 0, is_aktif !== undefined ? is_aktif : 1, id]
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
