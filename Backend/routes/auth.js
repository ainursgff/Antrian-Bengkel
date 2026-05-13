const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { addToken, removeToken, adminMiddleware, generateToken } = require('../middleware/auth');

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

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru (role default: pelanggan)
    const [result] = await pool.query(
      'INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)',
      [nama, email, hashedPassword, no_hp || null, 'pelanggan']
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
      'SELECT * FROM users WHERE email = ? AND is_aktif = 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Email atau password salah' });
    }
    const token = generateToken({
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

// POST /api/auth/forgot-password — Cek email untuk reset password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, error: 'Email wajib diisi' });
  }

  try {
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ? AND is_aktif = 1', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Email tidak ditemukan di sistem' });
    }
    return res.json({ success: true, message: 'Email terverifikasi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// POST /api/auth/reset-password — Ubah password baru berdasarkan email
router.post('/reset-password', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email dan password baru wajib diisi' });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = ? WHERE email = ?', [hashedPassword, email]);
    return res.json({ success: true, message: 'Password Anda berhasil diperbarui!' });
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

// GET /api/auth/montir
router.get('/montir', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nama FROM users WHERE role = 'montir'");
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Terjadi kesalahan server' });
  }
});

// GET /api/auth/users — Admin: Dapatkan daftar semua pengguna
router.get('/users', adminMiddleware, async (req, res) => {
  try {
    const q = `
      SELECT u.id, u.nama, u.email, u.no_hp, u.role,
             (SELECT COUNT(*) FROM antrian a WHERE a.montir_id = u.id AND a.status IN ('dipanggil', 'sedang_dilayani')) AS is_busy,
             (SELECT a.nomor_antrian FROM antrian a WHERE a.montir_id = u.id AND a.status IN ('dipanggil', 'sedang_dilayani') LIMIT 1) AS active_antrian_nomor,
             (SELECT a.kendaraan FROM antrian a WHERE a.montir_id = u.id AND a.status IN ('dipanggil', 'sedang_dilayani') LIMIT 1) AS active_kendaraan
      FROM users u 
      ORDER BY u.nama ASC
    `;
    const [rows] = await pool.query(q);
    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Gagal mengambil data pengguna' });
  }
});

// POST /api/auth/users — Admin: Tambah akun baru
router.post('/users', adminMiddleware, async (req, res) => {
  const { nama, email, password, no_hp, role } = req.body;

  if (!nama || !email || !password || !role) {
    return res.status(400).json({ error: 'Nama, email, password, dan role wajib diisi' });
  }

  if (!['admin', 'pelanggan', 'montir'].includes(role)) {
    return res.status(400).json({ error: 'Role tidak valid' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email sudah terdaftar. Silakan gunakan email lain.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)',
      [nama, email, hashedPassword, no_hp || null, role]
    );

    res.status(201).json({
      success: true,
      message: 'Akun berhasil ditambahkan oleh admin.',
      userId: result.insertId
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// PUT /api/auth/users/:id/role — Admin: Perbarui role pengguna
router.put('/users/:id/role', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'pelanggan', 'montir'].includes(role)) {
    return res.status(400).json({ error: 'Role tidak valid' });
  }

  try {
    await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, id]);
    res.json({ success: true, message: 'Role berhasil diperbarui' });
  } catch (error) {
    res.status(500).json({ error: 'Gagal memperbarui role' });
  }
});

// PUT /api/auth/users/:id — Admin: Perbarui data pengguna (nama, email, no_hp, role, password jika diisi)
router.put('/users/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  const { nama, email, no_hp, role, password } = req.body;

  if (!nama || !email || !role) {
    return res.status(400).json({ error: 'Nama, email, dan role wajib diisi' });
  }

  if (!['admin', 'pelanggan', 'montir'].includes(role)) {
    return res.status(400).json({ error: 'Role tidak valid' });
  }

  try {
    // Cek duplikasi email dengan user lain
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'Email sudah terdaftar pada pengguna lain.' });
    }

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET nama = ?, email = ?, no_hp = ?, role = ?, password = ? WHERE id = ?",
        [nama, email, no_hp || null, role, hashedPassword, id]
      );
    } else {
      await pool.query(
        "UPDATE users SET nama = ?, email = ?, no_hp = ?, role = ? WHERE id = ?",
        [nama, email, no_hp || null, role, id]
      );
    }

    res.json({ success: true, message: 'Data pengguna berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal memperbarui data pengguna' });
  }
});

// DELETE /api/auth/users/:id — Admin: Hapus akun pengguna
router.delete('/users/:id', adminMiddleware, async (req, res) => {
  const { id } = req.params;
  try {
    // Set montir_id ke NULL terlebih dahulu di tabel antrian jika user ini dibusy-kan
    await pool.query("UPDATE antrian SET montir_id = NULL WHERE montir_id = ?", [id]);
    
    // Hapus dari tabel users
    await pool.query("DELETE FROM users WHERE id = ?", [id]);
    res.json({ success: true, message: 'Akun pengguna berhasil dihapus' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Gagal menghapus akun pengguna' });
  }
});

module.exports = router;
