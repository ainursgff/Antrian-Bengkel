import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CONFIG from '../config';

const STATUS_MAP = {
  menunggu: { label: 'Menunggu', cls: 'badge-menunggu', icon: 'fa-clock' },
  dipanggil: { label: 'Dipanggil', cls: 'badge-dipanggil', icon: 'fa-bell' },
  sedang_dilayani: { label: 'Dilayani', cls: 'badge-sedang_dilayani', icon: 'fa-wrench' },
  selesai: { label: 'Selesai', cls: 'badge-selesai', icon: 'fa-check-circle' },
};

export default function MontirPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('antrian_token');
  const user = JSON.parse(localStorage.getItem('antrian_user') || '{}');
  const authH = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  const [antrian, setAntrian] = useState([]);
  const [layanan, setLayanan] = useState([]);
  const [filter, setFilter] = useState('semua'); // 'semua', 'dipanggil', 'sedang_dilayani', 'selesai'
  const [waktu, setWaktu] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (!token || localStorage.getItem('antrian_role') !== 'montir') {
      navigate('/login');
      return;
    }
    const link = document.createElement('link');
    link.href = '/stylesheets/admin.css'; 
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    fetchAll();

    if (sessionStorage.getItem('show_welcome_toast') === 'true') {
      setShowWelcome(true);
      sessionStorage.removeItem('show_welcome_toast');
      setTimeout(() => setShowWelcome(false), 3000);
    }

    const interval = setInterval(fetchAntrian, 10000);
    const clockIv = setInterval(() => setWaktu(new Date()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockIv);
      document.head.removeChild(link);
    };
  }, []);

  const fetchAll = async () => {
    setIsLoading(true);
    await Promise.all([fetchAntrian(), fetchLayanan()]);
    setIsLoading(false);
  };

  const fetchAntrian = async () => {
    try {
      const r = await fetch(`${CONFIG.API_BASE_URL}/antrian`, { headers: authH });
      const data = await r.json();
      const myAntrian = (Array.isArray(data) ? data : []).filter(a => a.montir_id === user.id);
      setAntrian(myAntrian);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLayanan = async () => {
    try {
      const r = await fetch(`${CONFIG.API_BASE_URL}/layanan`);
      const d = await r.json();
      setLayanan(Array.isArray(d) ? d : []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAksi = async (id, aksi) => {
    const actText = aksi === 'dilayani' ? 'Mulai kerjakan motor ini?' : 'Selesaikan servis motor ini?';
    if (!window.confirm(actText)) return;
    try {
      const r = await fetch(`${CONFIG.API_BASE_URL}/antrian/${id}/${aksi}`, {
        method: 'PUT',
        headers: authH
      });
      const d = await r.json();
      if (d.success) {
        fetchAntrian();
      } else {
        alert(d.error || 'Gagal merubah status');
      }
    } catch {
      alert('Koneksi terputus');
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const getLayananNames = (csvIds) => {
    if (!csvIds) return '-';
    return csvIds.split(',').map(id => {
      const lay = layanan.find(l => l.id === parseInt(id));
      return lay ? lay.nama_layanan : `Servis #${id}`;
    }).join(', ');
  };

  const totalSemua = antrian.length;
  const totalDipanggil = antrian.filter(a => a.status === 'dipanggil').length;
  const totalDilayani = antrian.filter(a => a.status === 'sedang_dilayani').length;
  const totalSelesai = antrian.filter(a => a.status === 'selesai').length;

  const itemsToRender = filter === 'semua' 
    ? antrian 
    : antrian.filter(a => a.status === filter);

  const getEmptyStateText = () => {
    switch (filter) {
      case 'dipanggil': return 'Tidak ada antrian yang menunggu untuk Anda layani.';
      case 'sedang_dilayani': return 'Tidak ada kendaraan yang sedang Anda servis saat ini.';
      case 'selesai': return 'Belum ada pekerjaan yang selesai hari ini.';
      default: return 'Tidak ada tugas yang terdaftar untuk Anda hari ini.';
    }
  };

  const getTableHeaderTitle = () => {
    switch (filter) {
      case 'dipanggil': return 'Pekerjaan Perlu Dilayani (Belum Mulai)';
      case 'sedang_dilayani': return 'Pekerjaan Sedang Dikerjakan';
      case 'selesai': return 'Daftar Motor Sukses Diperbaiki';
      default: return 'Semua Riwayat & Daftar Pekerjaan';
    }
  };

  return (
    <div className="panel-layout">
      <style>{`
        @keyframes slideDownFade {
          0% { transform: translate(-50%, -20px); opacity: 0; }
          100% { transform: translate(-50%, 0); opacity: 1; }
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
          animation: 'slideDownFade 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', width: '32px', height: '32px', borderRadius: '50%' }}>
            <i className="fas fa-check" style={{ fontSize: '1rem' }}></i>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9, fontWeight: 500 }}>Login Berhasil</div>
            <div>Selamat Datang, {user.nama || 'Mekanik'}! 👋</div>
          </div>
        </div>
      )}

      {/* SIDEBAR COHESIVE TO ADMIN */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <i className="fas fa-tools"></i>
          <div>
            <h4>Antrian<span>Ku</span></h4>
            <span className="role-badge" style={{ color: '#06b6d4' }}>Mekanik Panel</span>
          </div>
        </div>
        <div className="sidebar-nav">
          <div className="nav-label">Tugas Saya</div>
          <button className="nav-btn active" style={{ background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 8px 20px -5px rgba(6,182,212,0.35)' }}>
            <i className="fas fa-hammer"></i><span>Dashboard Tugas</span>
          </button>
        </div>
        <div className="sidebar-footer">
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 12 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{user.nama}</div>
            <div style={{ fontSize: '0.78rem', color: '#06b6d4', fontWeight: 800 }}>MEKANIK AKTIF</div>
          </div>
          <button className="btn-logout" onClick={logout}><i className="fas fa-sign-out-alt"></i> Keluar</button>
        </div>
      </nav>

      {/* MAIN AREA COHESIVE TO ADMIN */}
      <div className="main-area">
        <header className="topbar">
          <h5 className="topbar-title" style={{ borderLeftColor: '#06b6d4' }}>
            Panel Penanganan Servis Kendaraan
          </h5>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '8px 16px', borderRadius: 50, border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 800 }}>
            <i className="far fa-clock" style={{ color: '#06b6d4' }}></i>
            {waktu.toLocaleTimeString('id-ID')}
          </div>
        </header>

        <div className="content-area">
          <div className="fade-in">
            {/* 3 STAT CARDS + ALL STATS ACTING AS INTERACTIVE FILTERS */}
            <div className="stats-row" style={{ marginBottom: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 20 }}>
              
              {/* FILTER: SEMUA */}
              <div 
                className="stat-card" 
                onClick={() => setFilter('semua')}
                style={{ 
                  cursor: 'pointer',
                  border: filter === 'semua' ? '2.5px solid #06b6d4' : '1px solid var(--border)',
                  boxShadow: filter === 'semua' ? '0 12px 24px -6px rgba(6,182,212,0.25)' : 'none',
                  transform: filter === 'semua' ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="stat-icon blue" style={{ background: '#ecfeff', color: '#0891b2' }}><i className="fas fa-border-all"></i></div>
                <div className="stat-info">
                  <small>Semua Pekerjaan</small>
                  <h3>{totalSemua}</h3>
                </div>
              </div>

              {/* FILTER: BELUM MULAI (DIPANGGIL) */}
              <div 
                className="stat-card" 
                onClick={() => setFilter('dipanggil')}
                style={{ 
                  cursor: 'pointer',
                  border: filter === 'dipanggil' ? '2.5px solid #f97316' : '1px solid var(--border)',
                  boxShadow: filter === 'dipanggil' ? '0 12px 24px -6px rgba(249,115,22,0.25)' : 'none',
                  transform: filter === 'dipanggil' ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="stat-icon orange" style={{ background: '#fff7ed', color: '#f97316' }}><i className="fas fa-bell"></i></div>
                <div className="stat-info">
                  <small>Perlu Dilayani</small>
                  <h3>{totalDipanggil}</h3>
                </div>
              </div>

              {/* FILTER: SEDANG DIKERJAKAN */}
              <div 
                className="stat-card" 
                onClick={() => setFilter('sedang_dilayani')}
                style={{ 
                  cursor: 'pointer',
                  border: filter === 'sedang_dilayani' ? '2.5px solid #3b82f6' : '1px solid var(--border)',
                  boxShadow: filter === 'sedang_dilayani' ? '0 12px 24px -6px rgba(59,130,246,0.25)' : 'none',
                  transform: filter === 'sedang_dilayani' ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="stat-icon blue" style={{ background: '#eff6ff', color: '#2563eb' }}><i className="fas fa-tools"></i></div>
                <div className="stat-info">
                  <small>Sedang Dikerjakan</small>
                  <h3>{totalDilayani}</h3>
                </div>
              </div>

              {/* FILTER: SELESAI */}
              <div 
                className="stat-card" 
                onClick={() => setFilter('selesai')}
                style={{ 
                  cursor: 'pointer',
                  border: filter === 'selesai' ? '2.5px solid #10b981' : '1px solid var(--border)',
                  boxShadow: filter === 'selesai' ? '0 12px 24px -6px rgba(16,185,129,0.25)' : 'none',
                  transform: filter === 'selesai' ? 'translateY(-4px)' : 'none',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              >
                <div className="stat-icon green" style={{ background: '#f0fdf4', color: '#16a34a' }}><i className="fas fa-check-circle"></i></div>
                <div className="stat-info">
                  <small>Selesai Hari Ini</small>
                  <h3>{totalSelesai}</h3>
                </div>
              </div>

            </div>

            {/* TABLE CARD CONTAINER */}
            <div className="table-card">
              <div className="table-card-header">
                <h6 style={{ display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <i className="fas fa-list-ol" style={{ color: '#06b6d4' }}></i>
                  {getTableHeaderTitle()}
                </h6>
                <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 14px', borderRadius: 50, fontSize: '0.82rem', fontWeight: 700 }}>
                  Jumlah: {itemsToRender.length}
                </span>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-4">No. Antrian</th>
                      <th>Nama Pelanggan</th>
                      <th>Layanan / Kerusakan</th>
                      <th>Kendaraan (Tipe/Merk)</th>
                      <th>Waktu Giliran</th>
                      <th className="text-center">Status</th>
                      <th className="text-center px-4" style={{ width: 220 }}>Tindakan Mekanik</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr><td colSpan="7" className="text-center py-5"><div className="spinner-border text-info spinner-border-sm"></div></td></tr>
                    ) : itemsToRender.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          <div className="empty-state">
                            <i className={filter === 'semua' ? 'fas fa-folder-open' : filter === 'selesai' ? 'fas fa-check-double' : 'fas fa-tasks'}></i>
                            <p>{getEmptyStateText()}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      itemsToRender.map(a => {
                        const s = STATUS_MAP[a.status] || {};
                        return (
                          <tr key={a.id}>
                            <td className="px-4 fw-bold" style={{ color: '#0891b2', fontSize: '1.05rem' }}>{a.nomor_antrian}</td>
                            <td className="fw-semibold">{a.nama_pelanggan || 'Guest'}</td>
                            <td>{getLayananNames(a.layanan_id)}</td>
                            <td className="fw-bold text-dark">{a.kendaraan || '-'}</td>
                            <td className="text-muted fw-bold">{a.slot_waktu ? a.slot_waktu.substring(0, 5) + ' WIB' : '-'}</td>
                            <td className="text-center">
                              <span className={`badge-status ${s.cls}`}>
                                <i className={`fas ${s.icon}`}></i> {s.label}
                              </span>
                            </td>
                            <td className="text-center px-4">
                              <div className="action-group justify-content-center">
                                {a.status === 'dipanggil' && (
                                  <button 
                                    className="btn-submit-form" 
                                    style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'linear-gradient(135deg, #06b6d4, #0891b2)', boxShadow: '0 4px 10px rgba(6,182,212,0.2)' }}
                                    onClick={() => handleAksi(a.id, 'dilayani')}
                                  >
                                    <i className="fas fa-play"></i> Mulai Servis
                                  </button>
                                )}
                                {a.status === 'sedang_dilayani' && (
                                  <button 
                                    className="btn-submit-form" 
                                    style={{ padding: '8px 16px', fontSize: '0.85rem', background: 'linear-gradient(135deg, #10b981, #059669)', boxShadow: '0 4px 10px rgba(16,185,129,0.2)' }}
                                    onClick={() => handleAksi(a.id, 'selesai')}
                                  >
                                    <i className="fas fa-check-circle"></i> Selesai
                                  </button>
                                )}
                                {a.status === 'selesai' && (
                                  <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 800 }}>
                                    <i className="fas fa-check-double"></i> Servis Selesai
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
