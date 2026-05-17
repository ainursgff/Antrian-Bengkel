const rateLimit = require('express-rate-limit');

// Rate Limiter Global
// Membatasi setiap IP hanya bisa melakukan 100 request setiap 15 menit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100, // Limit setiap IP hingga 100 request per `window` (di sini, per 15 menit)
  message: {
    error: 'Terlalu banyak request dari IP ini, silakan coba lagi setelah 15 menit'
  },
  standardHeaders: true, // Kembalikan info rate limit pada headers `RateLimit-*`
  legacyHeaders: false, // Nonaktifkan headers `X-RateLimit-*`
});

module.exports = globalLimiter;
