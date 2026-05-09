import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CONFIG from '../config';

const STATUS_MAP = {
  menunggu: { label: 'Menunggu', color: '#d97706', bg: '#fffbeb', icon: 'fa-clock' },
  dipanggil: { label: 'Dipanggil!', color: '#2563eb', bg: '#eff6ff', icon: 'fa-bell' },
  sedang_dilayani: { label: 'Sedang Dilayani', color: '#ea580c', bg: '#fff7ed', icon: 'fa-car-crash' },
  selesai: { label: 'Selesai', color: '#16a34a', bg: '#f0fdf4', icon: 'fa-check-circle' },
  dibatalkan: { label: 'Dibatalkan', color: '#dc2626', bg: '#fef2f2', icon: 'fa-times-circle' },
};

export default function CustomerPage() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('antrian_user') || '{}');
  const token = localStorage.getItem('antrian_token');

  const [activeTab, setActiveTab] = useState('status');
  const [layanan, setLayanan] = useState([]);
  const [antrianAktif, setAntrianAktif] = useState(null);
  const [riwayat, setRiwayat] = useState([]);
  const [notifikasi, setNotifikasi] = useState([]);
  const [selectedLayanan, setSelectedLayanan] = useState('');
  const [catatan, setCatatan] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const authHeader = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };

  useEffect(() => {
    if (!token || localStorage.getItem('antrian_role') !== 'pelanggan') {
      navigate('/login');
      return;
    }
    // Inject CSS
    const link = document.createElement('link');
    link.href = '/stylesheets/admin.css';
    link.rel = 'stylesheet';
    document.head.appendChild(link);

    fetchAll();
    const interval = setInterval(fetchAntrianAktif, 8000);
    return () => {
      clearInterval(interval);
      document.head.removeChild(link);
    };
    // eslint-disable-next-line
  }, []);

  const fetchAll = () => {
    fetchLayanan();
    fetchAntrianAktif();
    fetchRiwayat();
    fetchNotifikasi();
  };

  const fetchLayanan = async () => {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/layanan`);
      const data = await res.json();
      setLayanan(data.filter(l => l.is_aktif));
    } catch {}
  };

  const fetchAntrianAktif = async () => {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/antrian/aktif`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setAntrianAktif(data);
    } catch {}
  };

  const fetchRiwayat = async () => {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/antrian`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setRiwayat(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchNotifikasi = async () => {
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/notifikasi`, { headers: { 'Authorization': `Bearer ${token}` } });
      const data = await res.json();
      setNotifikasi(Array.isArray(data) ? data : []);
    } catch {}
  };

  const handleAmbilAntrian = async (e) => {
    e.preventDefault();
    if (!selectedLayanan) { setMsg({ type: 'error', text: 'Pilih layanan terlebih dahulu' }); return; }
    setIsLoading(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/antrian`, {
        method: 'POST',
        headers: authHeader,
        body: JSON.stringify({ layanan_id: parseInt(selectedLayanan), catatan })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMsg({ type: 'success', text: `Nomor antrian ${data.antrian.nomor_antrian} berhasil diambil!` });
        setSelectedLayanan('');
        setCatatan('');
        fetchAll();
        setActiveTab('status');
      } else {
        setMsg({ type: 'error', text: data.error || 'Gagal mengambil antrian' });
      }
    } catch {
      setMsg({ type: 'error', text: 'Gagal menghubungi server' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatalkan = async (id) => {
    if (!window.confirm('Yakin ingin membatalkan antrian ini?')) return;
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/antrian/${id}/batalkan`, { method: 'PUT', headers: authHeader });
      const data = await res.json();
      if (res.ok) {
        setMsg({ type: 'success', text: 'Antrian berhasil dibatalkan' });
        fetchAll();
      } else {
        alert(data.error);
      }
    } catch { alert('Gagal membatalkan antrian'); }
  };

  const handleLogout = async () => {
    await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
    localStorage.clear();
    navigate('/login');
  };

  const unreadCount = notifikasi.filter(n => !n.is_read).length;

  const TABS = [
    { id: 'ambil', label: 'Ambil Antrian', icon: 'fa-ticket-alt' },
    { id: 'status', label: 'Status Antrian', icon: 'fa-list-check' },
    { id: 'riwayat', label: 'Riwayat', icon: 'fa-history' },
    { id: 'notifikasi', label: 'Notifikasi', icon: 'fa-bell', badge: unreadCount },
  ];

  const TAB_TITLES = {
    ambil: 'Ambil Antrian',
    status: 'Status Antrian Saya',
    riwayat: 'Riwayat Antrian',
    notifikasi: 'Notifikasi',
  };

  return (
    <div className="panel-layout">
      {/* SIDEBAR */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <i className="fas fa-car-side"></i>
          <div>
            <h4>Antrian<span>Ku</span></h4>
            <span className="role-badge">Pelanggan</span>
          </div>
        </div>
        <div className="sidebar-nav">
          <div className="nav-label">Menu</div>
          {TABS.map(t => (
            <button key={t.id} className={`nav-btn ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
              <i className={`fas ${t.icon}`}></i>
              <span>{t.label}</span>
              {t.badge > 0 && <span style={{ marginLeft: 'auto', background: '#f97316', color: '#fff', borderRadius: 50, width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 800 }}>{t.badge}</span>}
            </button>
          ))}
        </div>
        <div className="sidebar-footer">
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 12 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{user.nama}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{user.email}</div>
          </div>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94a3b8', fontSize: '0.88rem', fontWeight: 600, marginBottom: 10, padding: '8px 4px' }}>
            <i className="fas fa-globe"></i> Portal Publik
          </Link>
          <button className="btn-logout" onClick={handleLogout}>
            <i className="fas fa-sign-out-alt"></i> Keluar
          </button>
        </div>
      </nav>

      {/* MAIN */}
      <div className="main-area">
        <header className="topbar">
          <h5 className="topbar-title">{TAB_TITLES[activeTab]}</h5>
          <div className="topbar-user">
            <div className="user-info">
              <div className="user-name">{user.nama}</div>
              <div className="user-role">Pelanggan</div>
            </div>
            <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.nama || 'U')}&background=f97316&color=fff&bold=true`} className="avatar" alt="Avatar" />
          </div>
        </header>

        <div className="content-area">
          {msg.text && (
            <div style={{ padding: '14px 18px', borderRadius: 12, marginBottom: 20, background: msg.type === 'success' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${msg.type === 'success' ? '#bbf7d0' : '#fecaca'}`, color: msg.type === 'success' ? '#16a34a' : '#dc2626', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.9rem', fontWeight: 600 }}>
              <i className={`fas ${msg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              {msg.text}
              <button onClick={() => setMsg({ type: '', text: '' })} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><i className="fas fa-times"></i></button>
            </div>
          )}

          {/* ===== TAB: AMBIL ANTRIAN ===== */}
          {activeTab === 'ambil' && (
            <div className="fade-in">
              <div style={{ maxWidth: 500 }}>
                <div className="table-card" style={{ padding: 32 }}>
                  <h6 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <i className="fas fa-ticket-alt" style={{ color: '#f97316' }}></i> Form Ambil Antrian
                  </h6>
                  {antrianAktif ? (
                    <div style={{ background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 12, padding: 16, fontSize: '0.9rem', color: '#ea580c', fontWeight: 600 }}>
                      <i className="fas fa-info-circle"></i> Kamu masih punya antrian aktif: <strong>{antrianAktif.nomor_antrian}</strong>. Selesaikan atau batalkan terlebih dahulu.
                    </div>
                  ) : (
                    <form onSubmit={handleAmbilAntrian}>
                      <div className="form-group-custom">
                        <label>Pilih Layanan</label>
                        <select value={selectedLayanan} onChange={e => setSelectedLayanan(e.target.value)} className="form-control-custom" required>
                          <option value="">-- Pilih Layanan --</option>
                          {layanan.map(l => (
                            <option key={l.id} value={l.id}>{l.nama_layanan} (±{l.estimasi_menit} mnt)</option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group-custom">
                        <label>Catatan (Opsional)</label>
                        <textarea value={catatan} onChange={e => setCatatan(e.target.value)} className="form-control-custom" rows="3" placeholder="Keluhan atau keterangan tambahan..." style={{ resize: 'none' }}></textarea>
                      </div>
                      <button type="submit" disabled={isLoading} className="btn-submit-form" style={{ marginTop: 8 }}>
                        {isLoading ? 'Memproses...' : <><i className="fas fa-ticket-alt"></i> Ambil Nomor Antrian</>}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== TAB: STATUS ANTRIAN ===== */}
          {activeTab === 'status' && (
            <div className="fade-in">
              {antrianAktif ? (
                <>
                  <div className="antrian-ticket">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 20 }}>
                      <div>
                        <div className="ticket-label">Nomor Antrian Kamu</div>
                        <div className="ticket-number">{antrianAktif.nomor_antrian}</div>
                        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div><span className="ticket-label">Layanan: </span><span className="ticket-value">{antrianAktif.nama_layanan}</span></div>
                          <div><span className="ticket-label">Tanggal: </span><span className="ticket-value">{antrianAktif.tanggal}</span></div>
                          <div><span className="ticket-label">Estimasi: </span><span className="ticket-value">{antrianAktif.slot_waktu ? antrianAktif.slot_waktu.substring(0,5) + ' WIB' : '-'}</span></div>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {(() => {
                          const s = STATUS_MAP[antrianAktif.status] || STATUS_MAP.menunggu;
                          return (
                            <div style={{ background: s.bg, color: s.color, padding: '12px 24px', borderRadius: 50, fontWeight: 800, fontSize: '0.95rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                              <i className={`fas ${s.icon}`}></i> {s.label}
                            </div>
                          );
                        })()}
                        {antrianAktif.posisi_antrian !== undefined && antrianAktif.status === 'menunggu' && (
                          <div style={{ marginTop: 12, color: '#94a3b8', fontSize: '0.9rem' }}>
                            <i className="fas fa-users"></i> {antrianAktif.posisi_antrian} antrian di depanmu
                          </div>
                        )}
                        {['menunggu', 'dipanggil'].includes(antrianAktif.status) && (
                          <button onClick={() => handleBatalkan(antrianAktif.id)} style={{ marginTop: 16, padding: '8px 20px', background: 'rgba(239,68,68,0.15)', color: '#f87171', border: 'none', borderRadius: 50, fontFamily: 'inherit', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'block' }}>
                            <i className="fas fa-times"></i> Batalkan Antrian
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  {antrianAktif.status === 'dipanggil' && (
                    <div style={{ background: '#eff6ff', border: '2px solid #bfdbfe', borderRadius: 16, padding: 24, textAlign: 'center', marginBottom: 20 }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔔</div>
                      <h5 style={{ color: '#1d4ed8', fontWeight: 800, marginBottom: 8 }}>Kamu Dipanggil!</h5>
                      <p style={{ color: '#3b82f6', fontSize: '0.95rem' }}>Segera menuju loket pelayanan bengkel. Jangan sampai terlewat!</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <i className="fas fa-ticket-alt"></i>
                  <p style={{ marginBottom: 16 }}>Kamu belum punya antrian aktif hari ini</p>
                  <button onClick={() => setActiveTab('ambil')} style={{ padding: '12px 32px', background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', border: 'none', borderRadius: 50, fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' }}>
                    <i className="fas fa-ticket-alt"></i> Ambil Antrian Sekarang
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ===== TAB: RIWAYAT ===== */}
          {activeTab === 'riwayat' && (
            <div className="fade-in">
              <div className="table-card">
                <div className="table-card-header">
                  <h6>Riwayat Antrian Kamu</h6>
                  <span style={{ background: '#f1f5f9', color: '#64748b', padding: '4px 14px', borderRadius: 50, fontSize: '0.82rem', fontWeight: 700 }}>Total: {riwayat.length}</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="px-4 py-3">No. Antrian</th>
                        <th>Layanan</th>
                        <th>Tanggal</th>
                        <th>Estimasi</th>
                        <th className="text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {riwayat.length === 0 ? (
                        <tr><td colSpan="5" className="text-center py-5 text-muted">Belum ada riwayat antrian</td></tr>
                      ) : riwayat.map(a => {
                        const s = STATUS_MAP[a.status] || {};
                        return (
                          <tr key={a.id}>
                            <td className="px-4 py-3 fw-bold" style={{ color: '#f97316' }}>{a.nomor_antrian}</td>
                            <td className="fw-semibold">{a.nama_layanan}</td>
                            <td className="text-muted">{a.tanggal}</td>
                            <td className="text-muted">{a.slot_waktu ? a.slot_waktu.substring(0,5) : '-'}</td>
                            <td className="text-center">
                              <span className={`badge-status badge-${a.status}`}>
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
            </div>
          )}

          {/* ===== TAB: NOTIFIKASI ===== */}
          {activeTab === 'notifikasi' && (
            <div className="fade-in">
              <div className="table-card">
                <div className="table-card-header">
                  <h6><i className="fas fa-bell" style={{ color: '#f97316' }}></i> Notifikasi</h6>
                  {unreadCount > 0 && (
                    <button onClick={async () => {
                      await fetch(`${CONFIG.API_BASE_URL}/notifikasi/read-all`, { method: 'PUT', headers: { 'Authorization': `Bearer ${token}` } });
                      fetchNotifikasi();
                    }} style={{ fontSize: '0.82rem', color: '#f97316', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>
                      Tandai Semua Dibaca
                    </button>
                  )}
                </div>
                {notifikasi.length === 0 ? (
                  <div className="empty-state">
                    <i className="fas fa-bell-slash"></i>
                    <p>Belum ada notifikasi</p>
                  </div>
                ) : notifikasi.map(n => (
                  <div key={n.id} className={`notif-item ${!n.is_read ? 'unread' : ''}`}>
                    {!n.is_read && <div className="notif-dot"></div>}
                    <div style={{ flex: 1 }}>
                      <p>{n.pesan}</p>
                      <small>{new Date(n.sent_at).toLocaleString('id-ID')}</small>
                    </div>
                    <span style={{ fontSize: '0.75rem', background: '#f1f5f9', color: '#64748b', padding: '3px 10px', borderRadius: 50, fontWeight: 700, flexShrink: 0 }}>{n.tipe}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
