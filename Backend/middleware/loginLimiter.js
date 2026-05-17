const rateLimit = require('express-rate-limit');

// Login Rate Limiter
// Membatasi setiap IP hanya bisa mencoba login 5 kali dalam 15 menit
// Sangat berguna untuk mencegah serangan Brute Force / tebak password
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5, // Maksimal 5 kali percobaan login yang gagal/berhasil
  message: {
    error: 'Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit untuk alasan keamanan.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = loginLimiter;
