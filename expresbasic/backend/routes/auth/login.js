const express = require('express');
const router = express.Router();
const Model_Users = require('../../model/Model_Users');
const loginLimiter = require('../../config/middleware/loginLimiter'); // Import limiter khusus login

router.post('/', loginLimiter, async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username dan password harus diisi' });
    }

    try {
        const result = await Model_Users.login(username, password);
        res.json(result); // Mengirimkan token ke user
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
});

module.exports = router;
