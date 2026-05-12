const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRouter = require('./routes/auth');
const antrianRouter = require('./routes/antrian');
const layananRouter = require('./routes/layanan');
const jadwalRouter = require('./routes/jadwal');
const notifikasiRouter = require('./routes/notifikasi');
const laporanRouter = require('./routes/laporan');

app.use('/api/auth', authRouter);
app.use('/api/antrian', antrianRouter);
app.use('/api/layanan', layananRouter);
app.use('/api/jadwal', jadwalRouter);
app.use('/api/notifikasi', notifikasiRouter);
app.use('/api/laporan', laporanRouter);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Sistem Antrian Online UMKM Bengkel — API Berjalan' });
});

// Auto database migration & bootstrapper
async function runDatabaseMigrations() {
  const pool = require('./db');
  console.log('--- Memeriksa & Menginisialisasi Skema Database Otomatis ---');

  try {
    // 1. TABEL USERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        no_hp VARCHAR(20),
        role ENUM('pelanggan','admin','montir') DEFAULT 'pelanggan',
        is_aktif TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 2. TABEL LAYANAN
    await pool.query(`
      CREATE TABLE IF NOT EXISTS layanan (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nama_layanan VARCHAR(100) NOT NULL,
        deskripsi TEXT,
        estimasi_menit INT UNSIGNED DEFAULT 30,
        harga INT UNSIGNED DEFAULT 0,
        is_aktif TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Tambahkan kolom 'harga' jika belum ada (Backward Compatibility)
    try {
      await pool.query("ALTER TABLE layanan ADD COLUMN harga INT UNSIGNED DEFAULT 0 AFTER estimasi_menit");
      console.log("Database updated: 'harga' column added to table 'layanan'.");
    } catch (alterError) {
      if (alterError.code !== 'ER_DUP_FIELDNAME' && alterError.errno !== 1060) {
        throw alterError;
      }
    }

    // 3. TABEL JADWAL OPERASIONAL
    await pool.query(`
      CREATE TABLE IF NOT EXISTS jadwal_operasional (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        hari TINYINT UNSIGNED NOT NULL COMMENT '0=Minggu,1=Senin,...,6=Sabtu',
        jam_buka TIME NOT NULL,
        jam_tutup TIME NOT NULL,
        kuota_per_slot INT UNSIGNED DEFAULT 5,
        is_libur TINYINT(1) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // 4. TABEL ANTRIAN
    await pool.query(`
      CREATE TABLE IF NOT EXISTS antrian (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        layanan_id VARCHAR(255) NOT NULL,
        montir_id INT UNSIGNED DEFAULT NULL,
        jadwal_id INT UNSIGNED,
        nomor_antrian VARCHAR(20) NOT NULL,
        tanggal DATE NOT NULL,
        slot_waktu TIME,
        status ENUM('menunggu','dipanggil','sedang_dilayani','selesai','dibatalkan') DEFAULT 'menunggu',
        catatan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (jadwal_id) REFERENCES jadwal_operasional(id) ON DELETE SET NULL
      );
    `);

    // 5. TABEL NOTIFIKASI
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifikasi (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        antrian_id INT UNSIGNED NOT NULL,
        pesan TEXT NOT NULL,
        tipe ENUM('panggilan','pengingat','pembatalan','konfirmasi') NOT NULL,
        is_read TINYINT(1) DEFAULT 0,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (antrian_id) REFERENCES antrian(id) ON DELETE CASCADE
      );
    `);

    // 6. TABEL PIVOT ANTRIAN_LAYANAN
    await pool.query(`
      CREATE TABLE IF NOT EXISTS antrian_layanan (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        antrian_id INT UNSIGNED NOT NULL,
        layanan_id INT UNSIGNED NOT NULL,
        CONSTRAINT fk_antrian FOREIGN KEY (antrian_id) REFERENCES antrian(id) ON DELETE CASCADE,
        CONSTRAINT fk_layanan FOREIGN KEY (layanan_id) REFERENCES layanan(id) ON DELETE CASCADE
      ) ENGINE=InnoDB;
    `);

    // --- SEED DEFAULT ADMIN ---
    const [adminRows] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    if (adminRows[0].count === 0) {
      await pool.query(
        "INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)",
        ['Admin Bengkel', 'admin@bengkel.com', 'admin123', '081234567890', 'admin']
      );
      console.log('Seeded default admin user (admin@bengkel.com / admin123).');
    }

    // --- SEED DEFAULT LAYANAN ---
    const [layananRows] = await pool.query("SELECT COUNT(*) as count FROM layanan");
    if (layananRows[0].count === 0) {
      await pool.query(`
        INSERT INTO layanan (nama_layanan, deskripsi, estimasi_menit, harga, is_aktif) VALUES
        ('Ganti Oli', 'Penggantian oli mesin kendaraan roda dua dan roda empat', 30, 65000, 1),
        ('Tune Up', 'Perawatan mesin berkala meliputi busi, filter udara, dan karburator', 60, 120000, 1),
        ('Ganti Ban', 'Penggantian ban luar dan dalam kendaraan', 45, 75000, 1),
        ('Servis Rem', 'Pemeriksaan dan penggantian kampas rem depan/belakang', 45, 50000, 1),
        ('Periksa AC', 'Pemeriksaan sistem pendingin udara kendaraan roda empat', 90, 150000, 1)
      `);
      console.log('Seeded default layanan.');
    }

    // Isikan harga realisitis untuk layanan jika ada yang berharga 0
    await pool.query("UPDATE layanan SET harga = 65000 WHERE nama_layanan = 'Ganti Oli' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 120000 WHERE nama_layanan = 'Tune Up' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 75000 WHERE nama_layanan = 'Ganti Ban' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 40000 WHERE nama_layanan = 'Cuci Kendaraan' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 35000 WHERE nama_layanan = 'Cek Rem' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 150000 WHERE nama_layanan = 'Paket Ringan (Servis + Oli)' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 250000 WHERE nama_layanan = 'Paket Lengkap (Mesin, Rem, Oli)' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 300000 WHERE nama_layanan = 'Paket Spesial (Kelistrikan + Mesin)' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 60000 WHERE nama_layanan = 'Ganti Ban Luar / Dalam' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 25000 WHERE nama_layanan = 'Tambal Ban Tubeless' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 45000 WHERE nama_layanan = 'Ganti Kanvas Rem' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 85000 WHERE nama_layanan = 'Servis CVT / Rantai' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 350000 WHERE nama_layanan = 'Turun Mesin Ringan' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 85000 WHERE nama_layanan = 'Ganti Aki & Cek Kelistrikan' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 120000 WHERE nama_layanan = 'Press Segitiga / Velg' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = 25000 WHERE nama_layanan = 'Cuci Motor Salju' AND (harga = 0 OR harga IS NULL)");
    await pool.query("UPDATE layanan SET harga = GREATEST(estimasi_menit * 2000, 15000) WHERE harga = 0 OR harga IS NULL");

    // --- SEED DEFAULT JADWAL ---
    const [jadwalRows] = await pool.query("SELECT COUNT(*) as count FROM jadwal_operasional");
    if (jadwalRows[0].count === 0) {
      for (let hari = 1; hari <= 6; hari++) {
        await pool.query(
          "INSERT INTO jadwal_operasional (hari, jam_buka, jam_tutup, kuota_per_slot, is_libur) VALUES (?, ?, ?, ?, ?)",
          [hari, '08:00:00', '17:00:00', 5, 0]
        );
      }
      await pool.query(
        "INSERT INTO jadwal_operasional (hari, jam_buka, jam_tutup, kuota_per_slot, is_libur) VALUES (?, ?, ?, ?, ?)",
        [0, '08:00:00', '12:00:00', 0, 1]
      );
      console.log('Seeded default jadwal operasional.');
    }

    // --- MIGRASI DATA ANTRIAN_LAYANAN ---
    const [antrianRows] = await pool.query('SELECT id, layanan_id FROM antrian');
    let totalInserted = 0;
    for (const a of antrianRows) {
      if (!a.layanan_id) continue;
      const ids = a.layanan_id.toString().split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
      for (const lid of ids) {
        const [existing] = await pool.query(
          'SELECT id FROM antrian_layanan WHERE antrian_id = ? AND layanan_id = ?',
          [a.id, lid]
        );
        if (existing.length === 0) {
          const [validLayanan] = await pool.query('SELECT id FROM layanan WHERE id = ?', [lid]);
          if (validLayanan.length > 0) {
            await pool.query('INSERT INTO antrian_layanan (antrian_id, layanan_id) VALUES (?, ?)', [a.id, lid]);
            totalInserted++;
          }
        }
      }
    }
    if (totalInserted > 0) {
      console.log(`Migrasi sukses: ${totalInserted} baris relasi terpetakan ke 'antrian_layanan'.`);
    }

    console.log('--- Inisialisasi Database Selesai & Berhasil! ---');
  } catch (dbError) {
    console.error('Gagal melakukan migrasi database otomatis:', dbError);
  }
}

app.listen(PORT, async () => {
  console.log(`Server berjalan di port ${PORT}`);
  await runDatabaseMigrations();
});
