const Redis = require('ioredis'); // [cite: 68]
// Pastikan IP host sesuai dengan IP WSL Anda (Contoh: 172.22.30.5) [cite: 69]
const redis = new Redis({ 
    host: process.env.REDIS_HOST || '127.0.0.1', 
    port: process.env.REDIS_PORT || 6379 
});

// Tangani error koneksi agar tidak muncul "Unhandled error event"
redis.on('error', (err) => {
    // console.error('Redis Connection Error:', err.message);
});

// Cek koneksi ke Redis [cite: 72]
redis.ping((err, result) => {
    if (err) {
        console.error('Redis tidak terkoneksi:', err); // [cite: 74, 76]
    } else {
        console.log('Redis terkoneksi:', result); // [cite: 78, 80]
    }
});

const cacheMiddleware = async (req, res, next) => {
    const cacheKey = req.originalUrl; // [cite: 85, 86]
    const cachedData = await redis.get(cacheKey); // [cite: 87]

    if (cachedData) {
        // Jika data ada di cache, langsung kembalikan respon [cite: 88, 107]
        console.log("Data diambil dari cache"); // [cite: 107]
        return res.json(JSON.parse(cachedData)); // [cite: 108]
    }

    // Jika data tidak ada, modifikasi fungsi res.json untuk menyimpan data ke cache [cite: 112]
    res.sendResponse = res.json; // [cite: 111]
    res.json = async (body) => {
        // Simpan data ke cache selama 60 detik [cite: 113]
        await redis.setex(cacheKey, 60, JSON.stringify(body)); // [cite: 113]
        console.log(`Data untuk ${cacheKey} disimpan ke cache`); // [cite: 114]
        res.sendResponse(body); // [cite: 115]
    };

    next(); // [cite: 116]
};

module.exports = cacheMiddleware; // [cite: 117]