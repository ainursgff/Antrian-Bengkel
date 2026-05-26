const pool = require('../../db');

async function seedLayanan() {
  console.log('--- Seeding Default Categories and Services ---');

  // ============================================================
  // 6 KATEGORI KENDARAAN (lebih simpel & realistis untuk bengkel UMKM)
  // ============================================================
  const categories = [
    { name: 'Sepeda Motor', desc: 'Semua jenis motor (matic, bebek, sport)', icon: 'two_wheeler' },
    { name: 'Mobil',        desc: 'Semua jenis mobil (sedan, SUV, MPV, hatchback)', icon: 'directions_car' },
    { name: 'Minibus',      desc: 'Minibus penumpang (Elf, Hiace, dll)', icon: 'airport_shuttle' },
    { name: 'Bus',          desc: 'Kendaraan bus besar', icon: 'directions_bus' },
    { name: 'Truk Ringan',  desc: 'Truk pikap & engkel (CDE/CDD)', icon: 'local_shipping' },
    { name: 'Truk Berat',   desc: 'Truk tronton & trailer', icon: 'local_shipping' },
  ];

  // ============================================================
  // 15 LAYANAN PER KATEGORI — harga & estimasi realistis
  // ============================================================
  const serviceTemplates = {

    // ───────── SEPEDA MOTOR ─────────
    'Sepeda Motor': [
      { nama: 'Servis Berkala',               harga: 85000,   menit: 30 },
      { nama: 'Ganti Oli Mesin',             harga: 65000,   menit: 15 },
      { nama: 'Ganti Oli Gardan (Matic)',    harga: 45000,   menit: 15 },
      { nama: 'Ganti V-Belt (Matic)',        harga: 175000,  menit: 45 },
      { nama: 'Ganti Kampas Rem',            harga: 95000,   menit: 25 },
      { nama: 'Ganti Busi',                  harga: 35000,   menit: 10 },
      { nama: 'Tune Up Ringan',              harga: 120000,  menit: 45 },
      { nama: 'Cuci Injeksi / Karburator',   harga: 100000,  menit: 30 },
      { nama: 'Ganti Ban Luar + Dalam',      harga: 200000,  menit: 30 },
      { nama: 'Ganti Aki',                   harga: 185000,  menit: 15 },
      { nama: 'Setting Klep',                harga: 110000,  menit: 40 },
      { nama: 'Ganti Rantai & Gear Set',     harga: 250000,  menit: 40 },
      { nama: 'Ganti Kampas Kopling',        harga: 165000,  menit: 45 },
      { nama: 'Perbaikan Kelistrikan',        harga: 150000,  menit: 60 },
      { nama: 'Overhaul Mesin',              harga: 750000,  menit: 180 },
    ],

    // ───────── MOBIL ─────────
    'Mobil': [
      { nama: 'Servis Berkala',               harga: 350000,  menit: 60 },
      { nama: 'Ganti Oli Mesin',             harga: 280000,  menit: 30 },
      { nama: 'Ganti Oli Transmisi',         harga: 320000,  menit: 30 },
      { nama: 'Ganti Kampas Rem Depan',      harga: 400000,  menit: 45 },
      { nama: 'Ganti Kampas Rem Belakang',   harga: 350000,  menit: 45 },
      { nama: 'Tune Up Mesin',               harga: 500000,  menit: 90 },
      { nama: 'Ganti Busi',                  harga: 200000,  menit: 20 },
      { nama: 'Ganti Filter Udara + Oli',    harga: 150000,  menit: 20 },
      { nama: 'Spooring & Balancing',         harga: 300000,  menit: 60 },
      { nama: 'Ganti Ban (4 Roda)',          harga: 2800000, menit: 60 },
      { nama: 'Perbaikan AC Mobil',           harga: 450000,  menit: 90 },
      { nama: 'Ganti Aki',                   harga: 650000,  menit: 20 },
      { nama: 'Ganti Timing Belt / Chain',   harga: 850000,  menit: 120 },
      { nama: 'Perbaikan Kelistrikan',        harga: 400000,  menit: 90 },
      { nama: 'Overhaul Mesin',              harga: 4500000, menit: 480 },
    ],

    // ───────── MINIBUS ─────────
    'Minibus': [
      { nama: 'Servis Berkala',               harga: 600000,  menit: 90 },
      { nama: 'Ganti Oli Mesin',             harga: 400000,  menit: 45 },
      { nama: 'Ganti Oli Transmisi',         harga: 450000,  menit: 45 },
      { nama: 'Ganti Oli Gardan',            harga: 350000,  menit: 30 },
      { nama: 'Ganti Kampas Rem',            harga: 600000,  menit: 60 },
      { nama: 'Tune Up Mesin Diesel',        harga: 750000,  menit: 120 },
      { nama: 'Ganti Filter Solar',          harga: 200000,  menit: 20 },
      { nama: 'Ganti Busi / Glow Plug',      harga: 350000,  menit: 30 },
      { nama: 'Spooring & Balancing',         harga: 400000,  menit: 60 },
      { nama: 'Ganti Ban (4 Roda)',          harga: 4000000, menit: 90 },
      { nama: 'Perbaikan AC',                harga: 650000,  menit: 120 },
      { nama: 'Ganti Aki',                   harga: 850000,  menit: 20 },
      { nama: 'Ganti Kopling Set',           harga: 1500000, menit: 180 },
      { nama: 'Perbaikan Kelistrikan',        harga: 600000,  menit: 120 },
      { nama: 'Overhaul Mesin',              harga: 7000000, menit: 600 },
    ],

    // ───────── BUS ─────────
    'Bus': [
      { nama: 'Servis Berkala',               harga: 1200000, menit: 120 },
      { nama: 'Ganti Oli Mesin',             harga: 800000,  menit: 60 },
      { nama: 'Ganti Oli Transmisi',         harga: 900000,  menit: 60 },
      { nama: 'Ganti Oli Gardan',            harga: 700000,  menit: 45 },
      { nama: 'Ganti Kampas Rem',            harga: 1200000, menit: 90 },
      { nama: 'Tune Up Mesin Diesel',        harga: 1500000, menit: 180 },
      { nama: 'Ganti Filter Solar + Udara',  harga: 500000,  menit: 30 },
      { nama: 'Spooring & Balancing',         harga: 700000,  menit: 90 },
      { nama: 'Ganti Ban (per unit)',         harga: 1500000, menit: 45 },
      { nama: 'Perbaikan AC Bus',             harga: 1200000, menit: 180 },
      { nama: 'Ganti Aki',                   harga: 1200000, menit: 30 },
      { nama: 'Ganti Kopling Set',           harga: 3000000, menit: 240 },
      { nama: 'Perbaikan Suspensi',           harga: 2000000, menit: 180 },
      { nama: 'Perbaikan Kelistrikan',        harga: 1000000, menit: 150 },
      { nama: 'Overhaul Mesin',              harga: 15000000,menit: 960 },
    ],

    // ───────── TRUK RINGAN ─────────
    'Truk Ringan': [
      { nama: 'Servis Berkala',               harga: 700000,  menit: 90 },
      { nama: 'Ganti Oli Mesin',             harga: 500000,  menit: 45 },
      { nama: 'Ganti Oli Transmisi',         harga: 450000,  menit: 45 },
      { nama: 'Ganti Oli Gardan',            harga: 400000,  menit: 30 },
      { nama: 'Ganti Kampas Rem',            harga: 700000,  menit: 60 },
      { nama: 'Tune Up Mesin Diesel',        harga: 850000,  menit: 120 },
      { nama: 'Ganti Filter Solar',          harga: 250000,  menit: 20 },
      { nama: 'Ganti Busi / Glow Plug',      harga: 400000,  menit: 30 },
      { nama: 'Spooring & Balancing',         harga: 450000,  menit: 60 },
      { nama: 'Ganti Ban (per unit)',         harga: 800000,  menit: 30 },
      { nama: 'Ganti Aki',                   harga: 900000,  menit: 20 },
      { nama: 'Ganti Kopling Set',           harga: 1800000, menit: 180 },
      { nama: 'Perbaikan Suspensi',           harga: 1200000, menit: 120 },
      { nama: 'Perbaikan Kelistrikan',        harga: 650000,  menit: 120 },
      { nama: 'Overhaul Mesin',              harga: 8000000, menit: 600 },
    ],

    // ───────── TRUK BERAT ─────────
    'Truk Berat': [
      { nama: 'Servis Berkala',               harga: 1500000, menit: 120 },
      { nama: 'Ganti Oli Mesin',             harga: 1000000, menit: 60 },
      { nama: 'Ganti Oli Transmisi',         harga: 1100000, menit: 60 },
      { nama: 'Ganti Oli Gardan',            harga: 900000,  menit: 45 },
      { nama: 'Ganti Kampas Rem',            harga: 1500000, menit: 90 },
      { nama: 'Tune Up Mesin Diesel',        harga: 1800000, menit: 180 },
      { nama: 'Ganti Filter Solar + Udara',  harga: 600000,  menit: 30 },
      { nama: 'Spooring & Balancing',         harga: 850000,  menit: 90 },
      { nama: 'Ganti Ban (per unit)',         harga: 2000000, menit: 45 },
      { nama: 'Ganti Aki (2 unit)',           harga: 2200000, menit: 30 },
      { nama: 'Ganti Kopling Set',           harga: 4000000, menit: 300 },
      { nama: 'Perbaikan Suspensi',           harga: 3000000, menit: 240 },
      { nama: 'Perbaikan Sistem Pneumatik',  harga: 2500000, menit: 180 },
      { nama: 'Perbaikan Kelistrikan',        harga: 1200000, menit: 150 },
      { nama: 'Overhaul Mesin',              harga: 20000000,menit: 1200 },
    ],
  };

  try {
    for (const cat of categories) {
      // Insert kategori
      const [res] = await pool.query(
        'INSERT INTO kategori_kendaraan (nama_kategori, deskripsi, icon) VALUES (?, ?, ?)',
        [cat.name, cat.desc, cat.icon]
      );
      const categoryId = res.insertId;

      // Insert 15 layanan per kategori
      const services = serviceTemplates[cat.name];
      for (const svc of services) {
        await pool.query(
          'INSERT INTO layanan (kategori_id, nama_layanan, deskripsi, estimasi_menit, harga, is_aktif) VALUES (?, ?, ?, ?, ?, ?)',
          [
            categoryId,
            svc.nama,
            `${svc.nama} untuk kendaraan jenis ${cat.name}`,
            svc.menit,
            svc.harga,
            1,
          ]
        );
      }
      console.log(`  ✔ ${cat.name}: ${services.length} layanan`);
    }
    console.log('--- Seeding Completed Successfully ---');
  } catch (error) {
    console.error('--- Seeding Failed ---', error);
    throw error;
  }
}

module.exports = seedLayanan;
