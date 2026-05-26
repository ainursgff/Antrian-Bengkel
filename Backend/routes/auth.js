// FILE: backend/routes/auth.js
const express = require('express');
const pool = require('../db');
const bcrypt = require('bcryptjs');
const { addToken, removeToken, adminMiddleware, generateToken } = require('../middleware/auth');
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

// POST /api/auth/register — UC1: Daftar akun pelanggan
router.post('/register', async (req, res, next) => {
  const { nama, email, password, no_hp } = req.body;

  if (!nama || !email || !password) {
    return next(new AppError('Nama, email, dan password wajib diisi', 400));
  }

  try {
    // Cek email sudah dipakai (excluding deleted accounts)
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND is_deleted = 0', [email]);
    if (existing.length > 0) {
      return next(new AppError('Email sudah terdaftar. Silakan gunakan email lain.', 409));
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru (role default: pelanggan)
    const [result] = await pool.query(
      'INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)',
      [nama, email, hashedPassword, no_hp || null, 'pelanggan']
    );

    return sendResponse(res, 201, 'Akun berhasil dibuat. Silakan login.', { userId: result.insertId });
  } catch (error) {
    return next(error);
  }
});

const loginLimiter = require('../middleware/loginLimiter');

// POST /api/auth/login — UC2: Login pelanggan | UC6: Login admin
router.post('/login', loginLimiter, async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Email dan password wajib diisi', 400));
  }

  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE email = ? AND is_aktif = 1 AND is_deleted = 0',
      [email]
    );

    if (rows.length === 0) {
      return next(new AppError('Email atau password salah', 401));
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return next(new AppError('Email atau password salah', 401));
    }
    
    const token = generateToken({
      userId: user.id,
      role: user.role,
      nama: user.nama,
      email: user.email,
      noHp: user.no_hp
    });

    return sendResponse(res, 200, 'Login berhasil', {
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
    return next(error);
  }
});

const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'antrian-bengkel-secret-key-2024';

// POST /api/auth/forgot-password — Cek email & no_hp untuk reset password
router.post('/forgot-password', async (req, res, next) => {
  const { email, no_hp } = req.body;
  if (!email) {
    return next(new AppError('Email wajib diisi', 400));
  }

  try {
    const [rows] = await pool.query('SELECT id, no_hp FROM users WHERE email = ? AND is_aktif = 1 AND is_deleted = 0', [email]);
    if (rows.length === 0) {
      return next(new AppError('Email tidak ditemukan di sistem', 404));
    }

    const user = rows[0];

    // If phone number is provided, verify it
    if (no_hp && user.no_hp && user.no_hp.trim() !== no_hp.trim()) {
      return next(new AppError('Nomor handphone tidak cocok dengan akun ini.', 400));
    }

    const resetToken = jwt.sign({ email: email, userId: user.id }, JWT_SECRET, { expiresIn: '10m' });

    return sendResponse(res, 200, 'Email terverifikasi. Token reset password berhasil dibuat.', { resetToken });
  } catch (error) {
    return next(error);
  }
});

// POST /api/auth/reset-password — Ubah password baru berdasarkan secure resetToken
router.post('/reset-password', async (req, res, next) => {
  const { resetToken, password } = req.body;
  if (!resetToken || !password) {
    return next(new AppError('Reset token dan password baru wajib diisi', 400));
  }

  try {
    let decoded;
    try {
      decoded = jwt.verify(resetToken, JWT_SECRET);
    } catch {
      return next(new AppError('Token reset tidak valid atau sudah kadaluarsa (maksimal 10 menit).', 401));
    }

    const email = decoded.email;
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query('UPDATE users SET password = ? WHERE email = ? AND is_deleted = 0', [hashedPassword, email]);
    
    return sendResponse(res, 200, 'Password Anda berhasil diperbarui!');
  } catch (error) {
    return next(error);
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    removeToken(token);
  }
  return sendResponse(res, 200, 'Logout berhasil');
});

// GET /api/auth/montir
router.get('/montir', async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT id, nama FROM users WHERE role = 'montir' AND is_deleted = 0 AND is_aktif = 1");
    return sendResponse(res, 200, 'Data montir aktif berhasil dimuat', rows);
  } catch (error) {
    return next(error);
  }
});

// GET /api/auth/users — Admin: Dapatkan daftar semua pengguna
router.get('/users', adminMiddleware, async (req, res, next) => {
  try {
    const q = `
      SELECT u.id, u.nama, u.email, u.no_hp, u.role, u.is_aktif,
             (SELECT COUNT(*) FROM antrian a WHERE a.montir_id = u.id AND a.status IN ('dipanggil', 'sedang_dilayani')) AS is_busy,
             (SELECT a.nomor_antrian FROM antrian a WHERE a.montir_id = u.id AND a.status IN ('dipanggil', 'sedang_dilayani') LIMIT 1) AS active_antrian_nomor,
             (SELECT a.kendaraan FROM antrian a WHERE a.montir_id = u.id AND a.status IN ('dipanggil', 'sedang_dilayani') LIMIT 1) AS active_kendaraan
      FROM users u 
      WHERE u.is_deleted = 0
      ORDER BY u.nama ASC
    `;
    const [rows] = await pool.query(q);
    return sendResponse(res, 200, 'Daftar akun pengguna berhasil dimuat', rows);
  } catch (error) {
    return next(error);
  }
});

// POST /api/auth/users — Admin: Tambah akun baru
router.post('/users', adminMiddleware, async (req, res, next) => {
  const { nama, email, password, no_hp, role } = req.body;

  if (!nama || !email || !password || !role) {
    return next(new AppError('Nama, email, password, dan role wajib diisi', 400));
  }

  if (!['admin', 'pelanggan', 'montir'].includes(role)) {
    return next(new AppError('Role tidak valid', 400));
  }

  try {
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND is_deleted = 0', [email]);
    if (existing.length > 0) {
      return next(new AppError('Email sudah terdaftar. Silakan gunakan email lain.', 409));
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      'INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)',
      [nama, email, hashedPassword, no_hp || null, role]
    );

    return sendResponse(res, 201, 'Akun berhasil ditambahkan oleh admin.', { userId: result.insertId });
  } catch (error) {
    return next(error);
  }
});

// PUT /api/auth/users/:id/role — Admin: Perbarui role pengguna
router.put('/users/:id/role', adminMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { role } = req.body;

  if (!['admin', 'pelanggan', 'montir'].includes(role)) {
    return next(new AppError('Role tidak valid', 400));
  }

  try {
    await pool.query("UPDATE users SET role = ? WHERE id = ? AND is_deleted = 0", [role, id]);
    return sendResponse(res, 200, 'Role berhasil diperbarui');
  } catch (error) {
    return next(error);
  }
});

// PUT /api/auth/users/:id — Admin: Perbarui data pengguna
router.put('/users/:id', adminMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const { nama, email, no_hp, role, password, is_aktif } = req.body;

  if (!nama || !email || !role) {
    return next(new AppError('Nama, email, dan role wajib diisi', 400));
  }

  if (!['admin', 'pelanggan', 'montir'].includes(role)) {
    return next(new AppError('Role tidak valid', 400));
  }

  const activeStatus = is_aktif !== undefined ? is_aktif : 1;

  try {
    // Cek duplikasi email dengan user lain
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ? AND is_deleted = 0', [email, id]);
    if (existing.length > 0) {
      return next(new AppError('Email sudah terdaftar pada pengguna lain.', 409));
    }

    if (password && password.trim() !== "") {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET nama = ?, email = ?, no_hp = ?, role = ?, password = ?, is_aktif = ? WHERE id = ? AND is_deleted = 0",
        [nama, email, no_hp || null, role, hashedPassword, activeStatus, id]
      );
    } else {
      await pool.query(
        "UPDATE users SET nama = ?, email = ?, no_hp = ?, role = ?, is_aktif = ? WHERE id = ? AND is_deleted = 0",
        [nama, email, no_hp || null, role, activeStatus, id]
      );
    }

    return sendResponse(res, 200, 'Data pengguna berhasil diperbarui');
  } catch (error) {
    return next(error);
  }
});

// DELETE /api/auth/users/:id — Admin: Soft delete akun pengguna
router.delete('/users/:id', adminMiddleware, async (req, res, next) => {
  const { id } = req.params;
  const actorId = req.user?.userId || null;
  try {
    // Set montir_id ke NULL terlebih dahulu di tabel antrian jika user ini dibusy-kan
    await pool.query("UPDATE antrian SET montir_id = NULL WHERE montir_id = ?", [id]);
    
    // Performed secure Soft Delete rather than catastrophic physical delete
    await pool.query(
      "UPDATE users SET is_deleted = 1, is_aktif = 0, deleted_at = CURRENT_TIMESTAMP, deleted_by = ? WHERE id = ?", 
      [actorId, id]
    );

    // Track in audit trail
    try {
      await pool.query(
        "INSERT INTO audit_trails (action, table_name, record_id, performed_by) VALUES (?, ?, ?, ?)",
        ['SOFT_DELETE_USER', 'users', id, actorId ? actorId.toString() : 'admin']
      );
    } catch (e) { /* ignore fallback */ }

    return sendResponse(res, 200, 'Akun pengguna berhasil dinonaktifkan dan dihapus secara aman dari sistem.');
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
