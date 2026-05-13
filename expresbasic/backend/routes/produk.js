const express = require('express');
const router = express.Router();
const Model_Produk = require('../model/Model_Produk');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const NodeCache = require('node-cache'); // Panggil library-nya
const cache = new NodeCache({ stdTTL: 60 }); // Buat objek cache-nya

// --- KONFIGURASI MULTER ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 1 * 1024 * 1024 }, // Limit 1MB
    fileFilter: fileFilter
});

const { produkQueue } = require('../config/middleware/queue');
const { encryptData, decryptData } = require('../config/middleware/crypto');
const verifyToken = require('../config/middleware/jwt');

router.get('/', verifyToken, async (req, res, next) => {
    const cacheKey = 'all_products';
    const cachedData = cache.get(cacheKey);

    if (cachedData) {
        // Response ini akan diproses sangat cepat oleh RAM
        return res.status(200).json({
            status: true,
            message: 'Data Produk (Cache)',
            data: cachedData
        });
    }

    try {
        const job = await produkQueue.add({ action: 'get' }); // Mengarahkan ke antrian worker
        const result = await job.finished();
        
        cache.set(cacheKey, result.data, 60); 

        return res.status(200).json({
            status: true,
            message: 'Data Produk',
            data: result.data
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
});

// 1.5 GET BY ID (GET)
router.get('/:id', verifyToken, async (req, res, next) => {
    try {
        const id = req.params.id;
        const data = await Model_Produk.getId(id);
        if (data) {
            return res.status(200).json({
                status: true,
                message: 'Detail Produk',
                data: data
            });
        } else {
            return res.status(404).json({
                status: false,
                message: 'Produk tidak ditemukan'
            });
        }
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
});

// 2. STORE (POST)
router.post('/store', verifyToken, upload.single('gambar_produk'), async (req, res) => {
    try {
        let nama_produk, kategori_id;

        // Handle hybrid data (encrypted or raw/FormData)
        if (req.body.data) {
            const decrypted = decryptData(req.body.data);
            nama_produk = decrypted.nama_produk;
            kategori_id = decrypted.kategori_id;
        } else {
            // Data dari FormData (Multer) masuk ke req.body biasa
            nama_produk = req.body.nama_produk;
            kategori_id = req.body.kategori_id;
        }

        const Data = {
            nama_produk,
            kategori_id,
            gambar_produk: req.file ? req.file.filename : null
        };
        
        const job = await produkQueue.add({ action: 'store', Data });
        await job.finished();

        // Hapus cache agar data terbaru bisa diambil
        cache.del('all_products');

        res.status(201).json({ status: true, message: 'Berhasil simpan produk!' });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});

// 3. UPDATE (PATCH)
router.patch('/update/:id', verifyToken, upload.single('gambar_produk'), async (req, res) => {
    try {
        let id = req.params.id;
        let nama_produk, kategori_id;

        // Handle hybrid data (encrypted or raw/FormData)
        if (req.body.data) {
            const decrypted = decryptData(req.body.data);
            nama_produk = decrypted.nama_produk;
            kategori_id = decrypted.kategori_id;
        } else {
            nama_produk = req.body.nama_produk;
            kategori_id = req.body.kategori_id;
        }

        let oldData = await Model_Produk.getId(id);
        
        // Hapus file lama jika ada upload file baru
        if (req.file && oldData.gambar_produk) {
            const oldPath = path.join(__dirname, '../public/images/', oldData.gambar_produk);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }

        const Data = {
            nama_produk: nama_produk || oldData.nama_produk,
            kategori_id: kategori_id || oldData.kategori_id,
            gambar_produk: req.file ? req.file.filename : oldData.gambar_produk
        };

        const job = await produkQueue.add({ action: 'update', id, Data });
        await job.finished();

        // Hapus cache agar data terbaru bisa diambil
        cache.del('all_products');

        res.status(200).json({ status: true, message: 'Data diperbarui!' });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
}); 

// 4. DELETE
router.delete('/delete/:id', verifyToken, async (req, res) => {
    try {
        let id = req.params.id;
        let data = await Model_Produk.getId(id);
        
        if (data.gambar_produk) {
            const filePath = path.join(__dirname, '../public/images/', data.gambar_produk);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        const job = await produkQueue.add({ action: 'delete', id });
        await job.finished();

        // Hapus cache agar data terbaru bisa diambil
        cache.del('all_products');

        res.status(200).json({ status: true, message: 'Data dan file terhapus!' });
    } catch (e) {
        res.status(500).json({ status: false, message: e.message });
    }
});
module.exports = router;
