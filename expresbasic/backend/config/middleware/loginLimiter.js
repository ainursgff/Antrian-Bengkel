const rateLimit = require('express-rate-limit');

const loginLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 menit
    max: 5, // Maksimal 5 kali percobaan
    message: { message: 'Terlalu banyak percobaan login. Silakan tunggu 5 menit lagi...' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = loginLimiter;
