-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: May 25, 2026 at 04:18 AM
-- Server version: 8.0.30
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db_antrian_umkm`
--

-- --------------------------------------------------------

--
-- Table structure for table `antrian`
--

CREATE TABLE `antrian` (
  `id` int UNSIGNED NOT NULL,
  `user_id` int UNSIGNED NOT NULL,
  `kendaraan` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `montir_id` int DEFAULT NULL,
  `jadwal_id` int UNSIGNED NOT NULL,
  `nomor_antrian` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tanggal` date NOT NULL,
  `slot_waktu` time NOT NULL,
  `status` enum('menunggu','dipanggil','sedang_dilayani','pending','revisi_servis','menunggu_sparepart','menunggu_verifikasi_pelanggan','selesai','dibatalkan','expired') COLLATE utf8mb4_unicode_ci DEFAULT 'menunggu',
  `catatan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `antrian`
--

INSERT INTO `antrian` (`id`, `user_id`, `kendaraan`, `montir_id`, `jadwal_id`, `nomor_antrian`, `tanggal`, `slot_waktu`, `status`, `catatan`, `created_at`, `updated_at`) VALUES
(1, 4, 'Honda Vario 150', 8, 5, 'A001', '2026-05-21', '10:10:00', 'selesai', NULL, '2026-05-21 03:10:58', '2026-05-21 03:12:12'),
(2, 4, 'Hoda Civic', 8, 5, 'A002', '2026-05-21', '08:14:00', 'selesai', NULL, '2026-05-20 17:13:32', '2026-05-21 03:02:48'),
(3, 4, 'Toyota Innova', NULL, 5, 'A003', '2026-05-21', '10:03:00', 'dibatalkan', NULL, '2026-05-21 03:03:14', '2026-05-21 03:04:15');

-- --------------------------------------------------------

--
-- Table structure for table `antrian_layanan`
--

CREATE TABLE `antrian_layanan` (
  `id` int UNSIGNED NOT NULL,
  `antrian_id` int UNSIGNED NOT NULL,
  `layanan_id` int UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `antrian_layanan`
--

INSERT INTO `antrian_layanan` (`id`, `antrian_id`, `layanan_id`) VALUES
(1, 1, 1),
(2, 1, 2),
(3, 1, 5),
(4, 2, 17),
(5, 2, 20),
(6, 3, 17),
(7, 3, 16);

-- --------------------------------------------------------

--
-- Table structure for table `audit_trails`
--

CREATE TABLE `audit_trails` (
  `id` int UNSIGNED NOT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `table_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `record_id` int UNSIGNED NOT NULL,
  `old_value` json DEFAULT NULL,
  `new_value` json DEFAULT NULL,
  `performed_by` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `audit_trails`
--

INSERT INTO `audit_trails` (`id`, `action`, `table_name`, `record_id`, `old_value`, `new_value`, `performed_by`, `created_at`) VALUES
(1, 'ASSIGN_MECHANIC', 'antrian', 17, '{\"status\": \"menunggu\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 11}', 'admin', '2026-05-18 23:41:42'),
(2, 'ASSIGN_MECHANIC', 'antrian', 17, '{\"status\": \"dipanggil\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 8}', 'admin', '2026-05-19 01:14:09'),
(3, 'ASSIGN_MECHANIC', 'antrian', 17, '{\"status\": \"dipanggil\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 8}', 'admin', '2026-05-19 01:25:50'),
(4, 'ASSIGN_MECHANIC', 'antrian', 17, '{\"status\": \"sedang_dilayani\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 8}', 'admin', '2026-05-19 01:26:23'),
(5, 'ASSIGN_MECHANIC', 'antrian', 18, '{\"status\": \"menunggu\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 8}', 'admin', '2026-05-19 01:32:54'),
(6, 'ASSIGN_MECHANIC', 'antrian', 18, '{\"status\": \"dipanggil\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 8}', 'admin', '2026-05-19 01:34:44'),
(7, 'ASSIGN_MECHANIC', 'antrian', 18, '{\"status\": \"dipanggil\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 8}', 'admin', '2026-05-19 01:35:06'),
(8, 'ASSIGN_MECHANIC', 'antrian', 19, '{\"status\": \"menunggu\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 8}', 'admin', '2026-05-19 03:32:05'),
(9, 'ASSIGN_MECHANIC', 'antrian', 19, '{\"status\": \"dipanggil\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 8}', 'admin', '2026-05-19 03:32:09'),
(10, 'ASSIGN_MECHANIC', 'antrian', 19, '{\"status\": \"dipanggil\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 8}', 'admin', '2026-05-19 03:32:38'),
(11, 'ASSIGN_MECHANIC', 'antrian', 19, '{\"status\": \"dipanggil\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 8}', 'admin', '2026-05-19 03:32:44'),
(12, 'ASSIGN_MECHANIC', 'antrian', 21, '{\"status\": \"menunggu\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": \"12\"}', 'admin', '2026-05-20 01:48:58'),
(13, 'ASSIGN_MECHANIC', 'antrian', 23, '{\"status\": \"menunggu\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": \"8\"}', 'admin', '2026-05-20 07:04:52'),
(14, 'ASSIGN_MECHANIC', 'antrian', 23, '{\"status\": \"dipanggil\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 8}', 'admin', '2026-05-20 07:05:22'),
(15, 'SOFT_DELETE_USER', 'users', 9, NULL, NULL, '3', '2026-05-20 08:11:39'),
(16, 'ASSIGN_MECHANIC', 'antrian', 24, '{\"status\": \"menunggu\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": \"12\"}', 'admin', '2026-05-20 08:45:09'),
(17, 'SOFT_DELETE_USER', 'users', 21, NULL, NULL, '3', '2026-05-20 13:17:05'),
(18, 'ASSIGN_MECHANIC', 'antrian', 25, '{\"status\": \"menunggu\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": \"8\"}', 'admin', '2026-05-20 01:30:21'),
(19, 'ASSIGN_MECHANIC', 'antrian', 25, '{\"status\": \"dipanggil\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": 8}', 'admin', '2026-05-20 01:30:35'),
(20, 'ASSIGN_MECHANIC', 'antrian', 25, '{\"status\": \"dipanggil\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": \"11\"}', 'admin', '2026-05-20 01:30:57'),
(21, 'ASSIGN_MECHANIC', 'antrian', 1, '{\"status\": \"menunggu\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": \"11\"}', 'admin', '2026-05-20 04:36:09'),
(22, 'ASSIGN_MECHANIC', 'antrian', 2, '{\"status\": \"menunggu\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": \"8\"}', 'admin', '2026-05-20 04:38:31'),
(23, 'ASSIGN_MECHANIC', 'antrian', 1, '{\"status\": \"menunggu\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": \"11\"}', 'admin', '2026-05-20 05:01:18'),
(24, 'ASSIGN_MECHANIC', 'antrian', 1, '{\"status\": \"menunggu\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": \"8\"}', 'admin', '2026-05-21 03:11:41'),
(25, 'ASSIGN_MECHANIC', 'antrian', 2, '{\"status\": \"menunggu\", \"montir_id\": null}', '{\"status\": \"dipanggil\", \"montir_id\": \"8\"}', 'admin', '2026-05-21 02:43:05');

-- --------------------------------------------------------

--
-- Table structure for table `jadwal_operasional`
--

CREATE TABLE `jadwal_operasional` (
  `id` int UNSIGNED NOT NULL,
  `hari` tinyint UNSIGNED NOT NULL COMMENT '0=Minggu, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu',
  `jam_buka` time NOT NULL,
  `jam_tutup` time NOT NULL,
  `kuota_per_slot` int UNSIGNED NOT NULL DEFAULT '5',
  `is_libur` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `jadwal_operasional`
--

INSERT INTO `jadwal_operasional` (`id`, `hari`, `jam_buka`, `jam_tutup`, `kuota_per_slot`, `is_libur`, `created_at`, `updated_at`) VALUES
(1, 0, '08:00:00', '17:00:00', 5, 1, '2026-05-07 08:29:37', '2026-05-07 08:29:37'),
(2, 1, '08:00:00', '17:00:00', 10, 0, '2026-05-07 08:29:37', '2026-05-20 07:22:34'),
(3, 2, '06:00:00', '17:00:00', 5, 0, '2026-05-07 08:29:37', '2026-05-18 23:22:39'),
(4, 3, '08:00:00', '17:00:00', 5, 0, '2026-05-07 08:29:37', '2026-05-07 08:29:37'),
(5, 4, '08:00:00', '17:00:00', 5, 0, '2026-05-07 08:29:37', '2026-05-07 08:29:37'),
(6, 5, '08:00:00', '17:00:00', 5, 0, '2026-05-07 08:29:37', '2026-05-07 08:29:37'),
(7, 6, '08:00:00', '15:00:00', 3, 0, '2026-05-07 08:29:37', '2026-05-07 08:29:37');

-- --------------------------------------------------------

--
-- Table structure for table `kategori_kendaraan`
--

CREATE TABLE `kategori_kendaraan` (
  `id` int UNSIGNED NOT NULL,
  `nama_kategori` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `icon` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT 'directions_car',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `kategori_kendaraan`
--

INSERT INTO `kategori_kendaraan` (`id`, `nama_kategori`, `deskripsi`, `icon`, `is_active`, `created_at`, `updated_at`) VALUES
(1, 'Sepeda Motor', 'Semua jenis motor (matic, bebek, sport)', 'two_wheeler', 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(2, 'Mobil', 'Semua jenis mobil (sedan, SUV, MPV, hatchback)', 'directions_car', 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(3, 'Minibus', 'Minibus penumpang (Elf, Hiace, dll)', 'airport_shuttle', 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(4, 'Bus', 'Kendaraan bus besar', 'directions_bus', 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(5, 'Truk Ringan', 'Truk pikap & engkel (CDE/CDD)', 'local_shipping', 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(6, 'Truk Berat', 'Truk tronton & trailer', 'local_shipping', 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04');

-- --------------------------------------------------------

--
-- Table structure for table `layanan`
--

CREATE TABLE `layanan` (
  `id` int UNSIGNED NOT NULL,
  `kategori_id` int UNSIGNED DEFAULT NULL,
  `nama_layanan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deskripsi` text COLLATE utf8mb4_unicode_ci,
  `estimasi_menit` int UNSIGNED NOT NULL DEFAULT '30',
  `harga` int UNSIGNED DEFAULT '0',
  `is_aktif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `layanan`
--

INSERT INTO `layanan` (`id`, `kategori_id`, `nama_layanan`, `deskripsi`, `estimasi_menit`, `harga`, `is_aktif`, `created_at`, `updated_at`) VALUES
(1, 1, 'Servis Berkala', 'Servis Berkala untuk kendaraan jenis Sepeda Motor', 30, 85000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(2, 1, 'Ganti Oli Mesin', 'Ganti Oli Mesin untuk kendaraan jenis Sepeda Motor', 15, 65000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(3, 1, 'Ganti Oli Gardan (Matic)', 'Ganti Oli Gardan (Matic) untuk kendaraan jenis Sepeda Motor', 15, 45000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(4, 1, 'Ganti V-Belt (Matic)', 'Ganti V-Belt (Matic) untuk kendaraan jenis Sepeda Motor', 45, 175000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(5, 1, 'Ganti Kampas Rem', 'Ganti Kampas Rem untuk kendaraan jenis Sepeda Motor', 25, 95000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(6, 1, 'Ganti Busi', 'Ganti Busi untuk kendaraan jenis Sepeda Motor', 10, 35000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(7, 1, 'Tune Up Ringan', 'Tune Up Ringan untuk kendaraan jenis Sepeda Motor', 45, 120000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(8, 1, 'Cuci Injeksi / Karburator', 'Cuci Injeksi / Karburator untuk kendaraan jenis Sepeda Motor', 30, 100000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(9, 1, 'Ganti Ban Luar + Dalam', 'Ganti Ban Luar + Dalam untuk kendaraan jenis Sepeda Motor', 30, 200000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(10, 1, 'Ganti Aki', 'Ganti Aki untuk kendaraan jenis Sepeda Motor', 15, 185000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(11, 1, 'Setting Klep', 'Setting Klep untuk kendaraan jenis Sepeda Motor', 40, 110000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(12, 1, 'Ganti Rantai & Gear Set', 'Ganti Rantai & Gear Set untuk kendaraan jenis Sepeda Motor', 40, 250000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(13, 1, 'Ganti Kampas Kopling', 'Ganti Kampas Kopling untuk kendaraan jenis Sepeda Motor', 45, 165000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(14, 1, 'Perbaikan Kelistrikan', 'Perbaikan Kelistrikan untuk kendaraan jenis Sepeda Motor', 60, 150000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(15, 1, 'Overhaul Mesin', 'Overhaul Mesin untuk kendaraan jenis Sepeda Motor', 180, 750000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(16, 2, 'Servis Berkala', 'Servis Berkala untuk kendaraan jenis Mobil', 60, 350000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(17, 2, 'Ganti Oli Mesin', 'Ganti Oli Mesin untuk kendaraan jenis Mobil', 30, 280000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(18, 2, 'Ganti Oli Transmisi', 'Ganti Oli Transmisi untuk kendaraan jenis Mobil', 30, 320000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(19, 2, 'Ganti Kampas Rem Depan', 'Ganti Kampas Rem Depan untuk kendaraan jenis Mobil', 45, 400000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(20, 2, 'Ganti Kampas Rem Belakang', 'Ganti Kampas Rem Belakang untuk kendaraan jenis Mobil', 45, 350000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(21, 2, 'Tune Up Mesin', 'Tune Up Mesin untuk kendaraan jenis Mobil', 90, 500000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(22, 2, 'Ganti Busi', 'Ganti Busi untuk kendaraan jenis Mobil', 20, 200000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(23, 2, 'Ganti Filter Udara + Oli', 'Ganti Filter Udara + Oli untuk kendaraan jenis Mobil', 20, 150000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(24, 2, 'Spooring & Balancing', 'Spooring & Balancing untuk kendaraan jenis Mobil', 60, 300000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(25, 2, 'Ganti Ban (4 Roda)', 'Ganti Ban (4 Roda) untuk kendaraan jenis Mobil', 60, 2800000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(26, 2, 'Perbaikan AC Mobil', 'Perbaikan AC Mobil untuk kendaraan jenis Mobil', 90, 450000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(27, 2, 'Ganti Aki', 'Ganti Aki untuk kendaraan jenis Mobil', 20, 650000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(28, 2, 'Ganti Timing Belt / Chain', 'Ganti Timing Belt / Chain untuk kendaraan jenis Mobil', 120, 850000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(29, 2, 'Perbaikan Kelistrikan', 'Perbaikan Kelistrikan untuk kendaraan jenis Mobil', 90, 400000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(30, 2, 'Overhaul Mesin', 'Overhaul Mesin untuk kendaraan jenis Mobil', 480, 4500000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(31, 3, 'Servis Berkala', 'Servis Berkala untuk kendaraan jenis Minibus', 90, 600000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(32, 3, 'Ganti Oli Mesin', 'Ganti Oli Mesin untuk kendaraan jenis Minibus', 45, 400000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(33, 3, 'Ganti Oli Transmisi', 'Ganti Oli Transmisi untuk kendaraan jenis Minibus', 45, 450000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(34, 3, 'Ganti Oli Gardan', 'Ganti Oli Gardan untuk kendaraan jenis Minibus', 30, 350000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(35, 3, 'Ganti Kampas Rem', 'Ganti Kampas Rem untuk kendaraan jenis Minibus', 60, 600000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(36, 3, 'Tune Up Mesin Diesel', 'Tune Up Mesin Diesel untuk kendaraan jenis Minibus', 120, 750000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(37, 3, 'Ganti Filter Solar', 'Ganti Filter Solar untuk kendaraan jenis Minibus', 20, 200000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(38, 3, 'Ganti Busi / Glow Plug', 'Ganti Busi / Glow Plug untuk kendaraan jenis Minibus', 30, 350000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(39, 3, 'Spooring & Balancing', 'Spooring & Balancing untuk kendaraan jenis Minibus', 60, 400000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(40, 3, 'Ganti Ban (4 Roda)', 'Ganti Ban (4 Roda) untuk kendaraan jenis Minibus', 90, 4000000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(41, 3, 'Perbaikan AC', 'Perbaikan AC untuk kendaraan jenis Minibus', 120, 650000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(42, 3, 'Ganti Aki', 'Ganti Aki untuk kendaraan jenis Minibus', 20, 850000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(43, 3, 'Ganti Kopling Set', 'Ganti Kopling Set untuk kendaraan jenis Minibus', 180, 1500000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(44, 3, 'Perbaikan Kelistrikan', 'Perbaikan Kelistrikan untuk kendaraan jenis Minibus', 120, 600000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(45, 3, 'Overhaul Mesin', 'Overhaul Mesin untuk kendaraan jenis Minibus', 600, 7000000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(46, 4, 'Servis Berkala', 'Servis Berkala untuk kendaraan jenis Bus', 120, 1200000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(47, 4, 'Ganti Oli Mesin', 'Ganti Oli Mesin untuk kendaraan jenis Bus', 60, 800000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(48, 4, 'Ganti Oli Transmisi', 'Ganti Oli Transmisi untuk kendaraan jenis Bus', 60, 900000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(49, 4, 'Ganti Oli Gardan', 'Ganti Oli Gardan untuk kendaraan jenis Bus', 45, 700000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(50, 4, 'Ganti Kampas Rem', 'Ganti Kampas Rem untuk kendaraan jenis Bus', 90, 1200000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(51, 4, 'Tune Up Mesin Diesel', 'Tune Up Mesin Diesel untuk kendaraan jenis Bus', 180, 1500000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(52, 4, 'Ganti Filter Solar + Udara', 'Ganti Filter Solar + Udara untuk kendaraan jenis Bus', 30, 500000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(53, 4, 'Spooring & Balancing', 'Spooring & Balancing untuk kendaraan jenis Bus', 90, 700000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(54, 4, 'Ganti Ban (per unit)', 'Ganti Ban (per unit) untuk kendaraan jenis Bus', 45, 1500000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(55, 4, 'Perbaikan AC Bus', 'Perbaikan AC Bus untuk kendaraan jenis Bus', 180, 1200000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(56, 4, 'Ganti Aki', 'Ganti Aki untuk kendaraan jenis Bus', 30, 1200000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(57, 4, 'Ganti Kopling Set', 'Ganti Kopling Set untuk kendaraan jenis Bus', 240, 3000000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(58, 4, 'Perbaikan Suspensi', 'Perbaikan Suspensi untuk kendaraan jenis Bus', 180, 2000000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(59, 4, 'Perbaikan Kelistrikan', 'Perbaikan Kelistrikan untuk kendaraan jenis Bus', 150, 1000000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(60, 4, 'Overhaul Mesin', 'Overhaul Mesin untuk kendaraan jenis Bus', 960, 15000000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(61, 5, 'Servis Berkala', 'Servis Berkala untuk kendaraan jenis Truk Ringan', 90, 700000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(62, 5, 'Ganti Oli Mesin', 'Ganti Oli Mesin untuk kendaraan jenis Truk Ringan', 45, 500000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(63, 5, 'Ganti Oli Transmisi', 'Ganti Oli Transmisi untuk kendaraan jenis Truk Ringan', 45, 450000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(64, 5, 'Ganti Oli Gardan', 'Ganti Oli Gardan untuk kendaraan jenis Truk Ringan', 30, 400000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(65, 5, 'Ganti Kampas Rem', 'Ganti Kampas Rem untuk kendaraan jenis Truk Ringan', 60, 700000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(66, 5, 'Tune Up Mesin Diesel', 'Tune Up Mesin Diesel untuk kendaraan jenis Truk Ringan', 120, 850000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(67, 5, 'Ganti Filter Solar', 'Ganti Filter Solar untuk kendaraan jenis Truk Ringan', 20, 250000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(68, 5, 'Ganti Busi / Glow Plug', 'Ganti Busi / Glow Plug untuk kendaraan jenis Truk Ringan', 30, 400000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(69, 5, 'Spooring & Balancing', 'Spooring & Balancing untuk kendaraan jenis Truk Ringan', 60, 450000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(70, 5, 'Ganti Ban (per unit)', 'Ganti Ban (per unit) untuk kendaraan jenis Truk Ringan', 30, 800000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(71, 5, 'Ganti Aki', 'Ganti Aki untuk kendaraan jenis Truk Ringan', 20, 900000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(72, 5, 'Ganti Kopling Set', 'Ganti Kopling Set untuk kendaraan jenis Truk Ringan', 180, 1800000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(73, 5, 'Perbaikan Suspensi', 'Perbaikan Suspensi untuk kendaraan jenis Truk Ringan', 120, 1200000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(74, 5, 'Perbaikan Kelistrikan', 'Perbaikan Kelistrikan untuk kendaraan jenis Truk Ringan', 120, 650000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(75, 5, 'Overhaul Mesin', 'Overhaul Mesin untuk kendaraan jenis Truk Ringan', 600, 8000000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(76, 6, 'Servis Berkala', 'Servis Berkala untuk kendaraan jenis Truk Berat', 120, 1500000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(77, 6, 'Ganti Oli Mesin', 'Ganti Oli Mesin untuk kendaraan jenis Truk Berat', 60, 1000000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(78, 6, 'Ganti Oli Transmisi', 'Ganti Oli Transmisi untuk kendaraan jenis Truk Berat', 60, 1100000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(79, 6, 'Ganti Oli Gardan', 'Ganti Oli Gardan untuk kendaraan jenis Truk Berat', 45, 900000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(80, 6, 'Ganti Kampas Rem', 'Ganti Kampas Rem untuk kendaraan jenis Truk Berat', 90, 1500000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(81, 6, 'Tune Up Mesin Diesel', 'Tune Up Mesin Diesel untuk kendaraan jenis Truk Berat', 180, 1800000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(82, 6, 'Ganti Filter Solar + Udara', 'Ganti Filter Solar + Udara untuk kendaraan jenis Truk Berat', 30, 600000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(83, 6, 'Spooring & Balancing', 'Spooring & Balancing untuk kendaraan jenis Truk Berat', 90, 850000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(84, 6, 'Ganti Ban (per unit)', 'Ganti Ban (per unit) untuk kendaraan jenis Truk Berat', 45, 2000000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(85, 6, 'Ganti Aki (2 unit)', 'Ganti Aki (2 unit) untuk kendaraan jenis Truk Berat', 30, 2200000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(86, 6, 'Ganti Kopling Set', 'Ganti Kopling Set untuk kendaraan jenis Truk Berat', 300, 4000000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(87, 6, 'Perbaikan Suspensi', 'Perbaikan Suspensi untuk kendaraan jenis Truk Berat', 240, 3000000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(88, 6, 'Perbaikan Sistem Pneumatik', 'Perbaikan Sistem Pneumatik untuk kendaraan jenis Truk Berat', 180, 2500000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(89, 6, 'Perbaikan Kelistrikan', 'Perbaikan Kelistrikan untuk kendaraan jenis Truk Berat', 150, 1200000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04'),
(90, 6, 'Overhaul Mesin', 'Overhaul Mesin untuk kendaraan jenis Truk Berat', 1200, 20000000, 1, '2026-05-20 17:07:04', '2026-05-20 17:07:04');

-- --------------------------------------------------------

--
-- Table structure for table `notifikasi`
--

CREATE TABLE `notifikasi` (
  `id` int UNSIGNED NOT NULL,
  `antrian_id` int UNSIGNED NOT NULL,
  `pesan` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipe` enum('panggilan','pengingat','pembatalan','konfirmasi') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_read` tinyint(1) NOT NULL DEFAULT '0',
  `sent_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifikasi`
--

INSERT INTO `notifikasi` (`id`, `antrian_id`, `pesan`, `tipe`, `is_read`, `sent_at`) VALUES
(1, 1, 'Nomor antrian Anda: A001 untuk layanan Servis Berkala, Ganti Oli Mesin, Ganti Kampas Rem. Estimasi mulai: 10:10 WIB.', 'konfirmasi', 0, '2026-05-21 03:10:58'),
(2, 1, 'Kendaraan Anda dengan nomor antrian A001 dipanggil! Mekanik Alex telah ditugaskan.', 'panggilan', 0, '2026-05-21 03:11:41'),
(3, 2, 'Nomor antrian Anda: A002 untuk layanan Ganti Oli Mesin, Ganti Kampas Rem Belakang. Estimasi mulai: 08:14 WIB.', 'konfirmasi', 0, '2026-05-20 17:13:32'),
(4, 2, 'Kendaraan Anda dengan nomor antrian A002 dipanggil! Mekanik Alex telah ditugaskan.', 'panggilan', 0, '2026-05-21 02:43:05'),
(5, 3, 'Nomor antrian Anda: A003 untuk layanan Servis Berkala, Ganti Oli Mesin. Estimasi mulai: 10:03 WIB.', 'konfirmasi', 0, '2026-05-21 03:03:14'),
(6, 3, 'Antrian A003 untuk Ganti Oli Mesin, Servis Berkala telah dibatalkan.', 'pembatalan', 0, '2026-05-21 03:04:15');

-- --------------------------------------------------------

--
-- Table structure for table `service_activity_logs`
--

CREATE TABLE `service_activity_logs` (
  `id` int UNSIGNED NOT NULL,
  `antrian_id` int UNSIGNED NOT NULL,
  `status_sebelumnya` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status_baru` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `actor_id` int UNSIGNED NOT NULL,
  `catatan` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `service_activity_logs`
--

INSERT INTO `service_activity_logs` (`id`, `antrian_id`, `status_sebelumnya`, `status_baru`, `actor_id`, `catatan`, `created_at`) VALUES
(1, 1, NULL, 'menunggu', 4, 'Antrian baru berhasil dibuat', '2026-05-21 03:10:58'),
(2, 1, 'dipanggil', 'sedang_dilayani', 3, 'Servis fisik kendaraan dimulai', '2026-05-21 03:11:44'),
(3, 2, NULL, 'menunggu', 4, 'Antrian baru berhasil dibuat', '2026-05-20 17:13:32'),
(4, 2, 'dipanggil', 'sedang_dilayani', 3, 'Servis fisik kendaraan dimulai', '2026-05-21 02:43:37'),
(5, 3, NULL, 'menunggu', 4, 'Antrian baru berhasil dibuat', '2026-05-21 03:03:14'),
(6, 3, 'menunggu', 'dibatalkan', 4, 'Dibatalkan oleh Pelanggan', '2026-05-21 03:04:15');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int UNSIGNED NOT NULL,
  `nama` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `no_hp` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','pelanggan','montir') COLLATE utf8mb4_unicode_ci DEFAULT 'pelanggan',
  `skills` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_aktif` tinyint(1) NOT NULL DEFAULT '1',
  `is_deleted` tinyint(1) DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `deleted_by` int UNSIGNED DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_blacklist` tinyint(1) DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `nama`, `email`, `password`, `no_hp`, `role`, `skills`, `is_aktif`, `is_deleted`, `deleted_at`, `deleted_by`, `created_at`, `updated_at`, `is_blacklist`) VALUES
(2, 'Ai', 'Ai@gmail.com', '$2a$10$H6QsaNf1tX/Iw5A27EOgAupOvIOwFXMCdp41pEEQYETbASgTj6DHq', '08336350211', 'admin', NULL, 1, 0, NULL, NULL, '2026-05-09 06:53:19', '2026-05-17 16:57:47', 0),
(3, 'zara', 'zara@gmail.com', '$2a$10$yorZpY8ehbjU43bW0JCQFefD74RNC4KUGlj396qUl2sEgZ/oZP9G6', '088264926', 'admin', NULL, 1, 0, NULL, NULL, '2026-05-09 07:04:55', '2026-05-20 04:21:57', 0),
(4, 'Assegaf', 'Asg@gmail.com', '$2a$10$Zh85uV0IQ9TEYiwYBgJ0MuFkK76Ay0G5PW7VVp5vmHvOAorh35Brq', '08764746743', 'pelanggan', NULL, 1, 0, NULL, NULL, '2026-05-11 17:03:49', '2026-05-18 23:21:03', 0),
(8, 'Alex', 'Alex@gmail.com', '$2a$10$7dQAwQR5pQ8QuE01uleB9uto/JUN/qHm0Gr9CUGr/7j/dUa2c.8cu', '0877452849492', 'montir', 'transmisi, electrical, truck/bus', 1, 0, NULL, NULL, '2026-05-11 19:20:30', '2026-05-19 04:37:20', 0),
(9, 'Admin Bengkel', 'admin12344546@gmail.com', '$2a$10$rDtlpuNbVOknIGoF8AnRwu4AQx2ghYOAqCUa3ji1lLI0g5XmFwy.2', '081234567890', 'pelanggan', NULL, 0, 1, '2026-05-20 08:11:39', 3, '2026-05-11 19:46:23', '2026-05-20 08:11:39', 0),
(10, 'Agus Montir', 'agus@bengkel.com', '$2a$10$nyAnlJxi/MVe/nqehM.mJuazjwbS28PzKwPEi6T4yNHqs0UK9.rf2', '081234567891', 'pelanggan', NULL, 1, 0, NULL, NULL, '2026-05-11 19:49:17', '2026-05-11 19:49:17', 0),
(11, 'Agus Mekanik', 'agus.m@gmail.com', '$2a$10$51DQ2cvKmGEsL6ZLjhsbsu70xRkvZzJDolbN8Mx4wo85G2lF6E.96', '08987654321', 'montir', 'motor, mobil, diesel', 1, 0, NULL, NULL, '2026-05-11 22:22:37', '2026-05-20 01:33:40', 0),
(12, 'Fash', 'Fash@gmail.com', '$2a$10$8dJO2.uqyRKdKGVKUCi96e1S4Y39Jr2w9AFDL5IsQQn5Hi/QcsJvm', '0856453554', 'montir', 'mobil, diesel, transmisi', 1, 0, NULL, NULL, '2026-05-11 22:26:11', '2026-05-19 04:37:20', 0),
(13, 'Budi Santoso', 'budi@gmail.com', '$2a$10$a/4tzbaMuaQpmtSiSe0GDOvLITWbvX25j/UGnWawxD4IhBIkCOeUm', '081234567890', 'pelanggan', NULL, 1, 0, NULL, NULL, '2026-05-13 02:22:45', '2026-05-13 02:22:45', 0),
(14, 'Test Postman', 'testpostman@gmail.com', '$2a$10$6USOiozxzTP4iBs8L9wY8eZB8lupLbTVb0RiOrzmiJ1xU8UOWSNc6', '081234567890', 'pelanggan', NULL, 1, 0, NULL, NULL, '2026-05-13 02:25:35', '2026-05-13 02:25:35', 0),
(15, 'Alva', 'Alva@gmail.com', '$2a$10$DUGMwULOdsjvkqmLudtgeubITkKhVUpwIzDaUaKA7latvMpnAkzT.', '085675487997', 'pelanggan', NULL, 1, 0, NULL, NULL, '2026-05-13 02:32:21', '2026-05-13 02:32:21', 0),
(16, 'Ali Haddad', 'Haddad@gmail.com', '$2a$10$DPxlt5rskTP3WhLAQNt8xOt5WZPQvt29snskNAnfSZucTg9407H7i', '097502850259', 'pelanggan', NULL, 1, 0, NULL, NULL, '2026-05-13 17:09:03', '2026-05-13 17:09:03', 0),
(17, 'Budi Santoso', 'budi123@gmail.com', '$2a$10$EIG2Srqm/oq4X2qTBTwOzuHneRnPvdVZTYH81a58ZC.2c5/MqSSWO', '08123456789', 'pelanggan', NULL, 1, 0, NULL, NULL, '2026-05-18 23:15:42', '2026-05-18 23:15:42', 0),
(18, 'Test Customer', 'testuser@gmail.com', '$2a$10$tYB819NyfaX0JkLRpqSizutv6rNhxCnRfwe5g6.BBzk2PrGPFZxJe', '081234567899', 'pelanggan', NULL, 1, 0, NULL, NULL, '2026-05-18 23:25:29', '2026-05-19 04:03:10', 0),
(19, 'Test User New', 'testuser_new@gmail.com', '$2a$10$JzKqTHD4Cviw20h.NoLx0uVNA4fikOMxPMxlaXT4.GX5iVJW2Ok4u', '081234567890', 'pelanggan', NULL, 1, 0, NULL, NULL, '2026-05-19 01:29:32', '2026-05-19 01:29:32', 0),
(20, 'Customer One', 'customer1@gmail.com', '$2a$10$zhNdpourqIjVs/t8T/1NAuUKob9ad/Gi.ww/ZKa/ybsFyGiGg/sW6', '081234567890', 'pelanggan', NULL, 1, 0, NULL, NULL, '2026-05-19 01:42:35', '2026-05-19 01:42:35', 0),
(21, 'Arch', 'arsh@gmail.com', '$2a$10$NqGhhK5v45eFOfNE1aWy/usCbs6BXxgyU7wuwGYWTw1R5nBvnRnZ2', '86685745645646', 'admin', NULL, 0, 1, '2026-05-20 13:17:05', 3, '2026-05-20 13:16:29', '2026-05-20 13:17:05', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `antrian`
--
ALTER TABLE `antrian`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_nomor_tanggal` (`nomor_antrian`,`tanggal`),
  ADD KEY `fk_antrian_jadwal` (`jadwal_id`),
  ADD KEY `idx_antrian_tanggal` (`tanggal`),
  ADD KEY `idx_antrian_status` (`status`),
  ADD KEY `idx_antrian_user` (`user_id`);

--
-- Indexes for table `antrian_layanan`
--
ALTER TABLE `antrian_layanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `antrian_id` (`antrian_id`),
  ADD KEY `layanan_id` (`layanan_id`);

--
-- Indexes for table `audit_trails`
--
ALTER TABLE `audit_trails`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `jadwal_operasional`
--
ALTER TABLE `jadwal_operasional`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uq_jadwal_hari` (`hari`);

--
-- Indexes for table `kategori_kendaraan`
--
ALTER TABLE `kategori_kendaraan`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `layanan`
--
ALTER TABLE `layanan`
  ADD PRIMARY KEY (`id`),
  ADD KEY `kategori_id` (`kategori_id`);

--
-- Indexes for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifikasi_antrian` (`antrian_id`),
  ADD KEY `idx_notifikasi_read` (`is_read`);

--
-- Indexes for table `service_activity_logs`
--
ALTER TABLE `service_activity_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `antrian_id` (`antrian_id`),
  ADD KEY `actor_id` (`actor_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `antrian`
--
ALTER TABLE `antrian`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `antrian_layanan`
--
ALTER TABLE `antrian_layanan`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `audit_trails`
--
ALTER TABLE `audit_trails`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `jadwal_operasional`
--
ALTER TABLE `jadwal_operasional`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `kategori_kendaraan`
--
ALTER TABLE `kategori_kendaraan`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `layanan`
--
ALTER TABLE `layanan`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=91;

--
-- AUTO_INCREMENT for table `notifikasi`
--
ALTER TABLE `notifikasi`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `service_activity_logs`
--
ALTER TABLE `service_activity_logs`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `antrian`
--
ALTER TABLE `antrian`
  ADD CONSTRAINT `fk_antrian_jadwal` FOREIGN KEY (`jadwal_id`) REFERENCES `jadwal_operasional` (`id`),
  ADD CONSTRAINT `fk_antrian_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `antrian_layanan`
--
ALTER TABLE `antrian_layanan`
  ADD CONSTRAINT `antrian_layanan_ibfk_1` FOREIGN KEY (`antrian_id`) REFERENCES `antrian` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `antrian_layanan_ibfk_2` FOREIGN KEY (`layanan_id`) REFERENCES `layanan` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `layanan`
--
ALTER TABLE `layanan`
  ADD CONSTRAINT `layanan_ibfk_1` FOREIGN KEY (`kategori_id`) REFERENCES `kategori_kendaraan` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `notifikasi`
--
ALTER TABLE `notifikasi`
  ADD CONSTRAINT `fk_notifikasi_antrian` FOREIGN KEY (`antrian_id`) REFERENCES `antrian` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `service_activity_logs`
--
ALTER TABLE `service_activity_logs`
  ADD CONSTRAINT `service_activity_logs_ibfk_1` FOREIGN KEY (`antrian_id`) REFERENCES `antrian` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `service_activity_logs_ibfk_2` FOREIGN KEY (`actor_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
