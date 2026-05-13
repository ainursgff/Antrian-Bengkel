const mysql = require('mysql');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'expres',
    connectionLimit: 10
});

pool.getConnection((err, connection) => {
    if (err) {
        console.log('Database error:', err.message);
    } else {
        console.log('Connection Success');
        if (connection) connection.release();
    }
});

module.exports = pool;