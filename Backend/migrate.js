const pool = require('./db');

async function migrate() {
  try {
    // --- TABEL USERS ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nama VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        no_hp VARCHAR(20),
        role ENUM('pelanggan','admin') DEFAULT 'pelanggan',
        is_aktif TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'users' created/verified.");

    // --- TABEL LAYANAN ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS layanan (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        nama_layanan VARCHAR(100) NOT NULL,
        deskripsi TEXT,
        estimasi_menit INT UNSIGNED DEFAULT 30,
        is_aktif TINYINT(1) DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);
    console.log("Table 'layanan' created/verified.");

    // --- TABEL JADWAL OPERASIONAL ---
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
    console.log("Table 'jadwal_operasional' created/verified.");

    // --- TABEL ANTRIAN ---
    await pool.query(`
      CREATE TABLE IF NOT EXISTS antrian (
        id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        layanan_id INT UNSIGNED NOT NULL,
        jadwal_id INT UNSIGNED,
        nomor_antrian VARCHAR(20) NOT NULL,
        tanggal DATE NOT NULL,
        slot_waktu TIME,
        status ENUM('menunggu','dipanggil','sedang_dilayani','selesai','dibatalkan') DEFAULT 'menunggu',
        catatan TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (layanan_id) REFERENCES layanan(id) ON DELETE CASCADE,
        FOREIGN KEY (jadwal_id) REFERENCES jadwal_operasional(id) ON DELETE SET NULL
      );
    `);
    console.log("Table 'antrian' created/verified.");

    // --- TABEL NOTIFIKASI ---
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
    console.log("Table 'notifikasi' created/verified.");

    // --- SEED DEFAULT ADMIN ---
    const [adminRows] = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    if (adminRows[0].count === 0) {
      await pool.query(
        "INSERT INTO users (nama, email, password, no_hp, role) VALUES (?, ?, ?, ?, ?)",
        ['Admin Bengkel', 'admin@bengkel.com', 'admin123', '081234567890', 'admin']
      );
      console.log('Seeded default admin user.');
    }

    // --- SEED DEFAULT LAYANAN ---
    const [layananRows] = await pool.query("SELECT COUNT(*) as count FROM layanan");
    if (layananRows[0].count === 0) {
      await pool.query(`
        INSERT INTO layanan (nama_layanan, deskripsi, estimasi_menit, is_aktif) VALUES
        ('Ganti Oli', 'Penggantian oli mesin kendaraan roda dua dan roda empat', 30, 1),
        ('Tune Up', 'Perawatan mesin berkala meliputi busi, filter udara, dan karburator', 60, 1),
        ('Ganti Ban', 'Penggantian ban luar dan dalam kendaraan', 45, 1),
        ('Servis Rem', 'Pemeriksaan dan penggantian kampas rem depan/belakang', 45, 1),
        ('Periksa AC', 'Pemeriksaan sistem pendingin udara kendaraan roda empat', 90, 1)
      `);
      console.log('Seeded default layanan.');
    }

    // --- SEED DEFAULT JADWAL ---
    const [jadwalRows] = await pool.query("SELECT COUNT(*) as count FROM jadwal_operasional");
    if (jadwalRows[0].count === 0) {
      // Senin s/d Sabtu (hari 1-6), buka 08:00 - 17:00, kuota 5
      for (let hari = 1; hari <= 6; hari++) {
        await pool.query(
          "INSERT INTO jadwal_operasional (hari, jam_buka, jam_tutup, kuota_per_slot, is_libur) VALUES (?, ?, ?, ?, ?)",
          [hari, '08:00:00', '17:00:00', 5, 0]
        );
      }
      // Minggu (hari 0) - libur
      await pool.query(
        "INSERT INTO jadwal_operasional (hari, jam_buka, jam_tutup, kuota_per_slot, is_libur) VALUES (?, ?, ?, ?, ?)",
        [0, '08:00:00', '12:00:00', 0, 1]
      );
      console.log('Seeded default jadwal operasional.');
    }

    console.log('\nMigrasi selesai!');
    process.exit(0);
  } catch (e) {
    console.error('Error migrasi:', e);
    process.exit(1);
  }
}

migrate();
