const connection = require('../config/database');

class Model_Produk {
    // Ambil semua data produk dengan JOIN ke kategori
    static async getAll() {
        return new Promise((resolve, reject) => {
            connection.query('SELECT a.*, b.nama_kategori FROM produk a LEFT JOIN kategori b ON b.id_kategori = a.kategori_id ORDER BY a.id DESC', (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Simpan produk baru
    static async Store(Data) {
        return new Promise((resolve, reject) => {
            connection.query('INSERT INTO produk SET ?', Data, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Ambil detail produk berdasarkan ID
    static async getId(id) {
        return new Promise((resolve, reject) => {
            connection.query('SELECT * FROM produk WHERE id = ?', [id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows[0]); // Ambil satu data saja
            });
        });
    }

    // Update produk
    static async Update(id, Data) {
        return new Promise((resolve, reject) => {
            connection.query('UPDATE produk SET ? WHERE id = ?', [Data, id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    // Hapus produk
    static async Delete(id) {
        return new Promise((resolve, reject) => {
            connection.query('DELETE FROM produk WHERE id = ?', [id], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }
}

module.exports = Model_Produk;
