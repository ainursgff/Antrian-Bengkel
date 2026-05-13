var express = require('express');
const Model_Kategori = require('../model/Model_Kategori');
var router = express.Router();
const cacheMiddleware = require('../config/middleware/cacheMiddleware');
const limiter = require('../config/middleware/ratelimiter');

// Import antrian dari config [cite: 263]
const { kategoriQueue } = require('../config/middleware/queue');

const { encryptData, decryptData } = require('../config/middleware/crypto');
const verifyToken = require('../config/middleware/jwt');

// Router GET dengan antrian [cite: 328, 329]
router.get('/', verifyToken, limiter, async function(req, res, next){
    const job = await kategoriQueue.add({ action: 'get' }); // [cite: 330]
    const result = await job.finished(); // [cite: 331]

    const encrypt = await encryptData(result.data);

    return res.status(200).json({
        status: true,
        message: 'Data Kategori',
        data: encrypt
    })
})
router.post('/store', verifyToken, async function(req, res, next) {
    try {
        let nama_kategori;
        
        // Handle hybrid data (encrypted or raw)
        if (req.body.data) {
            const decrypted = decryptData(req.body.data);
            nama_kategori = decrypted.nama_kategori;
        } else {
            nama_kategori = req.body.nama_kategori;
        }

        if (!nama_kategori) {
            return res.status(400).json({ status: false, message: 'nama_kategori harus diisi' });
        }

        let Data = { nama_kategori };
        // Menambahkan data ke antrian kategori
        const job = await kategoriQueue.add({ action: 'store', Data }); 
        await job.finished(); 

        return res.status(201).json({
            status: true,
            message: 'Data kategori berhasil di tambahkan' 
        });
    } catch (error) {
        return res.status(500).json({
            status: false,
            message: 'Terjadi kesalahan pada router' 
        });
    }
}); 

// Router PATCH dengan antrian [cite: 358, 359]
router.patch('/update/:id', verifyToken, async function(req, res, next){
    try {
        let id = req.params.id;
        let nama_kategori;

        // Handle hybrid data (encrypted or raw)
        if (req.body.data) {
            const decrypted = decryptData(req.body.data);
            nama_kategori = decrypted.nama_kategori;
        } else {
            nama_kategori = req.body.nama_kategori;
        }

        let Data = { 
            nama_kategori
        }

        const job = await kategoriQueue.add({ action: 'update', id, Data }); // [cite: 366]
        await job.finished(); // [cite: 367]

        return res.status(201).json({
            status: true,
            message: 'Data kategori berhasil di perbarui'
        })
    } catch (error) {
        return res.status(500).json({
            status: true,
            message: 'Terjadi kesalahan pada router'
        })
    }
})

// Router DELETE dengan antrian [cite: 379, 380]
router.delete('/delete/:id', verifyToken, async function(req, res, next){
    try {
        let id = req.params.id;

        const job = await kategoriQueue.add({ action: 'delete', id }); // [cite: 384]
        await job.finished(); // [cite: 385]

        return res.status(201).json({
            status: true,
            message: 'Data berhasil di hapus'
        })
    } catch (error) {
        return res.status(500).json({
            status: true,
            message: 'Terjadi kesalahan pada router'
        })
    }
})

module.exports = router;