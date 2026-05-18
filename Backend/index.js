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

app.use('/api/auth', authRouter);
app.use('/api/antrian', antrianRouter);
app.use('/api/layanan', layananRouter);
app.use('/api/jadwal', jadwalRouter);
app.use('/api/notifikasi', notifikasiRouter);
app.use('/api/laporan', laporanRouter);
app.use('/api/kategori-kendaraan', kategoriKendaraanRouter);

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
        is_aktif TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

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

    // --- SEED DEFAULT KATEGORI KENDARAAN & LAYANAN ---
    const [kategoriRows] = await pool.query("SELECT COUNT(*) as count FROM kategori_kendaraan");
    const [hasSUV] = await pool.query("SELECT COUNT(*) as count FROM kategori_kendaraan WHERE nama_kategori = 'SUV'");
    
    if (kategoriRows[0].count !== 7 || hasSUV[0].count === 0) {
      console.log('--- Wiping and Seeding Database with 7 Categories and Real Services ---');
      
      // Disable constraints and wipe tables
      await pool.query("SET FOREIGN_KEY_CHECKS = 0");
      await pool.query("TRUNCATE TABLE antrian_layanan");
      await pool.query("TRUNCATE TABLE antrian");
      await pool.query("TRUNCATE TABLE notifikasi");
      await pool.query("TRUNCATE TABLE layanan");
      await pool.query("TRUNCATE TABLE kategori_kendaraan");
      await pool.query("SET FOREIGN_KEY_CHECKS = 1");
      
      // 1. Seed Categories
      await pool.query(`
        INSERT INTO kategori_kendaraan (nama_kategori, deskripsi, icon) VALUES
        ('Mobil', 'Kendaraan roda empat atau lebih', 'directions_car'),
        ('Motor', 'Kendaraan roda dua', 'two_wheeler'),
        ('Bus', 'Bus besar komersial', 'directions_bus'),
        ('Truk', 'Truk muatan besar', 'local_shipping'),
        ('Pickup', 'Mobil bak terbuka/pickup', 'airport_shuttle'),
        ('SUV', 'Sport Utility Vehicle', 'drive_eta'),
        ('Minibus', 'Mobil berukuran minibus', 'directions_bus')
      `);
      console.log('Seeded 7 categories successfully.');
      
      // 2. Fetch seeded categories to get their IDs
      const [kategoris] = await pool.query("SELECT id, nama_kategori FROM kategori_kendaraan");
      const findId = (nama) => kategoris.find(k => k.nama_kategori === nama)?.id || null;
      
      const mobilId = findId('Mobil');
      const motorId = findId('Motor');
      const busId = findId('Bus');
      const trukId = findId('Truk');
      const pickupId = findId('Pickup');
      const suvId = findId('SUV');
      const minibusId = findId('Minibus');
      
      // 3. Seed Real Services exactly as requested
      const layananData = [
        // Motor
        [motorId, 'Servis Ringan Motor', 'Perawatan rutin berkala mesin motor', 30, 50000, 1],
        [motorId, 'Ganti Oli Motor', 'Penggantian oli mesin dan transmisi motor', 15, 65000, 1],
        [motorId, 'Tune Up Motor', 'Pembersihan karburator/injeksi dan penyetelan', 45, 80000, 1],
        [motorId, 'Servis CVT', 'Servis dan pembersihan area CVT matic', 45, 85000, 1],
        [motorId, 'Ganti Kampas Rem', 'Penggantian kampas rem depan atau belakang', 20, 45000, 1],
        [motorId, 'Cek Kelistrikan', 'Pemeriksaan sistem kelistrikan & aki motor', 30, 40000, 1],
        
        // Mobil
        [mobilId, 'Ganti Oli Mobil', 'Penggantian oli mesin mobil premium', 30, 250000, 1],
        [mobilId, 'Spooring', 'Penyelarasan sudut roda mobil', 45, 150000, 1],
        [mobilId, 'Balancing', 'Penyeimbangan berat roda mobil', 30, 100000, 1],
        [mobilId, 'Tune Up Mobil', 'Perawatan berkala sistem pembakaran mobil', 60, 300000, 1],
        [mobilId, 'Servis AC', 'Pembersihan filter dan pengisian freon AC', 60, 200000, 1],
        [mobilId, 'Cuci Mesin', 'Detailing dan pembersihan ruang mesin mobil', 45, 75000, 1],
        
        // Bus
        [busId, 'Tune Up Bus', 'Penyetelan sistem pembakaran bus', 90, 500000, 1],
        [busId, 'Servis Rem Bus', 'Perawatan intensif rem pneumatic/angin bus', 60, 350000, 1],
        [busId, 'Ganti Oli Bus', 'Penggantian oli mesin kapasitas besar bus', 45, 600000, 1],
        [busId, 'Pemeriksaan Mesin Bus', 'Diagnostik menyeluruh performa mesin bus', 120, 750000, 1],
        [busId, 'Servis Suspensi', 'Pemeriksaan suspensi udara & shockbreaker bus', 90, 450000, 1],
        
        // Truk
        [trukId, 'Servis Mesin Truk', 'Penyetelan mesin truk muatan besar', 90, 450000, 1],
        [trukId, 'Ganti Oli Truk', 'Penggantian oli mesin diesel truk', 45, 550000, 1],
        [trukId, 'Pemeriksaan Rem Angin', 'Pemeriksaan kebocoran & performa rem angin truk', 60, 300000, 1],
        [trukId, 'Servis Gardan', 'Penggantian oli & penyetelan roda gigi gardan truk', 60, 350000, 1],
        [trukId, 'Pemeriksaan Kelistrikan', 'Pemeriksaan lampu utama, sein & accu truk', 60, 250000, 1],
        
        // Pickup
        [pickupId, 'Servis Pickup', 'Servis mesin berkala mobil bak/pickup', 45, 180000, 1],
        [pickupId, 'Ganti Oli Pickup', 'Penggantian oli mesin mobil pickup', 30, 200000, 1],
        [pickupId, 'Pemeriksaan Mesin Pickup', 'Pemeriksaan menyeluruh performa mesin pickup', 60, 250000, 1],
        
        // SUV
        [suvId, 'Tune Up SUV', 'Penyetelan mesin SUV premium', 60, 320000, 1],
        [suvId, 'Balancing SUV', 'Penyeimbangan roda mobil SUV', 30, 120000, 1],
        [suvId, 'Servis AC SUV', 'Servis kompresor & isi freon AC SUV', 60, 220000, 1],
        
        // Minibus
        [minibusId, 'Servis Minibus', 'Servis rutin berkala minibus', 60, 200000, 1],
        [minibusId, 'Pemeriksaan Mesin Minibus', 'Pemeriksaan performa mesin minibus', 90, 280000, 1],
        [minibusId, 'Ganti Oli Minibus', 'Penggantian oli mesin & filter minibus', 30, 220000, 1]
      ];
      
      for (const row of layananData) {
        await pool.query(
          "INSERT INTO layanan (kategori_id, nama_layanan, deskripsi, estimasi_menit, harga, is_aktif) VALUES (?, ?, ?, ?, ?, ?)",
          row
        );
      }
      console.log('Seeded all services successfully.');
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
