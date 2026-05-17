const express = require('express');
const pool = require('../db');
const { adminMiddleware } = require('../middleware/auth');
const router = express.Router();

const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// GET /api/jadwal — Semua jadwal (publik)
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM jadwal_operasional ORDER BY hari ASC');
    const mapped = rows.map(r => ({ ...r, nama_hari: NAMA_HARI[r.hari] }));
    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/jadwal — UC9: Tambah jadwal (admin)
router.post('/', adminMiddleware, async (req, res) => {
  const { hari, jam_buka, jam_tutup, kuota_per_slot, is_libur } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO jadwal_operasional (hari, jam_buka, jam_tutup, kuota_per_slot, is_libur) VALUES (?, ?, ?, ?, ?)',
      [hari, jam_buka, jam_tutup, kuota_per_slot || 5, is_libur || 0]
    );
    res.status(201).json({ success: true, message: 'Jadwal berhasil ditambahkan', id: result.insertId });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Jadwal untuk hari ini sudah ada' });
    }
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// PUT /api/jadwal/:id — UC9: Edit jadwal (admin)
router.put('/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { hari, jam_buka, jam_tutup, kuota_per_slot, is_libur } = req.body;
  try {
    const [result] = await pool.query(
      'UPDATE jadwal_operasional SET hari=?, jam_buka=?, jam_tutup=?, kuota_per_slot=?, is_libur=? WHERE id=?',
      [hari, jam_buka, jam_tutup, kuota_per_slot || 5, is_libur || 0, id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
    res.json({ success: true, message: 'Jadwal berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// DELETE /api/jadwal/:id — Hapus jadwal (admin)
router.delete('/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM jadwal_operasional WHERE id=?', [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Jadwal tidak ditemukan' });
    res.json({ success: true, message: 'Jadwal berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;
