const jwt = require('jsonwebtoken');

function verifyToken(req, res, next) {
    const token = req.header('Authorization')?.replace('Bearer', '');
    if (!token) return res.status(403).json({ message: 'Akses ditolak, token tidak ada' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Token tidak valid atau kadaluarsa' });
        req.user = decoded;
        next();
    });
}

module.exports = verifyToken;
