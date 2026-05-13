const jwt = require('jsonwebtoken');

// Secret key untuk JWT — gunakan environment variable di production
const JWT_SECRET = process.env.JWT_SECRET || 'antrian-bengkel-secret-key-2024';
const JWT_EXPIRES_IN = '24h'; // Token berlaku 24 jam

/**
 * Membuat JWT token dari data user
 * @param {Object} userData - { userId, role, nama, email, noHp }
 * @returns {string} JWT token
 */
function generateToken(userData) {
  return jwt.sign(userData, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Memverifikasi dan mendecode JWT token
 * @param {string} token
 * @returns {Object|null} decoded payload atau null jika tidak valid
 */
function verifyToken(token) {
  try {
    
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// Backward compatibility — fungsi lama yang masih dipanggil di routes/auth.js
function addToken(token, userData) {
  // Tidak perlu menyimpan lagi karena JWT bersifat stateless
  // Fungsi ini tetap ada agar tidak error saat dipanggil
}

function removeToken(token) {
  // JWT stateless — logout ditangani di sisi frontend (hapus dari localStorage)
}

/**
 * Middleware: Verifikasi JWT token pada setiap request terproteksi
 * - Mengambil token dari header: Authorization: Bearer <token>
 * - Mendecode payload JWT dan menempelkannya ke req.user
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Token tidak ditemukan' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: 'Unauthorized: Token tidak valid atau sudah kadaluarsa' });
  }

  req.user = decoded;
  req.token = token;
  next();
}

/**
 * Middleware: Verifikasi harus role admin
 * - Memanggil authMiddleware terlebih dahulu
 * - Lalu mengecek req.user.role === 'admin'
 */
function adminMiddleware(req, res, next) {
  authMiddleware(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Hanya admin yang dapat mengakses' });
    }
    next();
  });
}

module.exports = { authMiddleware, adminMiddleware, addToken, removeToken, generateToken, verifyToken };
