const rateLimit = require('express-rate-limit');

// Rate Limiter Global
// Membatasi setiap IP hanya bisa melakukan 100 request setiap 15 menit
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 5000, // Diperbesar untuk development agar tidak mudah terkena HTTP 429
  message: {
    error: 'Terlalu banyak request dari IP ini, silakan coba lagi setelah 15 menit'
  },
  standardHeaders: true, 
  legacyHeaders: false, 
});

module.exports = globalLimiter;
