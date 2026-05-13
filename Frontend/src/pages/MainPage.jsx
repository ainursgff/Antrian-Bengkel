import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CONFIG from '../config';

const LAYANAN_ICONS = ['fa-oil-can', 'fa-wrench', 'fa-tire', 'fa-car-crash', 'fa-wind', 'fa-tools', 'fa-cog', 'fa-bolt'];
const NAMA_HARI = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const STATUS_MAP = {
  menunggu: { label: 'Menunggu', color: '#d97706', bg: '#fffbeb', icon: 'fa-clock' },
  dipanggil: { label: 'Dipanggil!', color: '#2563eb', bg: '#eff6ff', icon: 'fa-bell' },
  sedang_dilayani: { label: 'Sedang Dilayani', color: '#ea580c', bg: '#fff7ed', icon: 'fa-car-crash' },
  selesai: { label: 'Selesai', color: '#16a34a', bg: '#f0fdf4', icon: 'fa-check-circle' },
  dibatalkan: { label: 'Dibatalkan', color: '#dc2626', bg: '#fef2f2', icon: 'fa-times-circle' },
};

export default function MainPage() {
  const navigate = useNavigate();
  
  const token = localStorage.getItem('antrian_token');
  const role = localStorage.getItem('antrian_role');
  const user = JSON.parse(localStorage.getItem('antrian_user') || '{}');
  const isLoggedIn = !!(token && role === 'pelanggan');
  const isLoggedInAdmin = !!(token && role === 'admin');

  const [layanan, setLayanan] = useState([]);
  const [jadwal, setJadwal] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const [waktu, setWaktu] = useState(new Date());

  // User States
  const [activeTab, setActiveTab] = useState('status');
  const [antrianAktif, setAntrianAktif] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [notifikasi, setNotifikasi] = useState([]);
  const [selectedLayanan, setSelectedLayanan] = useState([]);
  const [kendaraan, setKendaraan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isLoadingForm, setIsLoadingForm] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [showRiwayatModal, setShowRiwayatModal] = useState(false);
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAmbilModal, setShowAmbilModal] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [selectedRiwayatItem, setSelectedRiwayatItem] = useState(null);

  const formatTanggalIndo = (tglStr) => {
    if (!tglStr) return '-';
    try {
      const d = new Date(tglStr);
      if (isNaN(d.getTime())) return tglStr.substring(0, 10);
      const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch { return tglStr.substring(0, 10); }
  };

  useEffect(() => {
    const link = document.createElement('link');
    link.href = '/stylesheets/style.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    return () => { document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    const clockIv = setInterval(() => setWaktu(new Date()), 1000);
    return () => clearInterval(clockIv);
  }, []);

  useEffect(() => {
    if (isLoggedIn && sessionStorage.getItem('show_welcome_toast') === 'true') {
      setShowWelcome(true);
      sessionStorage.removeItem('show_welcome_toast');
      const timer = setTimeout(() => setShowWelcome(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    Promise.all([
      fetch(`${CONFIG.API_BASE_URL}/layanan`).then(r => r.json()),
      fetch(`${CONFIG.API_BASE_URL}/jadwal`).then(r => r.json())
    ])
    .then(([layananData, jadwalData]) => {
      if (Array.isArray(layananData)) setLayanan(layananData.filter(l => l.is_aktif));
      if (Array.isArray(jadwalData)) setJadwal(jadwalData);
      setIsLoaded(true);
    })
    .catch(() => {
      setIsError(true);
      setIsLoaded(true);
    });

    if (isLoggedIn) {
      fetchAntrianAktif();
      fetchRiwayat();
      fetchNotifikasi();
      const iv = setInterval(fetchAntrianAktif, 8000);
      return () => { clearInterval(iv); };
    }
  }, [isLoggedIn]);

  const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchAntrianAktif = async () => {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/antrian/aktif`, { headers: authHeader });
      if (res.status === 401 || res.status === 403) return handleLogout();
      const data = await res.json();
      setAntrianAktif(data.error ? null : data);
    } catch { setAntrianAktif(null); }
  };
  const fetchRiwayat = async () => {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/antrian`, { headers: authHeader });
      if (res.status === 401 || res.status === 403) return handleLogout();
      const data = await res.json();
      setRiwayat(Array.isArray(data) ? data : []);
    } catch {}
  };
  const fetchNotifikasi = async () => {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/notifikasi`, { headers: authHeader });
      if (res.status === 401 || res.status === 403) return handleLogout();
      const data = await res.json();
      setNotifikasi(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleAmbilAntrian = async (e) => {
    e.preventDefault();
    if (selectedLayanan.length === 0) { setMsg({ type: 'error', text: 'Pilih minimal satu layanan' }); return false; }
    setIsLoadingForm(true); setMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/antrian`, {
        method: 'POST', headers: authHeader,
        body: JSON.stringify({ layanan_id: selectedLayanan.join(','), kendaraan, catatan })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ type: 'success', text: `Nomor antrian ${data.antrian.nomor_antrian} berhasil diambil!` });
        setSelectedLayanan([]); setKendaraan(''); setCatatan('');
        fetchAntrianAktif(); fetchRiwayat(); setActiveTab('status');
        return true;
      } else {
        setMsg({ type: 'error', text: data.error || 'Gagal mengambil antrian' });
        return false;
      }
    } catch { setMsg({ type: 'error', text: 'Gagal menghubungi server' }); return false; }
    finally { setIsLoadingForm(false); }
  };

  const handleBatalkan = async (id) => {
    if (!window.confirm('Yakin ingin membatalkan antrian ini?')) return;
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/antrian/${id}/batalkan`, { method: 'PUT', headers: authHeader });
      if (res.ok) {
        setMsg({ type: 'success', text: 'Antrian berhasil dibatalkan' });
        fetchAntrianAktif(); fetchRiwayat();
      } else alert((await res.json()).error);
    } catch { alert('Gagal membatalkan antrian'); }
  };

  const handleLogout = async () => {
    await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, { method: 'POST', headers: authHeader });
    localStorage.removeItem('antrian_token');
    localStorage.removeItem('antrian_role');
    localStorage.removeItem('antrian_user');
    window.location.reload();
  };

  const handleScrollTo = (e, id) => {
    e.preventDefault();
    if (id === '#top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    const el = document.querySelector(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const unreadCount = notifikasi.filter(n => !n.is_read).length;

  const todayDayIndex = waktu.getDay();
  const todayJadwal = jadwal.find(j => j.hari === todayDayIndex);
  
  let isBengkelOpen = true;
  let statusTextBengkel = 'Bengkel Buka Hari Ini';

  if (isLoaded && todayJadwal) {
    if (todayJadwal.is_libur === 1) {
      isBengkelOpen = false;
      statusTextBengkel = 'Bengkel Libur Hari Ini';
    } else {
      const formatTimeValue = (timeStr) => {
        if (!timeStr) return 0;
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
      };
      const currentMinutes = waktu.getHours() * 60 + waktu.getMinutes();
      const bukaMinutes = formatTimeValue(todayJadwal.jam_buka);
      const tutupMinutes = formatTimeValue(todayJadwal.jam_tutup);

      if (currentMinutes < bukaMinutes) {
        isBengkelOpen = false;
        statusTextBengkel = `Bengkel Belum Buka (Buka jam ${todayJadwal.jam_buka.substring(0, 5)})`;
      } else if (currentMinutes >= tutupMinutes) {
        isBengkelOpen = false;
        statusTextBengkel = `Bengkel Sudah Tutup (Tutup jam ${todayJadwal.jam_tutup.substring(0, 5)})`;
      } else {
        isBengkelOpen = true;
        statusTextBengkel = `Bengkel Buka (Tutup jam ${todayJadwal.jam_tutup.substring(0, 5)})`;
      }
    }
  }

  return (
    <>
      <style>{`
        html { scroll-behavior: smooth; }
        .dashboard-tab {
          padding: 10px 20px;
          border-radius: 50px;
          border: none;
          background: #f1f5f9;
          color: #64748b;
          font-weight: 700;
          cursor: pointer;
          font-size: 0.95rem;
          transition: all 0.2s;
        }
        .dashboard-tab.active {
          background: #f97316;
          color: #fff;
        }
        .nav-link-custom {
          color: #64748b;
          transition: all 0.2s;
        }
        .nav-link-custom:hover {
          color: #f97316 !important;
          transform: translateY(-1px);
        }
        .header-icon-btn {
          color: #64748b;
          transition: all 0.2s;
        }
        .header-icon-btn:hover {
          color: #f97316 !important;
          transform: translateY(-2px);
        }
        .custom-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2000;
          animation: fadeIn 0.25s ease-out;
        }
        .custom-modal {
          background: #fff;
          border-radius: 24px;
          width: 90%;
          max-width: 650px;
          max-height: 80vh;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .custom-modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background: #f8fafc;
        }
        .custom-modal-header h4 {
          margin: 0;
          font-weight: 800;
          color: #0f172a;
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 1.15rem;
        }
        .custom-modal-close {
          background: #e2e8f0;
          border: none;
          color: #64748b;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }
        .custom-modal-close:hover {
          background: #ef4444;
          color: #fff;
        }
        .custom-modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(40px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes slideDownFadeInOut {
          0% { transform: translate(-50%, -20px); opacity: 0; }
          12% { transform: translate(-50%, 0); opacity: 1; }
          88% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -20px); opacity: 0; }
        }
      `}</style>
      
      {showWelcome && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'rgba(22, 163, 74, 0.95)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          padding: '16px 28px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: '700',
          fontSize: '1rem',
          animation: 'slideDownFadeInOut 3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', width: '32px', height: '32px', borderRadius: '50%' }}>
            <i className="fas fa-check" style={{ fontSize: '1rem' }}></i>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9, fontWeight: 500 }}>Login Berhasil</div>
            <div>Selamat Datang, {user.nama || 'Pelanggan'}! 👋</div>
          </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="navbar-pub" style={{ position: 'sticky', top: 0, zIndex: 1000, background: '#fff' }}>
        <div className="nav-inner">
          <div className="nav-logo" onClick={() => window.scrollTo(0,0)} style={{ cursor:'pointer' }}>
            <i className="fas fa-car-side"></i>
            <h2>Antrian<span>Ku</span></h2>
          </div>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <a href="#layanan" onClick={e => handleScrollTo(e, '#layanan')} style={{ color: '#64748b', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none', transition: 'color 0.2s' }} className="nav-link-custom">Layanan</a>
            <a href="#jadwal" onClick={e => handleScrollTo(e, '#jadwal')} style={{ color: '#64748b', fontWeight: 600, fontSize: '0.95rem', textDecoration: 'none', transition: 'color 0.2s' }} className="nav-link-custom">Jadwal</a>
            {isLoggedIn && (
              <>
                <button onClick={() => setShowStatusModal(true)} style={{ background: 'none', border: 'none', color: '#64748b', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, fontFamily: 'inherit', transition: 'color 0.2s' }} className="nav-link-custom"><i className="fas fa-list-check"></i> Status Antrian</button>
                <button onClick={() => setShowAmbilModal(true)} style={{ background: 'none', border: 'none', color: '#f97316', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: 0, fontFamily: 'inherit', transition: 'color 0.2s' }} className="nav-link-custom"><i className="fas fa-plus-circle"></i> Ambil Antrian</button>
              </>
            )}
          </div>
          <div className="nav-actions">
            {isLoggedIn ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* ICON: RIWAYAT */}
                <button 
                  onClick={() => setShowRiwayatModal(true)} 
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.15rem', cursor: 'pointer', position: 'relative', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                  title="Riwayat Antrian"
                  className="header-icon-btn"
                >
                  <i className="fas fa-history"></i>
                </button>

                {/* ICON: NOTIFIKASI */}
                <button 
                  onClick={() => setShowNotifModal(true)} 
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '1.15rem', cursor: 'pointer', position: 'relative', padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'color 0.2s' }}
                  title="Notifikasi"
                  className="header-icon-btn"
                >
                  <i className="fas fa-bell"></i>
                  {unreadCount > 0 && (
                    <span style={{ position: 'absolute', top: -5, right: -5, background: '#ef4444', color: '#fff', fontSize: '0.65rem', fontWeight: 900, borderRadius: '50%', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 0 0 2px #fff' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
                  <i className="fas fa-user-circle" style={{ color: '#94a3b8', fontSize: '1.1rem' }}></i> {user.nama}
                </span>
                <button onClick={handleLogout} className="btn-nav-outline" style={{ padding: '6px 14px', fontSize: '0.85rem' }}>Keluar</button>
              </div>
            ) : isLoggedInAdmin ? (
              <Link to="/admin" className="btn-nav-outline" style={{ background: '#0f172a', color: '#fff', border: 'none' }}><i className="fas fa-shield-alt" style={{ marginRight: 6 }}></i>Panel Admin</Link>
            ) : (
              <Link to="/login" className="btn-nav-outline">Masuk</Link>
            )}
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-pub" id="top">
        <div className="hero-content-pub">
          <div className="hero-badge" style={{ 
            background: isBengkelOpen ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
            border: isBengkelOpen ? '1px solid rgba(34, 197, 94, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)', 
            color: isBengkelOpen ? '#22c55e' : '#ef4444' 
          }}>
            <i className="fas fa-circle" style={{ fontSize: '0.5rem', color: isBengkelOpen ? '#22c55e' : '#ef4444' }}></i>
            {statusTextBengkel}
          </div>
          <h1>Antrian Bengkel<br /><span>Tanpa Nunggu Lama</span></h1>
          <p>Ambil nomor antrian dari rumah, pantau status secara real-time, dan datang saat giliran tiba. Hemat waktu, lebih nyaman.</p>
          <div className="hero-buttons">
            <button className="btn-hero-primary" onClick={(e) => {
              if (isLoggedIn) {
                setShowAmbilModal(true);
              } else if (isLoggedInAdmin) {
                alert('Admin hanya bisa melihat tampilan, tidak bisa mengambil antrian.');
              } else {
                navigate('/login');
              }
            }}>
              <i className="fas fa-ticket-alt"></i> Ambil Nomor Sekarang
            </button>
          </div>
        </div>
      </section>

      {/* DASHBOARD SECTION REMOVED FROM LANDING PAGE TO PREVENT DOUBLE BUTTONS. MOVED TO POPUPS AND NAVBAR ACTION! */}

      {/* FLOATING STATS */}
      <div className="container" style={{ marginTop: isLoggedIn ? 40 : 0 }}>
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
            {!isLoaded ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: '60px' }}>
                <div className="spinner-border text-warning mb-3" role="status"></div>
                <p style={{ fontWeight: 600 }}>Memuat data layanan...</p>
              </div>
            ) : isError || layanan.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: '60px' }}>
                <i className="fas fa-server" style={{ fontSize: '3rem', marginBottom: '16px', display: 'block', opacity: 0.3 }}></i>
                <p style={{ fontWeight: 600 }}>Tidak dapat terhubung ke server atau layanan belum tersedia.</p>
              </div>
            ) : (
              layanan.map((l, i) => (
                <div className="layanan-card" key={l.id}>
                  <div className="layanan-icon">
                    <i className={`fas ${LAYANAN_ICONS[i % LAYANAN_ICONS.length]}`}></i>
                  </div>
                  <h3>{l.nama_layanan}</h3>
                  <p>{l.deskripsi || 'Layanan servis kendaraan profesional oleh teknisi berpengalaman.'}</p>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                    <span className="estimasi-tag" style={{ margin: 0 }}>
                      <i className="fas fa-clock"></i> ±{l.estimasi_menit} mnt
                    </span>
                    <span className="estimasi-tag" style={{ margin: 0, background: '#fff7ed', color: '#f97316', border: '1px solid #ffedd5' }}>
                      <i className="fas fa-wallet"></i> Rp {l.harga ? l.harga.toLocaleString('id-ID') : '0'}
                    </span>
                  </div>
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
            {!isLoaded ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                <div className="spinner-border text-warning mb-3" role="status"></div>
                <p style={{ fontWeight: 600 }}>Memuat jadwal...</p>
              </div>
            ) : isError || jadwal.length === 0 ? (
              <div style={{ gridColumn: '1/-1', textAlign: 'center', color: '#94a3b8', padding: '40px' }}>
                <i className="fas fa-calendar-times" style={{ fontSize: '3rem', marginBottom: '16px', display: 'block', opacity: 0.3 }}></i>
                <p style={{ fontWeight: 600 }}>Gagal memuat jadwal operasional. Pastikan backend aktif.</p>
              </div>
            ) : (
              jadwal.map(j => (
                <div className={`jadwal-card ${j.is_libur ? 'libur' : ''}`} key={j.id}>
                  <div className="day-name">{NAMA_HARI[j.hari]}</div>
                  <div className="jam">
                    {j.is_libur ? '—' : `${j.jam_buka ? j.jam_buka.substring(0,5) : '-'} – ${j.jam_tutup ? j.jam_tutup.substring(0,5) : '-'}`}
                  </div>
                  <span className="status-label">{j.is_libur ? 'Libur' : 'Buka'}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer-pub">
        <div className="footer-inner">
          <div className="footer-brand">
            <h2><span>Antrian</span>Ku Bengkel</h2>
            <p>Sistem antrian online untuk bengkel. Modernisasi pelayanan, tingkatkan kepuasan pelanggan.</p>
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
              <li><i className="fas fa-sign-in-alt"></i><Link to="/login">Masuk ke Sistem</Link></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© 2026 AntrianKu Bengkel. Semua Hak Dilindungi.</p>
        </div>
      </footer>

      {/* MODAL: RIWAYAT POPUP */}
      {showRiwayatModal && (
        <div className="custom-overlay" onClick={e => e.target === e.currentTarget && setShowRiwayatModal(false)}>
          <div className="custom-modal" style={{ maxWidth: '750px' }}>
            <div className="custom-modal-header">
              <h4><i className="fas fa-history" style={{ color: '#f97316' }}></i> Riwayat Antrian Anda</h4>
              <button className="custom-modal-close" onClick={() => setShowRiwayatModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="custom-modal-body">
              {riwayat.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <i className="fas fa-history" style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}></i>
                  <p style={{ fontWeight: 600 }}>Belum ada riwayat antrian</p>
                </div>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '650px' }}>
                      <thead style={{ background: '#f8fafc' }}>
                        <tr>
                          <th style={{ padding: '16px 20px', fontSize: '0.82rem', color: '#64748b', fontWeight: 800 }}>Nomor</th>
                          <th style={{ padding: '16px 20px', fontSize: '0.82rem', color: '#64748b', fontWeight: 800 }}>Layanan & Rincian</th>
                          <th style={{ padding: '16px 20px', fontSize: '0.82rem', color: '#64748b', fontWeight: 800 }}>Tanggal</th>
                          <th style={{ padding: '16px 20px', fontSize: '0.82rem', color: '#64748b', fontWeight: 800 }}>Total Biaya</th>
                          <th style={{ padding: '16px 20px', fontSize: '0.82rem', color: '#64748b', fontWeight: 800 }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {riwayat.map((a, i) => {
                          const s = STATUS_MAP[a.status] || {};
                          return (
                            <tr 
                              key={a.id} 
                              onClick={() => setSelectedRiwayatItem(a)}
                              style={{ borderTop: '1px solid #e2e8f0', background: i % 2 === 0 ? '#fff' : '#fafafa', cursor: 'pointer' }}
                              title="Klik untuk melihat detail kartu"
                            >
                              <td style={{ padding: '16px 20px', fontWeight: 800, color: '#f97316' }}>{a.nomor_antrian}</td>
                              <td style={{ padding: '16px 20px', fontWeight: 600, color: '#0f172a' }}>
                                <div>{a.nama_layanan}</div>
                                <div style={{ fontSize: '0.72rem', color: '#ea580c', fontWeight: 700, marginTop: 4 }}>
                                  {a.rincian_harga ? a.rincian_harga.replace(/,/g, ' +') : '-'}
                                </div>
                              </td>
                              <td style={{ padding: '16px 20px', color: '#64748b', fontSize: '0.9rem' }}>{formatTanggalIndo(a.tanggal)}</td>
                              <td style={{ padding: '16px 20px', fontWeight: 800, color: '#16a34a', fontSize: '0.92rem' }}>
                                Rp {a.total_harga ? a.total_harga.toLocaleString('id-ID') : '0'}
                              </td>
                              <td style={{ padding: '16px 20px' }}>
                                <span style={{ background: s.bg, color: s.color, padding: '6px 12px', borderRadius: 50, fontSize: '0.78rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                  <i className={`fas ${s.icon}`}></i> {s.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: KARTU DETAIL RIWAYAT ANTRIAN */}
      {selectedRiwayatItem && (
        <div className="custom-overlay" onClick={e => e.target === e.currentTarget && setSelectedRiwayatItem(null)} style={{ zIndex: 10001 }}>
          <div className="custom-modal" style={{ maxWidth: '500px' }}>
            <div className="custom-modal-header" style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ padding: '8px 16px', borderRadius: 14, background: '#f97316', color: '#fff', display: 'flex', alignItems: 'center', gap: 8, fontSize: '1.25rem', fontWeight: 900, boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}>
                  <i className="fas fa-ticket-alt"></i> <span>{selectedRiwayatItem.nomor_antrian}</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a', fontWeight: 800 }}>Kartu Detail Antrian</h4>
                  <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Riwayat Pendaftaran Bengkel</span>
                </div>
              </div>
              <button className="custom-modal-close" onClick={() => setSelectedRiwayatItem(null)}><i className="fas fa-times"></i></button>
            </div>
            <div className="custom-modal-body" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, background: '#f8fafc', padding: '12px 16px', borderRadius: 12 }}>
                <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 700 }}>Status Pelayanan</span>
                {(() => {
                  const s = STATUS_MAP[selectedRiwayatItem.status] || STATUS_MAP.menunggu;
                  return (
                    <span style={{ background: s.bg, color: s.color, padding: '6px 14px', borderRadius: 50, fontSize: '0.85rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <i className={`fas ${s.icon}`}></i> {s.label}
                    </span>
                  );
                })()}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Layanan & Pengerjaan</span>
                  <strong style={{ color: '#0f172a', fontSize: '1rem', display: 'block' }}>{selectedRiwayatItem.nama_layanan}</strong>
                  <div style={{ fontSize: '0.8rem', color: '#ea580c', fontWeight: 700, marginTop: 4, background: '#fff7ed', padding: '6px 12px', borderRadius: 8, display: 'inline-block', border: '1px solid #ffedd5' }}>
                    <i className="fas fa-receipt" style={{ marginRight: 4 }}></i> {selectedRiwayatItem.rincian_harga ? selectedRiwayatItem.rincian_harga.replace(/,/g, ' +') : '-'}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0', padding: '16px 0' }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Tanggal Antrian</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{formatTanggalIndo(selectedRiwayatItem.tanggal)}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Total Biaya</span>
                    <strong style={{ color: '#16a34a', fontSize: '1.1rem', fontWeight: 900 }}>Rp {selectedRiwayatItem.total_harga ? selectedRiwayatItem.total_harga.toLocaleString('id-ID') : '0'}</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Estimasi Waktu</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{selectedRiwayatItem.estimasi_menit || 30} Menit</strong>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Slot Waktu Mulai</span>
                    <strong style={{ color: '#0f172a', fontSize: '0.95rem' }}>{selectedRiwayatItem.slot_waktu ? selectedRiwayatItem.slot_waktu.substring(0,5) + ' WIB' : '-'}</strong>
                  </div>
                </div>

                {selectedRiwayatItem.kendaraan && (
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Kendaraan</span>
                    <div style={{ color: '#334155', fontSize: '0.9rem', background: '#f1f5f9', padding: '8px 12px', borderRadius: 8, fontWeight: 600 }}>{selectedRiwayatItem.kendaraan}</div>
                  </div>
                )}

                {selectedRiwayatItem.catatan && (
                  <div>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>Catatan Keluhan</span>
                    <p style={{ margin: 0, color: '#475569', fontSize: '0.88rem', lineHeight: 1.5, background: '#f8fafc', padding: '10px 14px', borderRadius: 8, fontStyle: 'italic' }}>"{selectedRiwayatItem.catatan}"</p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <button onClick={() => setSelectedRiwayatItem(null)} style={{ width: '100%', padding: '12px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer', fontSize: '0.95rem' }}>Tutup Kartu</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NOTIFIKASI POPUP */}
      {showNotifModal && (
        <div className="custom-overlay" onClick={e => e.target === e.currentTarget && setShowNotifModal(false)}>
          <div className="custom-modal">
            <div className="custom-modal-header">
              <h4><i className="fas fa-bell" style={{ color: '#f97316' }}></i> Notifikasi Anda</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {unreadCount > 0 && (
                  <button onClick={async () => {
                    await fetch(`${CONFIG.API_BASE_URL}/notifikasi/read-all`, { method: 'PUT', headers: authHeader });
                    fetchNotifikasi();
                  }} style={{ fontSize: '0.8rem', color: '#f97316', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800 }}>
                    Tandai Semua Dibaca
                  </button>
                )}
                <button className="custom-modal-close" onClick={() => setShowNotifModal(false)}><i className="fas fa-times"></i></button>
              </div>
            </div>
            <div className="custom-modal-body">
              {notifikasi.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
                  <i className="fas fa-bell-slash" style={{ fontSize: '3rem', marginBottom: 16, opacity: 0.5 }}></i>
                  <p style={{ fontWeight: 600 }}>Tidak ada notifikasi baru</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {notifikasi.map(n => (
                    <div key={n.id} style={{ padding: 16, border: '1px solid #e2e8f0', borderRadius: 16, background: n.is_read ? '#fff' : '#fff7ed', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: n.is_read ? '#f1f5f9' : '#fed7aa', color: n.is_read ? '#94a3b8' : '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem' }}>
                        <i className="fas fa-bell"></i>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                          <strong style={{ color: '#0f172a', fontSize: '0.9rem', textTransform: 'capitalize' }}>{n.tipe}</strong>
                          <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>{new Date(n.sent_at).toLocaleTimeString('id-ID', {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p style={{ color: '#475569', margin: 0, fontSize: '0.88rem', lineHeight: 1.5 }}>{n.pesan}</p>
                      </div>
                      {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', marginTop: 14 }}></div>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STATUS ANTRIAN */}
      {showStatusModal && (
        <div className="custom-overlay" onClick={e => e.target === e.currentTarget && setShowStatusModal(false)}>
          <div className="custom-modal" style={{ maxWidth: '600px' }}>
            <div className="custom-modal-header">
              <h4><i className="fas fa-list-check" style={{ color: '#f97316' }}></i> Status Antrian Aktif Anda</h4>
              <button className="custom-modal-close" onClick={() => setShowStatusModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="custom-modal-body">
              {msg.text && (
                <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`, color: msg.type === 'success' ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', fontWeight: 600 }}>
                  <i className={`fas ${msg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                  <span style={{ flex: 1 }}>{msg.text}</span>
                  <button onClick={() => setMsg({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><i className="fas fa-times"></i></button>
                </div>
              )}

              {antrianAktif ? (
                <div style={{ maxWidth: '100%', margin: '0 auto' }}>
                  <div style={{ background: '#fff', border: '2px dashed #e2e8f0', borderRadius: 24, padding: 24, position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: -20, right: -20, fontSize: '10rem', color: '#f8fafc', zIndex: 0, opacity: 0.5 }}><i className="fas fa-ticket-alt"></i></div>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px dashed #f1f5f9', paddingBottom: 20, marginBottom: 20 }}>
                        <div>
                          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>Nomor Antrian</span>
                          <div style={{ fontSize: '2.5rem', fontWeight: 900, color: '#f97316', lineHeight: 1 }}>{antrianAktif.nomor_antrian}</div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          {(() => {
                            const s = STATUS_MAP[antrianAktif.status] || STATUS_MAP.menunggu;
                            return (
                              <div style={{ background: s.bg, color: s.color, padding: '6px 14px', borderRadius: 50, fontWeight: 800, fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                                <i className={`fas ${s.icon}`}></i> {s.label}
                              </div>
                            );
                          })()}
                          {antrianAktif.posisi_antrian !== undefined && antrianAktif.status === 'menunggu' && (
                            <div style={{ marginTop: 6, color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>
                              <i className="fas fa-users"></i> {antrianAktif.posisi_antrian} antrian di depanmu
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Layanan & Rincian Biaya</span>
                          <strong style={{ color: '#0f172a', fontSize: '0.92rem', display: 'block' }}>{antrianAktif.nama_layanan}</strong>
                          <div style={{ fontSize: '0.78rem', color: '#ea580c', fontWeight: 700, marginTop: 4, background: '#fff7ed', padding: '6px 12px', borderRadius: 8, display: 'inline-block', border: '1px solid #ffedd5' }}>
                            <i className="fas fa-receipt"></i> Rincian: {antrianAktif.rincian_harga ? antrianAktif.rincian_harga.replace(/,/g, ' +') : '-'}
                          </div>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Total Estimasi Biaya</span>
                          <strong style={{ color: '#16a34a', fontSize: '1.05rem', fontWeight: 900 }}>Rp {antrianAktif.total_harga ? antrianAktif.total_harga.toLocaleString('id-ID') : '0'}</strong>
                        </div>
                        <div>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Estimasi Mulai Servis</span>
                          <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{antrianAktif.slot_waktu ? antrianAktif.slot_waktu.substring(0,5) + ' WIB' : '-'}</strong>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>Tanggal</span>
                          <strong style={{ color: '#0f172a', fontSize: '0.9rem' }}>{antrianAktif.tanggal}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  {antrianAktif.status === 'dipanggil' && (
                    <div style={{ background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 16, padding: 16, textAlign: 'center', marginTop: 20 }}>
                      <div style={{ fontSize: '1.8rem', marginBottom: 6 }}>🔔</div>
                      <h5 style={{ color: '#1d4ed8', fontWeight: 800, margin: '0 0 4px 0', fontSize: '1rem' }}>Kamu Dipanggil!</h5>
                      <p style={{ color: '#3b82f6', fontSize: '0.9rem', margin: 0 }}>Segera menuju loket pelayanan bengkel.</p>
                    </div>
                  )}

                  {['menunggu', 'dipanggil'].includes(antrianAktif.status) && (() => {
                    try {
                      const isMenunggu = antrianAktif.status === 'menunggu';
                      const cTime = antrianAktif.created_at ? new Date(antrianAktif.created_at).getTime() : 0;
                      const tLeft = Math.max(0, (180000 - (waktu.getTime() - cTime)) / 1000);
                      const canCancel = tLeft > 0 && cTime > 0;
                      const m = isNaN(tLeft) ? 0 : Math.floor(tLeft / 60);
                      const s = isNaN(tLeft) ? 0 : Math.floor(tLeft % 60);
                      const timerText = `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

                      return (
                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                          {canCancel ? (
                            <>
                              <div style={{ marginBottom: 6, fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
                                Batas waktu pembatalan: <span style={{ color: '#ef4444' }}>{timerText}</span>
                              </div>
                              <button onClick={() => handleBatalkan(antrianAktif.id)} style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 50, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                                <i className="fas fa-times"></i> Batalkan Antrian
                              </button>
                            </>
                          ) : isMenunggu ? (
                            <div style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 600 }}>
                              <i className="fas fa-lock" style={{ marginRight: 6 }}></i> Waktu pembatalan telah habis.
                            </div>
                          ) : null}
                        </div>
                      );
                    } catch (e) {
                      return (
                        <div style={{ textAlign: 'center', marginTop: 20 }}>
                          <button onClick={() => handleBatalkan(antrianAktif.id)} style={{ padding: '10px 20px', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'none', borderRadius: 50, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                            <i className="fas fa-times"></i> Batalkan Antrian
                          </button>
                        </div>
                      );
                    }
                  })()}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <div style={{ fontSize: '3rem', color: '#e2e8f0', marginBottom: 16 }}><i className="fas fa-ticket-alt"></i></div>
                  <h4 style={{ fontWeight: 800, color: '#0f172a', marginBottom: 8, fontSize: '1.1rem' }}>Belum Ada Antrian</h4>
                  <p style={{ color: '#64748b', marginBottom: 20, fontSize: '0.9rem' }}>Kamu belum memiliki antrian aktif hari ini.</p>
                  <button onClick={() => { setShowStatusModal(false); setShowAmbilModal(true); }} style={{ padding: '12px 28px', background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', border: 'none', borderRadius: 50, fontFamily: 'inherit', fontWeight: 800, cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 8px 16px -4px rgba(249,115,22,0.35)' }}>
                    <i className="fas fa-plus"></i> Ambil Antrian Sekarang
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: AMBIL ANTRIAN */}
      {showAmbilModal && (
        <div className="custom-overlay" onClick={e => e.target === e.currentTarget && setShowAmbilModal(false)}>
          <div className="custom-modal" style={{ maxWidth: '520px' }}>
            <div className="custom-modal-header">
              <h4><i className="fas fa-plus-circle" style={{ color: '#f97316' }}></i> Ambil Nomor Antrian Baru</h4>
              <button className="custom-modal-close" onClick={() => setShowAmbilModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="custom-modal-body">
              {msg.text && (
                <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`, color: msg.type === 'success' ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', fontWeight: 600 }}>
                  <i className={`fas ${msg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
                  <span style={{ flex: 1 }}>{msg.text}</span>
                  <button onClick={() => setMsg({ type: '', text: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><i className="fas fa-times"></i></button>
                </div>
              )}

              {antrianAktif ? (
                <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 16, padding: 20, textAlign: 'center', color: '#ea580c' }}>
                  <i className="fas fa-info-circle" style={{ fontSize: '1.8rem', marginBottom: 8 }}></i>
                  <h5 style={{ fontWeight: 800, marginBottom: 4, fontSize: '1rem' }}>Antrian Aktif Ditemukan!</h5>
                  <p style={{ fontSize: '0.9rem', marginBottom: 16 }}>Kamu masih punya antrian aktif: <strong>{antrianAktif.nomor_antrian}</strong></p>
                  <button onClick={() => { setShowAmbilModal(false); setShowStatusModal(true); }} style={{ padding: '8px 20px', background: '#ea580c', color: '#fff', border: 'none', borderRadius: 50, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem' }}>Lihat Status Antrian</button>
                </div>
              ) : (
                <form onSubmit={async (e) => {
                  const success = await handleAmbilAntrian(e);
                  if (success) {
                    setShowAmbilModal(false);
                    setShowStatusModal(true);
                  }
                }}>
                  {!isBengkelOpen && (
                    <div style={{ padding: '12px 16px', borderRadius: 12, marginBottom: 16, background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.4 }}>
                      <i className="fas fa-exclamation-triangle" style={{ marginTop: 2, fontSize: '1rem' }}></i>
                      <div>
                        <strong>Perhatian:</strong> Bengkel saat ini sedang Tutup / Libur ({statusTextBengkel}). Anda tetap dapat mengambil nomor antrian, namun pengerjaan akan dilakukan saat bengkel buka kembali.
                      </div>
                    </div>
                  )}
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Pilih Layanan (Bisa Lebih Dari Satu)</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, background: '#fff', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: 12, maxHeight: 180, overflowY: 'auto' }}>
                      {layanan.map(l => (
                        <label key={l.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', background: selectedLayanan.includes(l.id.toString()) ? '#fff7ed' : '#f8fafc', padding: 10, borderRadius: 8, border: `1px solid ${selectedLayanan.includes(l.id.toString()) ? '#fdba74' : '#e2e8f0'}`, transition: 'all 0.2s' }}>
                          <input 
                            type="checkbox" 
                            value={l.id} 
                            checked={selectedLayanan.includes(l.id.toString())}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedLayanan([...selectedLayanan, e.target.value]);
                              } else {
                                setSelectedLayanan(selectedLayanan.filter(id => id !== e.target.value));
                              }
                            }}
                            style={{ marginTop: 3, transform: 'scale(1.1)', accentColor: '#f97316' }}
                          />
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '0.9rem' }}>{l.nama_layanan}</div>
                              <div style={{ fontWeight: 800, color: '#f97316', fontSize: '0.9rem' }}>Rp {l.harga ? l.harga.toLocaleString('id-ID') : '0'}</div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 1 }}><i className="fas fa-clock"></i> ±{l.estimasi_menit} menit</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Merk & Tipe Kendaraan</label>
                    <input type="text" value={kendaraan} onChange={e => setKendaraan(e.target.value)} required placeholder="Contoh: Honda Vario 150 / Toyota Avanza" style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', background: '#fff' }} />
                  </div>
                  <div style={{ marginBottom: 24 }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>Catatan (Opsional)</label>
                    <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows="3" placeholder="Keluhan kendaraan..." style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.9rem', outline: 'none', resize: 'none' }}></textarea>
                  </div>
                  <button type="submit" disabled={isLoadingForm} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px -4px rgba(249,115,22,0.35)' }}>
                    {isLoadingForm ? 'Memproses...' : <><i className="fas fa-ticket-alt"></i> Ambil Nomor Antrian</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
