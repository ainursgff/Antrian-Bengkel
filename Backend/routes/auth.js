const express = require('express');
const crypto = require('crypto');
const pool = require('../db');
const { addToken, removeToken } = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register — UC1: Daftar akun pelanggan
router.post('/register', async (req, res) => {
  const { nama, email, password, no_hp } = req.body;

  if (!nama || !email || !password) {
    return res.status(400).json({ error: 'Nama, email, dan password wajib diisi' });
  }

  try {
    // Cek email sudah dipakai
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email sudah terdaftar. Silakan gunakan email lain.' });
    }

    // Simpan user baru (role default: pelanggan)
    const [result] = await pool.query(
      'INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)',
      [nama, email, password, no_hp || null, 'pelanggan']
    );

    res.status(201).json({
      success: true,
      message: 'Akun berhasil dibuat. Silakan login.',
      userId: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/auth/login — UC2: Login pelanggan | UC6: Login admin
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan password wajib diisi' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND password = ? AND is_aktif = 1',
      [email, password]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const user = rows[0];
    const token = crypto.randomBytes(32).toString('hex');
    addToken(token, {
      userId: user.id,
      role: user.role,
      nama: user.nama,
      email: user.email,
      noHp: user.no_hp
    });

    return res.json({
      success: true,
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        no_hp: user.no_hp
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    removeToken(token);
  }
  res.json({ success: true, message: 'Logout berhasil' });
});

module.exports = router;
