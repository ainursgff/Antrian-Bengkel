-- =============================================
-- Sistem Antrian Online UMKM Bengkel
-- Database: db_antrian_umkm
-- =============================================

CREATE DATABASE IF NOT EXISTS db_antrian_umkm;
USE db_antrian_umkm;

-- Tabel users (pelanggan & admin)
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

-- Tabel layanan (jenis servis bengkel)
CREATE TABLE IF NOT EXISTS layanan (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nama_layanan VARCHAR(100) NOT NULL,
    deskripsi TEXT,
    estimasi_menit INT UNSIGNED DEFAULT 30,
    is_aktif TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel jadwal_operasional
CREATE TABLE IF NOT EXISTS jadwal_operasional (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    hari TINYINT UNSIGNED NOT NULL COMMENT '0=Minggu,1=Senin,2=Selasa,3=Rabu,4=Kamis,5=Jumat,6=Sabtu',
    jam_buka TIME NOT NULL,
    jam_tutup TIME NOT NULL,
    kuota_per_slot INT UNSIGNED DEFAULT 5,
    is_libur TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabel antrian
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

-- Tabel notifikasi
CREATE TABLE IF NOT EXISTS notifikasi (
    id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    antrian_id INT UNSIGNED NOT NULL,
    pesan TEXT NOT NULL,
    tipe ENUM('panggilan','pengingat','pembatalan','konfirmasi') NOT NULL,
    is_read TINYINT(1) DEFAULT 0,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (antrian_id) REFERENCES antrian(id) ON DELETE CASCADE
);

-- Insert default admin
INSERT IGNORE INTO users (nama, email, password, no_hp, role, is_aktif)
VALUES ('Admin Bengkel', 'admin@bengkel.com', 'admin123', '081234567890', 'admin', 1);
