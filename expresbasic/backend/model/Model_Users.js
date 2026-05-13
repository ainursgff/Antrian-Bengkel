const connection = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class Model_Users {
    // 1. Mengambil semua data user (Kecuali Password demi keamanan)
    static async getAll() {
        return new Promise((resolve, reject) => {
            connection.query('SELECT id, username, created_at FROM users ORDER BY id DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // 2. Cek apakah username sudah ada
    static async getByUsername(username) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM users WHERE username = ?', [username], (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0]);
            });
        });
    }

    // 3. Registrasi User Baru (Password di-Hash/Enkripsi)
    static async registerUser(username, password) {
        return new Promise(async (resolve, reject) => {
            try {
                // Enkripsi password dengan salt 10
                const hashedPassword = await bcrypt.hash(password, 10);
                connection.query(
                    'INSERT INTO users (username, password) VALUES (?, ?)',
                    [username, hashedPassword],
                    (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    }
                );
            } catch (error) {
                reject(error);
            }
        });
    }

    // 4. Proses Login & Generate Token JWT
    static async login(username, password) {
        return new Promise((resolve, reject) => {
            const sql = 'SELECT * FROM users WHERE username = ?';
            connection.query(sql, [username], async (err, results) => {
                if (err) return reject({ status: 500, message: 'Error pada server' });
                
                // Cek jika user tidak ditemukan
                if (results.length === 0) {
                    return reject({ status: 401, message: 'Username tidak ditemukan' });
                }

                const user = results[0];
                // Bandingkan password input dengan password di database
                const isMatch = await bcrypt.compare(password, user.password);
                
                if (!isMatch) {
                    return reject({ status: 401, message: 'Password salah' });
                }

                // Jika cocok, buat Token JWT
                const token = jwt.sign(
                    { id: user.id, username: user.username },
                    process.env.JWT_SECRET, // Diambil dari file .env
                    { expiresIn: '1h' }     // Token aktif selama 1 jam
                );

                resolve({ token });
            });
        });
    }
}

module.exports = Model_Users;
