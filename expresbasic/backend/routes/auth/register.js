const express = require('express');
const router = express.Router();
const Model_Users = require('../../model/Model_Users'); // Pastikan path folder benar (model atau models)

router.post('/', async (req, res) => {
    const { username, password } = req.body;

    // Pastikan data tidak kosong
    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password harus diisi' });
    }

    try {
        const existingUser = await Model_Users.getByUsername(username);
        
        // Perbaikan pengecekan: pastikan existingUser ada isinya baru cek length
        if (existingUser && existingUser.length > 0) {
            return res.status(400).json({ message: 'Username sudah digunakan' });
        }

        await Model_Users.registerUser(username, password);
        res.status(201).json({ message: 'Registrasi berhasil' });
    } catch (err) {
        res.status(500).json({ 
            message: 'Terjadi kesalahan', 
            error: err.message 
        });
    }
});

module.exports = router;
