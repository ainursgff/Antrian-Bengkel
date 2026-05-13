const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 10000  ,
    message: 'Terlalu banyak permintaan. Coba 5 menit lagi...',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = limiter;
 