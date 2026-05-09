import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CONFIG from '../config';

const LAYANAN_ICONS = ['fa-oil-can', 'fa-wrench', 'fa-tire', 'fa-car-crash', 'fa-wind', 'fa-tools', 'fa-cog', 'fa-bolt'];
const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export default function MainPage() {
  const navigate = useNavigate();
  const [layanan, setLayanan] = useState([]);
  const [jadwal, setJadwal] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = '/stylesheets/style.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    fetch(`${CONFIG.API_BASE_URL}/layanan`)
      .then(r => r.json())
      .then(d => setLayanan(d.filter(l => l.is_aktif)))
      .catch(() => {});

    fetch(`${CONFIG.API_BASE_URL}/jadwal`)
      .then(r => r.json())
      .then(d => setJadwal(d))
      .catch(() => {})
      .finally(() => setIsLoaded(true));
  }, []);

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    if (id === '#top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleAmbilAntrian = () => {
    const token = localStorage.getItem('antrian_token');
    const role = localStorage.getItem('antrian_role');
    if (token && role === 'pelanggan') navigate('/customer');
    else navigate('/login');
  };

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar-pub">
        <div className="nav-inner">
          <div className="nav-logo">
            <i className="fas fa-car-side"></i>
            <h2>Antrian<span>Ku</span></h2>
          </div>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <a href="#layanan" onClick={e => handleScrollTo(e, '#layanan')} style={{ color: '#64748b', fontWeight: 600, fontSize: '0.95rem' }}>Layanan</a>
            <a href="#jadwal" onClick={e => handleScrollTo(e, '#jadwal')} style={{ color: '#64748b', fontWeight: 600, fontSize: '0.95rem' }}>Jadwal</a>
          </div>
          <div className="nav-actions">
            <Link to="/login" className="btn-nav-outline">Masuk</Link>
            <button className="btn-nav-accent" onClick={handleAmbilAntrian}>
              <i className="fas fa-ticket-alt"></i> Ambil Antrian
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-pub" id="top">
        <div className="hero-content-pub">
          <div className="hero-badge">
            <i className="fas fa-circle" style={{ fontSize: '0.5rem', color: '#22c55e' }}></i>
            Bengkel Buka Hari Ini
          </div>
          <h1>Antrian Bengkel<br /><span>Tanpa Nunggu Lama</span></h1>
          <p>Ambil nomor antrian dari rumah, pantau status secara real-time, dan datang saat giliran tiba. Hemat waktu, lebih nyaman.</p>
          <div className="hero-buttons">
            <button className="btn-hero-primary" onClick={handleAmbilAntrian}>
              <i className="fas fa-ticket-alt"></i> Ambil Nomor Sekarang
            </button>
            <button className="btn-hero-secondary" onClick={e => handleScrollTo(e, '#layanan')}>
              <i className="fas fa-list-ul"></i> Lihat Layanan
            </button>
          </div>
        </div>
      </section>

      {/* FLOATING STATS */}
      <div className="container">
        <div className="stats-float">
          <div className="stat-item">
            <i className="fas fa-mobile-alt"></i>
            <h4>Digital & Online</h4>
            <p>Antrian dari genggaman tangan</p>
          </div>
          <div className="stat-item">
            <i className="fas fa-clock"></i>
            <h4>Real-Time Status</h4>
            <p>Pantau posisi antrian langsung</p>
          </div>
          <div className="stat-item">
            <i className="fas fa-bell"></i>
            <h4>Notifikasi Otomatis</h4>
            <p>Dipanggil saat giliran tiba</p>
          </div>
        </div>
      </div>

      {/* LAYANAN */}
      <section className="section-pub" id="layanan">
        <div className="container">
          <div className="section-title-pub">
            <span className="badge-section">LAYANAN KAMI</span>
            <h2>Jasa Servis Lengkap</h2>
            <p>Pilih layanan yang kamu butuhkan dan ambil nomor antrian secara online</p>
          </div>
          <div className="layanan-grid">
            {layanan.length === 0 && isLoaded ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: '60px' }}>
                <i className="fas fa-tools" style={{ fontSize: '3rem', marginBottom: '16px', display: 'block', opacity: 0.3 }}></i>
                <p style={{ fontWeight: 600 }}>Belum ada layanan tersedia</p>
              </div>
            ) : (
              layanan.map((l, i) => (
                <div className="layanan-card" key={l.id}>
                  <div className="layanan-icon">
                    <i className={`fas ${LAYANAN_ICONS[i % LAYANAN_ICONS.length]}`}></i>
                  </div>
                  <h3>{l.nama_layanan}</h3>
                  <p>{l.deskripsi || 'Layanan servis kendaraan profesional oleh teknisi berpengalaman.'}</p>
                  <span className="estimasi-tag">
                    <i className="fas fa-clock"></i> ±{l.estimasi_menit} menit
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* SOP */}
      <section className="section-pub" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="sop-wrap">
            <div className="sop-title">
              <h2>Cara Ambil Antrian</h2>
              <p>Cukup 4 langkah mudah, antrian kamu sudah terdaftar</p>
            </div>
            <div className="steps-grid">
              {[
                { num: 1, icon: 'fa-user-plus', title: 'Daftar Akun', desc: 'Buat akun pelanggan dengan email dan nomor HP kamu' },
                { num: 2, icon: 'fa-list-check', title: 'Pilih Layanan', desc: 'Pilih jenis servis yang kamu butuhkan dari daftar layanan' },
                { num: 3, icon: 'fa-ticket-alt', title: 'Ambil Nomor', desc: 'Dapatkan nomor antrian otomatis beserta estimasi waktu' },
                { num: 4, icon: 'fa-car', title: 'Datang & Dilayani', desc: 'Datang ke bengkel saat giliran tiba dan langsung dilayani' },
              ].map(s => (
                <div className="step-card" key={s.num}>
                  <div className="step-num">{s.num}</div>
                  <h4>{s.title}</h4>
                  <p>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* JADWAL */}
      <section className="section-pub" style={{ paddingTop: 0 }} id="jadwal">
        <div className="container">
          <div className="section-title-pub">
            <span className="badge-section">JADWAL OPERASIONAL</span>
            <h2>Jam Buka Bengkel</h2>
            <p>Kami melayani kamu pada jam operasional berikut</p>
          </div>
          <div className="jadwal-grid">
            {jadwal.length === 0 ? (
              Array.from({ length: 7 }, (_, i) => (
                <div className={`jadwal-card ${i === 0 ? 'libur' : ''}`} key={i}>
                  <div className="day-name">{NAMA_HARI[i]}</div>
                  <div className="jam">{i === 0 ? '—' : '08:00 – 17:00'}</div>
                  <span className="status-label">{i === 0 ? 'Libur' : 'Buka'}</span>
                </div>
              ))
            ) : (
              jadwal.map(j => (
                <div className={`jadwal-card ${j.is_libur ? 'libur' : ''}`} key={j.id}>
                  <div className="day-name">{NAMA_HARI[j.hari]}</div>
                  <div className="jam">
                    {j.is_libur ? '—' : `${j.jam_buka.substring(0,5)} – ${j.jam_tutup.substring(0,5)}`}
                  </div>
                  <span className="status-label">{j.is_libur ? 'Libur' : 'Buka'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <div className="container">
        <div className="cta-section">
          <h2>Siap Servis Kendaraanmu?</h2>
          <p>Daftar sekarang dan nikmati kemudahan antrian digital tanpa perlu antre panjang di bengkel</p>
          <button className="btn-cta-white" onClick={handleAmbilAntrian}>
            <i className="fas fa-ticket-alt"></i> Ambil Antrian Sekarang
          </button>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="footer-pub">
        <div className="footer-inner">
          <div className="footer-brand">
            <h2><span>Antrian</span>Ku UMKM</h2>
            <p>Sistem antrian online untuk bengkel UMKM. Modernisasi pelayanan, tingkatkan kepuasan pelanggan.</p>
            <ul style={{ listStyle: 'none' }}>
              <li style={{ marginBottom: '10px', display: 'flex', gap: '10px', alignItems: 'center' }}>
                <i className="fas fa-map-marker-alt" style={{ color: '#f97316' }}></i>
                Jl. Raya Bengkel No. 1, Kota
              </li>
              <li style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <i className="fas fa-phone" style={{ color: '#f97316' }}></i>
                0812-3456-7890
              </li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Navigasi</h4>
            <ul>
              <li><i className="fas fa-chevron-right"></i><a href="#top" onClick={e => handleScrollTo(e,'#top')}>Beranda</a></li>
              <li><i className="fas fa-chevron-right"></i><a href="#layanan" onClick={e => handleScrollTo(e,'#layanan')}>Layanan</a></li>
              <li><i className="fas fa-chevron-right"></i><a href="#jadwal" onClick={e => handleScrollTo(e,'#jadwal')}>Jadwal</a></li>
            </ul>
          </div>
          <div className="footer-col">
            <h4>Akun</h4>
            <ul>
              <li><i className="fas fa-user-plus"></i><Link to="/register">Daftar Akun</Link></li>
              <li><i className="fas fa-sign-in-alt"></i><Link to="/login">Login Pelanggan</Link></li>
              <li><i className="fas fa-lock"></i><Link to="/admin/login">Portal Admin</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 AntrianKu UMKM Bengkel. Semua Hak Dilindungi.</p>
        </div>
      </footer>
    </>
  );
}
