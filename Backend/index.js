const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Global Rate Limiting
const globalLimiter = require('./middleware/rateLimiter');
app.use(globalLimiter);

// Routes
const authRouter = require('./routes/auth');
const antrianRouter = require('./routes/antrian');
const layananRouter = require('./routes/layanan');
const jadwalRouter = require('./routes/jadwal');
const notifikasiRouter = require('./routes/notifikasi');
const laporanRouter = require('./routes/laporan');
const kategoriKendaraanRouter = require('./routes/kategoriKendaraan');
const usersRouter = require('./routes/users');
const montirRouter = require('./routes/montir');

app.use('/api/auth', authRouter);
app.use('/api/antrian', antrianRouter);
app.use('/api/layanan', layananRouter);
app.use('/api/jadwal', jadwalRouter);
app.use('/api/notifikasi', notifikasiRouter);
app.use('/api/laporan', laporanRouter);
app.use('/api/kategori-kendaraan', kategoriKendaraanRouter);
app.use('/api/users', usersRouter);
app.use('/api/montir', montirRouter);

// Centralized Global Error Handler Middleware
const { errorHandler } = require('./middleware/errorHandler');
app.use(errorHandler);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Sistem Antrian Online UMKM Bengkel — API Berjalan' });
});

// Auto database migration & bootstrapper
async function runDatabaseMigrations() {
  const pool = require('./db');
  console.log('--- Memeriksa & Menginisialisasi Skema Database Otomatis ---');

  try {
    // 0. TABEL KATEGORI KENDARAAN
    await pool.query(`
      CREATE TABLE IF NOT EXISTS kategori_kendaraan (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nama_kategori VARCHAR(100) NOT NULL,
        deskripsi TEXT,
        icon VARCHAR(100) DEFAULT 'directions_car',
        is_active TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Tambahkan kolom 'is_active' ke kategori_kendaraan jika belum ada
    try {
      await pool.query("ALTER TABLE kategori_kendaraan ADD COLUMN is_active TINYINT(1) DEFAULT 1 AFTER icon");
      console.log("Database updated: 'is_active' column added to table 'kategori_kendaraan'.");
    } catch (e) { /* Ignore */ }

    // 1. TABEL USERS
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        no_hp VARCHAR(20),
        role ENUM('pelanggan','admin','montir') DEFAULT 'pelanggan',
        skills VARCHAR(255) DEFAULT NULL,
        is_aktif TINYINT(1) DEFAULT 1,
        is_blacklist TINYINT(1) DEFAULT 0,
        is_deleted TINYINT(1) DEFAULT 0,
        deleted_at TIMESTAMP NULL,
        deleted_by INT UNSIGNED NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    // Tambahkan kolom soft delete jika belum ada
    try {
      await pool.query("ALTER TABLE users ADD COLUMN is_deleted TINYINT(1) DEFAULT 0 AFTER is_blacklist");
      await pool.query("ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL AFTER is_deleted");
      await pool.query("ALTER TABLE users ADD COLUMN deleted_by INT UNSIGNED NULL AFTER deleted_at");
      console.log("Database updated: Soft delete columns added to table 'users'.");
    } catch (e) { /* Ignore */ }

    // 2. TABEL LAYANAN
    await pool.query(`
      CREATE TABLE IF NOT EXISTS layanan (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        kategori_id INT UNSIGNED DEFAULT NULL,
        nama_layanan VARCHAR(100) NOT NULL,
        deskripsi TEXT,
        estimasi_menit INT UNSIGNED DEFAULT 30,
        harga INT UNSIGNED DEFAULT 0,
        is_aktif TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (kategori_id) REFERENCES kategori_kendaraan(id) ON DELETE SET NULL
      );
    `);

    // Tambahkan kolom 'harga' dan 'kategori_id' jika belum ada (Backward Compatibility)
    try {
      await pool.query("ALTER TABLE layanan ADD COLUMN harga INT UNSIGNED DEFAULT 0 AFTER estimasi_menit");
      console.log("Database updated: 'harga' column added to table 'layanan'.");
    } catch (e) { /* Ignore */ }

    try {
      await pool.query("ALTER TABLE layanan ADD COLUMN kategori_id INT UNSIGNED DEFAULT NULL AFTER id");
      await pool.query("ALTER TABLE layanan ADD FOREIGN KEY (kategori_id) REFERENCES kategori_kendaraan(id) ON DELETE SET NULL");
      console.log("Database updated: 'kategori_id' column added to table 'layanan'.");
    } catch (e) { /* Ignore */ }

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
        layanan_id VARCHAR(255) NULL,
        montir_id INT UNSIGNED DEFAULT NULL,
        jadwal_id INT UNSIGNED,
        nomor_antrian VARCHAR(20) NOT NULL,
        tanggal DATE NOT NULL,
        slot_waktu TIME,
        status ENUM('menunggu','dipanggil','sedang_dilayani','menunggu_sparepart','menunggu_verifikasi_pelanggan','revisi_servis','selesai','dibatalkan','expired') DEFAULT 'menunggu',
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

    // 5.1 TABEL SERVICE_ACTIVITY_LOGS (Audit Trail Status)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS service_activity_logs (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        antrian_id INT UNSIGNED NOT NULL,
        status_sebelumnya VARCHAR(50),
        status_baru VARCHAR(50) NOT NULL,
        actor_id INT UNSIGNED NOT NULL,
        catatan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (antrian_id) REFERENCES antrian(id) ON DELETE CASCADE,
        FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // 5.2 TABEL AUDIT_TRAILS (Generic Audit Log)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_trails (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        action VARCHAR(100) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        record_id INT UNSIGNED NOT NULL,
        old_value JSON DEFAULT NULL,
        new_value JSON DEFAULT NULL,
        performed_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

    // --- SEED DEFAULT KATEGORI KENDARAAN & LAYANAN ---
    const [kategoriRows] = await pool.query("SELECT COUNT(*) as count FROM kategori_kendaraan");
    const [hasMotor] = await pool.query("SELECT COUNT(*) as count FROM kategori_kendaraan WHERE nama_kategori = 'Sepeda Motor'");
    
    if (kategoriRows[0].count !== 6 || hasMotor[0].count === 0) {
      console.log('--- Wiping and Seeding Database with 6 Categories and 15 Services Each ---');
      
      // Disable constraints and wipe tables
      await pool.query("SET FOREIGN_KEY_CHECKS = 0");
      await pool.query("TRUNCATE TABLE antrian_layanan");
      await pool.query("TRUNCATE TABLE service_activity_logs");
      await pool.query("TRUNCATE TABLE notifikasi");
      await pool.query("TRUNCATE TABLE antrian");
      await pool.query("TRUNCATE TABLE layanan");
      await pool.query("TRUNCATE TABLE kategori_kendaraan");
      await pool.query("SET FOREIGN_KEY_CHECKS = 1");
      
      // Seed 6 categories × 15 services = 90 total services
      const seedLayanan = require('./database/seeders/layananSeeder');
      await seedLayanan();
    }

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

    // --- MIGRASI DATA ANTRIAN_LAYANAN (Safe Check) ---
    try {
      const [columns] = await pool.query(
        "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'antrian' AND COLUMN_NAME = 'layanan_id'"
      );
      if (columns.length > 0) {
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
      }
    } catch (e) {
      console.log('Skipping active queue layanan_id migration.');
    }


    console.log('--- Inisialisasi Database Selesai & Berhasil! ---');
  } catch (dbError) {
    console.error('Gagal melakukan migrasi database otomatis:', dbError);
  }
}

app.listen(PORT, async () => {
  console.log(`Server berjalan di port ${PORT}`);
  await runDatabaseMigrations();
  
  // Run on startup
  try {
    const cleanupExpiredQueues = require('./jobs/cleanupExpiredQueues');
    await cleanupExpiredQueues();
  } catch (err) {
    console.error('[StartupJobsError]', err);
  }

  // Schedule to run every 12 hours (43200000 ms)
  setInterval(async () => {
    try {
      console.log('[Scheduler] Executing scheduled operational jobs...');
      const cleanupExpiredQueues = require('./jobs/cleanupExpiredQueues');
      await cleanupExpiredQueues();
    } catch (err) {
      console.error('[SchedulerJobsError]', err);
    }
  }, 43200000); // 12 hours interval
});
