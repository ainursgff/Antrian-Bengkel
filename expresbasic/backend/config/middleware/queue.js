const Queue = require('bull'); // [cite: 224]

const redisConfig = {
    redis: { 
        host: process.env.REDIS_HOST || '127.0.0.1', 
        port: process.env.REDIS_PORT || 6379 
    }
};

// Membuat dua jalur antrian: satu untuk kategori, satu untuk produk [cite: 234, 245]
const kategoriQueue = new Queue('kategoriQueue', redisConfig);
const produkQueue = new Queue('produkQueue', redisConfig);

// Queue status logging removed for clarity [cite: cleanup]

(async () => {
    console.log("Membersihkan job lama di queue...");

    await kategoriQueue.clean(0, 'delayed');
    await kategoriQueue.clean(0, 'wait');
    await kategoriQueue.clean(0, 'failed');
    await kategoriQueue.clean(0, 'completed');

    console.log("Queue dibersihkan!");
})();

module.exports = { kategoriQueue, produkQueue };