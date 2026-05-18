import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CONFIG from '../config';

const STATUS_MAP = {
  menunggu: { label: 'Menunggu', cls: 'badge-menunggu', icon: 'fa-clock' },
  dipanggil: { label: 'Dipanggil', cls: 'badge-dipanggil', icon: 'fa-bell' },
  sedang_dilayani: { label: 'Dilayani', cls: 'badge-sedang_dilayani', icon: 'fa-car-crash' },
  selesai: { label: 'Selesai', cls: 'badge-selesai', icon: 'fa-check-circle' },
  dibatalkan: { label: 'Dibatalkan', cls: 'badge-dibatalkan', icon: 'fa-times-circle' },
};

const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

export default function AdminPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('antrian_token');
  const authH = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const user = JSON.parse(localStorage.getItem('antrian_user') || '{}');

  const [tab, setTab] = useState('dashboard');
  const [waktu, setWaktu] = useState(new Date());
  const [antrian, setAntrian] = useState([]);
  const [layanan, setLayanan] = useState([]);
  const [jadwal, setJadwal] = useState([]);
  const [laporan, setLaporan] = useState(null);
  const [pengguna, setPengguna] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  // States untuk interaktivitas Data Table (Search & Filter)
  const [searchAntrian, setSearchAntrian] = useState('');
  const [filterStatusAntrian, setFilterStatusAntrian] = useState('all');
  const [searchLayanan, setSearchLayanan] = useState('');
  const [filterStatusLayanan, setFilterStatusLayanan] = useState('all');

  // States untuk Pagination (Limit & Halaman)
  const [currentPageAntrian, setCurrentPageAntrian] = useState(1);
  const [limitAntrian, setLimitAntrian] = useState(10);
  const [currentPageLayanan, setCurrentPageLayanan] = useState(1);
  const [limitLayanan, setLimitLayanan] = useState(10);
  const [searchPengguna, setSearchPengguna] = useState('');
  const [filterRolePengguna, setFilterRolePengguna] = useState('all');
  const [currentPagePengguna, setCurrentPagePengguna] = useState(1);
  const [limitPengguna, setLimitPengguna] = useState(10);

  const [showLayananModal, setShowLayananModal] = useState(false);
  const [kategoriList, setKategoriList] = useState([]);
  const [layananForm, setLayananForm] = useState({ id: null, kategori_id: '', nama_layanan: '', deskripsi: '', estimasi_menit: 30, harga: 0, is_aktif: 1 });

  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [kategoriForm, setKategoriForm] = useState({ id: null, nama_kategori: '', deskripsi: '', icon: 'directions_car' });

  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [jadwalForm, setJadwalForm] = useState({ id: null, hari: 1, jam_buka: '08:00', jam_tutup: '17:00', kuota_per_slot: 5, is_libur: 0 });

  const [showPenggunaModal, setShowPenggunaModal] = useState(false);
  const [penggunaForm, setPenggunaForm] = useState({ nama: '', email: '', password: '', no_hp: '', role: 'pelanggan' });

  useEffect(() => {
    if (!token || localStorage.getItem('antrian_role') !== 'admin') { navigate('/login'); return; }
    const link = document.createElement('link');
    link.href = '/stylesheets/admin.css'; link.rel = 'stylesheet';
    document.head.appendChild(link);
    fetchAll();
    
    if (sessionStorage.getItem('show_welcome_toast') === 'true') {
      setShowWelcome(true);
      sessionStorage.removeItem('show_welcome_toast');
      setTimeout(() => setShowWelcome(false), 3000);
    }

    const iv = setInterval(fetchAntrian, 10000);
    const clockIv = setInterval(() => setWaktu(new Date()), 1000);
    return () => { clearInterval(iv); clearInterval(clockIv); document.head.removeChild(link); };
  }, []);

  const fetchAll = () => { fetchAntrian(); fetchLayanan(); fetchJadwal(); fetchLaporan(); fetchPengguna(); fetchKategori(); };
  const fetchKategori = async () => {
    try {
      const r = await fetch(`${CONFIG.API_BASE_URL}/kategori-kendaraan`);
      const d = await r.json();
      setKategoriList(Array.isArray(d) ? d : []);
    } catch {}
  };
  const fetchPengguna = async () => {
    try {
      const r = await fetch(`${CONFIG.API_BASE_URL}/auth/users`, { headers: authH });
      const d = await r.json();
      if (d.success) setPengguna(d.data);
    } catch {}
  };

  const updateUserRole = async (userId, newRole) => {
    if (!window.confirm('Ubah role pengguna ini?')) return;
    try {
      const r = await fetch(`${CONFIG.API_BASE_URL}/auth/users/${userId}/role`, {
        method: 'PUT',
        headers: authH,
        body: JSON.stringify({ role: newRole })
      });
      const d = await r.json();
      if (d.success) {
        alert('Role berhasil diperbarui!');
        fetchPengguna();
      } else {
        alert(d.error || 'Gagal memperbarui role');
      }
    } catch {
      alert('Koneksi bermasalah');
    }
  };

  const savePengguna = async (e) => {
    e.preventDefault();
    const isEdit = penggunaForm.id ? true : false;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${CONFIG.API_BASE_URL}/auth/users/${penggunaForm.id}` : `${CONFIG.API_BASE_URL}/auth/users`;
    try {
      const r = await fetch(url, {
        method,
        headers: authH,
        body: JSON.stringify(penggunaForm)
      });
      const d = await r.json();
      if (d.success) {
        alert(isEdit ? 'Data akun berhasil diperbarui!' : 'Akun baru berhasil ditambahkan!');
        setShowPenggunaModal(false);
        fetchPengguna();
      } else {
        alert(d.error || 'Gagal menyimpan data akun');
      }
    } catch {
      alert('Koneksi terputus');
    }
  };

  const deletePengguna = async (id) => {
    if (id === user.id) {
      alert('Anda tidak bisa menghapus akun Anda sendiri yang sedang login!');
      return;
    }
    if (!window.confirm('Apakah Anda yakin ingin menghapus akun pengguna ini secara permanen?\nSemua data antrian yang bersangkutan juga akan ikut dihapus.')) return;
    try {
      const r = await fetch(`${CONFIG.API_BASE_URL}/auth/users/${id}`, {
        method: 'DELETE',
        headers: authH
      });
      const d = await r.json();
      if (d.success) {
        alert('Akun pengguna berhasil dihapus secara permanen!');
        fetchPengguna();
      } else {
        alert(d.error || 'Gagal menghapus akun pengguna');
      }
    } catch {
      alert('Koneksi terputus');
    }
  };
  const fetchAntrian = async () => {
    try {
      const r = await fetch(`${CONFIG.API_BASE_URL}/antrian`, { headers: authH });
      if (r.status === 401 || r.status === 403) return logout();
      const data = await r.json();
      setAntrian(Array.isArray(data) ? data : []);
      fetchPengguna(); // Sinkronisasikan ketersediaan real-time montir secara otomatis!
    } catch {} finally { setIsLoading(false); }
  };
  const fetchLayanan = async () => {
    try { const r = await fetch(`${CONFIG.API_BASE_URL}/layanan`); const d = await r.json(); setLayanan(Array.isArray(d) ? d : []); } catch {}
  };
  const fetchJadwal = async () => {
    try { const r = await fetch(`${CONFIG.API_BASE_URL}/jadwal`); const d = await r.json(); setJadwal(Array.isArray(d) ? d : []); } catch {}
  };
  const fetchLaporan = async () => {
    try { const r = await fetch(`${CONFIG.API_BASE_URL}/laporan`, { headers: authH }); setLaporan(await r.json()); } catch {}
  };

  const aksiAntrian = async (id, aksi) => {
    if (!window.confirm(`${aksi} antrian ini?`)) return;
    await fetch(`${CONFIG.API_BASE_URL}/antrian/${id}/${aksi}`, { method: 'PUT', headers: authH });
    fetchAntrian();
  };

  const aksiAntrianPanggil = async (id, montirId) => {
    if (!montirId) {
      alert('Silakan pilih Montir terlebih dahulu sebelum memanggil antrian!');
      return;
    }
    const selectedMontir = pengguna.find(p => p.id === parseInt(montirId));
    if (selectedMontir && selectedMontir.is_busy > 0) {
      if (!window.confirm(`⚠️ PERINGATAN: Montir ${selectedMontir.nama} saat ini sedang sibuk melayani antrian ${selectedMontir.active_antrian_nomor} (${selectedMontir.active_kendaraan})!\n\nApakah Anda yakin tetap ingin menugaskan montir ini?`)) {
        return;
      }
    }
    if (!window.confirm('Panggil antrian dan tugaskan ke montir ini?')) return;
    try {
      const r = await fetch(`${CONFIG.API_BASE_URL}/antrian/${id}/panggil`, {
        method: 'PUT',
        headers: authH,
        body: JSON.stringify({ montir_id: montirId })
      });
      const d = await r.json();
      if (d.success) {
        fetchAntrian();
      } else {
        alert(d.error || 'Gagal memanggil antrian');
      }
    } catch {
      alert('Koneksi bermasalah');
    }
  };

  const saveLayanan = async (e) => {
    e.preventDefault();
    const method = layananForm.id ? 'PUT' : 'POST';
    const url = layananForm.id ? `${CONFIG.API_BASE_URL}/layanan/${layananForm.id}` : `${CONFIG.API_BASE_URL}/layanan`;
    await fetch(url, { method, headers: authH, body: JSON.stringify(layananForm) });
    setShowLayananModal(false); fetchLayanan();
  };

  const deleteLayanan = async (id) => {
    if (!window.confirm('Hapus layanan ini?')) return;
    await fetch(`${CONFIG.API_BASE_URL}/layanan/${id}`, { method: 'DELETE', headers: authH });
    fetchLayanan();
  };

  const saveKategori = async (e) => {
    e.preventDefault();
    const method = kategoriForm.id ? 'PUT' : 'POST';
    const url = kategoriForm.id ? `${CONFIG.API_BASE_URL}/kategori-kendaraan/${kategoriForm.id}` : `${CONFIG.API_BASE_URL}/kategori-kendaraan`;
    try {
      const res = await fetch(url, {
        method,
        headers: authH,
        body: JSON.stringify(kategoriForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(kategoriForm.id ? 'Kategori berhasil diperbarui!' : 'Kategori berhasil ditambahkan!');
        setShowKategoriModal(false);
        fetchKategori();
        fetchLayanan();
      } else {
        alert(data.error || 'Gagal menyimpan kategori');
      }
    } catch {
      alert('Gagal menghubungi server');
    }
  };

  const deleteKategori = async (id) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kategori kendaraan ini?\nJika masih ada layanan yang terhubung, penghapusan akan ditolak demi keamanan.')) return;
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/kategori-kendaraan/${id}`, {
        method: 'DELETE',
        headers: authH
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Kategori berhasil dihapus!');
        fetchKategori();
        fetchLayanan();
      } else {
        alert(data.error || 'Gagal menghapus kategori');
      }
    } catch {
      alert('Gagal menghubungi server');
    }
  };

  const saveJadwal = async (e) => {
    e.preventDefault();
    const method = jadwalForm.id ? 'PUT' : 'POST';
    const url = jadwalForm.id ? `${CONFIG.API_BASE_URL}/jadwal/${jadwalForm.id}` : `${CONFIG.API_BASE_URL}/jadwal`;
    await fetch(url, { method, headers: authH, body: JSON.stringify(jadwalForm) });
    setShowJadwalModal(false); fetchJadwal();
  };

  const deleteJadwal = async (id) => {
    if (!window.confirm('Hapus jadwal ini?')) return;
    await fetch(`${CONFIG.API_BASE_URL}/jadwal/${id}`, { method: 'DELETE', headers: authH });
    fetchJadwal();
  };

  const logout = async () => {
    await fetch(`${CONFIG.API_BASE_URL}/auth/logout`, { method: 'POST', headers: authH });
    localStorage.clear(); navigate('/login');
  };

  const stats = {
    total: antrian.length,
    menunggu: antrian.filter(a => a.status === 'menunggu').length,
    dipanggil: antrian.filter(a => a.status === 'dipanggil').length,
    dilayani: antrian.filter(a => a.status === 'sedang_dilayani').length,
    selesai: antrian.filter(a => a.status === 'selesai').length,
  };

  const TABS = [
    { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-line' },
    { id: 'antrian', label: 'Kelola Antrian', icon: 'fa-list-ol' },
    { id: 'kategori', label: 'Kategori Kendaraan', icon: 'fa-car' },
    { id: 'layanan', label: 'Kelola Layanan', icon: 'fa-wrench' },
    { id: 'jadwal', label: 'Jadwal Operasional', icon: 'fa-calendar-alt' },
    { id: 'laporan', label: 'Laporan', icon: 'fa-chart-bar' },
    { id: 'pengguna', label: 'Kelola Pengguna', icon: 'fa-users' },
  ];

  const TAB_LABELS = { dashboard:'Dashboard', antrian:'Kelola Antrian', kategori:'Kategori Kendaraan', layanan:'Kelola Layanan', jadwal:'Jadwal Operasional', laporan:'Laporan Antrian', pengguna:'Kelola Pengguna' };

  return (
    <div className="panel-layout">
      <style>{`
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
            <div>Selamat Datang, {user.nama || 'Admin'}! 👋</div>
          </div>
        </div>
      )}

      {/* SIDEBAR */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <i className="fas fa-car-side"></i>
          <div><h4>Antrian<span>Ku</span></h4><span className="role-badge">Admin Panel</span></div>
        </div>
        <div className="sidebar-nav">
          <div className="nav-label">Navigasi</div>
          {TABS.map(t => (
            <button key={t.id} className={`nav-btn ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
              <i className={`fas ${t.icon}`}></i><span>{t.label}</span>
            </button>
          ))}
          <hr style={{ borderColor: 'rgba(255,255,255,0.06)', margin: '16px 0' }} />
          <Link to="/" className="nav-btn"><i className="fas fa-globe"></i><span>Portal Publik</span></Link>
        </div>
        <div className="sidebar-footer">
          <div style={{ padding: '12px 16px', background: 'rgba(255,255,255,0.05)', borderRadius: 12, marginBottom: 12 }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#fff' }}>{user.nama || 'Administrator'}</div>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{user.email || 'admin@bengkel.com'}</div>
          </div>
          <button className="btn-logout" onClick={logout}><i className="fas fa-sign-out-alt"></i> Keluar</button>
        </div>
      </nav>

      {/* MAIN */}
      <div className="main-area">
        <header className="topbar">
          <h5 className="topbar-title">{TAB_LABELS[tab]}</h5>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '8px 16px', borderRadius: 50, border: '1px solid #e2e8f0', color: '#0f172a', fontWeight: 800 }}>
            <i className="far fa-clock" style={{ color: '#f97316' }}></i>
            {waktu.toLocaleTimeString('id-ID')}
          </div>
        </header>

        <div className="content-area">

          {/* ===== DASHBOARD ===== */}
          {tab === 'dashboard' && (
            <div className="fade-in">
              <div className="stats-row">
                {[
                  { label:'Total Antrian', val: stats.total, icon:'fa-list-ol', cls:'orange' },
                  { label:'Menunggu', val: stats.menunggu, icon:'fa-clock', cls:'yellow' },
                  { label:'Dipanggil', val: stats.dipanggil, icon:'fa-bell', cls:'blue' },
                  { label:'Sedang Dilayani', val: stats.dilayani, icon:'fa-car-crash', cls:'red' },
                  { label:'Selesai', val: stats.selesai, icon:'fa-check-circle', cls:'green' },
                ].map((s,i) => (
                  <div className="stat-card" key={i}>
                    <div className={`stat-icon ${s.cls}`}><i className={`fas ${s.icon}`}></i></div>
                    <div className="stat-info"><small>{s.label}</small><h3>{s.val}</h3></div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                <div className="table-card" style={{ margin: 0 }}>
                  <div className="table-card-header"><h6><i className="fas fa-clock" style={{color:'#f97316'}}></i> &nbsp;5 Antrian Terbaru Hari Ini</h6></div>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light"><tr><th className="px-4">No. Antrian</th><th>Nama</th><th>Layanan</th><th>Estimasi Jam</th><th className="text-center">Status</th></tr></thead>
                      <tbody>
                        {isLoading ? <tr><td colSpan="5" className="text-center py-5"><div className="spinner-border text-warning spinner-border-sm"></div></td></tr>
                          : antrian.slice().reverse().slice(0,5).map(a => {
                            const s = STATUS_MAP[a.status] || {};
                            return (
                              <tr key={a.id}>
                                <td className="px-4 fw-bold" style={{color:'#f97316'}}>{a.nomor_antrian}</td>
                                <td className="fw-semibold">{a.nama_pelanggan}</td>
                                <td>{a.nama_layanan}</td>
                                <td className="text-muted">{a.slot_waktu ? a.slot_waktu.substring(0,5) + ' WIB' : '-'}</td>
                                <td className="text-center"><span className={`badge-status ${s.cls}`}><i className={`fas ${s.icon}`}></i> {s.label}</span></td>
                              </tr>
                            );
                          })}
                        {!isLoading && antrian.length === 0 && <tr><td colSpan="5" className="text-center py-5 text-muted">Belum ada antrian hari ini</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="table-card" style={{ margin: 0, padding: 24, display: 'flex', flexDirection: 'column' }}>
                  <div className="table-card-header" style={{ padding: '0 0 16px 0', borderBottom: '1px solid #f1f5f9', marginBottom: 16 }}>
                    <h6 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}><i className="fas fa-tools" style={{ color: '#f97316' }}></i> Status Ketersediaan Mekanik</h6>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, maxHeight: '350px' }}>
                    {pengguna.filter(p => p.role === 'montir').length === 0 ? (
                      <div className="text-center text-muted py-5" style={{ fontSize: '0.85rem' }}>Belum ada akun montir yang terdaftar</div>
                    ) : (
                      pengguna.filter(p => p.role === 'montir').map(m => {
                        const isBusy = m.is_busy > 0;
                        return (
                          <div key={m.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderRadius: 16, background: isBusy ? '#fff7ed' : '#f0fdf4', border: `1.5px solid ${isBusy ? '#fed7aa' : '#bbf7d0'}`, transition: 'all 0.2s' }}>
                            <div>
                              <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.95rem' }}>{m.nama}</div>
                              {isBusy ? (
                                <div style={{ fontSize: '0.8rem', color: '#ea580c', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <i className="fas fa-spinner fa-spin"></i> Sibuk: {m.active_antrian_nomor} ({m.active_kendaraan})
                                </div>
                              ) : (
                                <div style={{ fontSize: '0.8rem', color: '#16a34a', marginTop: 4, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <i className="fas fa-check-circle"></i> Siap Melayani Antrian Baru
                                </div>
                              )}
                            </div>
                            <span style={{ fontSize: '0.75rem', fontWeight: 900, padding: '4px 12px', borderRadius: 50, background: isBusy ? '#ffedd5' : '#dcfce7', color: isBusy ? '#ea580c' : '#15803d' }}>
                              {isBusy ? 'SIBUK' : 'FREE'}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===== KELOLA ANTRIAN ===== */}
          {tab === 'antrian' && (() => {
            const filteredAntrian = antrian.filter(a => {
              if (filterStatusAntrian !== 'all' && a.status !== filterStatusAntrian) return false;
              if (searchAntrian.trim() !== '') {
                const q = searchAntrian.toLowerCase();
                const nama = (a.nama_pelanggan || '').toLowerCase();
                const nomor = (a.nomor_antrian || '').toLowerCase();
                const kendaraan = (a.kendaraan || '').toLowerCase();
                const layananName = (a.nama_layanan || '').toLowerCase();
                const catatan = (a.catatan || '').toLowerCase();
                const montirName = (a.nama_montir || '').toLowerCase();
                return nama.includes(q) || nomor.includes(q) || kendaraan.includes(q) || layananName.includes(q) || catatan.includes(q) || montirName.includes(q);
              }
              return true;
            });

            // Kalkulasi Pagination
            const totalEntriesAntrian = filteredAntrian.length;
            const totalPagesAntrian = Math.ceil(totalEntriesAntrian / limitAntrian) || 1;
            
            // Jaga-jaga jika currentPage melebihi totalPages akibat filtering/searching
            const activePage = currentPageAntrian > totalPagesAntrian ? 1 : currentPageAntrian;
            if (currentPageAntrian > totalPagesAntrian) {
              setCurrentPageAntrian(1);
            }

            const startIndexAntrian = (activePage - 1) * limitAntrian;
            const paginatedAntrian = filteredAntrian.slice(startIndexAntrian, startIndexAntrian + limitAntrian);

            return (
              <div className="fade-in">
                <div className="table-card">
                  <div className="table-card-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <h6>Daftar Antrian Hari Ini</h6>
                      <span style={{background:'#f1f5f9',color:'#64748b',padding:'4px 14px',borderRadius:50,fontSize:'0.82rem',fontWeight:700}}>Total: {filteredAntrian.length}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Limit Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Tampilkan:</span>
                        <select
                          value={limitAntrian}
                          onChange={e => { setLimitAntrian(parseInt(e.target.value)); setCurrentPageAntrian(1); }}
                          className="form-control-custom"
                          style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px', width: '75px', margin: 0, fontWeight: 700, cursor: 'pointer' }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      {/* Search Bar */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '12px', color: '#94a3b8', fontSize: '0.85rem' }}></i>
                        <input 
                          type="text" 
                          placeholder="Cari antrian..." 
                          value={searchAntrian} 
                          onChange={e => { setSearchAntrian(e.target.value); setCurrentPageAntrian(1); }} 
                          className="form-control-custom"
                          style={{ padding: '6px 12px 6px 32px', fontSize: '0.82rem', borderRadius: '8px', width: '200px', margin: 0 }}
                        />
                        {searchAntrian && (
                          <i className="fas fa-times" onClick={() => { setSearchAntrian(''); setCurrentPageAntrian(1); }} style={{ position: 'absolute', right: '12px', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}></i>
                        )}
                      </div>
                      {/* Status Filter */}
                      <select
                        value={filterStatusAntrian}
                        onChange={e => { setFilterStatusAntrian(e.target.value); setCurrentPageAntrian(1); }}
                        className="form-control-custom"
                        style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px', width: '150px', margin: 0, fontWeight: 700 }}
                      >
                        <option value="all">Semua Status</option>
                        <option value="menunggu">Menunggu</option>
                        <option value="dipanggil">Dipanggil</option>
                        <option value="sedang_dilayani">Dilayani</option>
                        <option value="selesai">Selesai</option>
                        <option value="dibatalkan">Dibatalkan</option>
                      </select>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr><th className="px-4">No. Antrian</th><th>Nama Pelanggan</th><th>Layanan</th><th>Kendaraan</th><th>No. HP</th><th>Catatan</th><th>Tanggal</th><th>Waktu</th><th>Mekanik / Montir</th><th className="text-center">Status</th><th className="text-center px-4">Aksi</th></tr>
                      </thead>
                      <tbody>
                        {paginatedAntrian.length === 0 ? <tr><td colSpan="11" className="text-center py-5 text-muted">Tidak ada antrian yang cocok</td></tr>
                          : paginatedAntrian.map(a => {
                            const s = STATUS_MAP[a.status] || {};
                          return (
                            <tr key={a.id}>
                              <td className="px-4 fw-bold" style={{color:'#f97316'}}>{a.nomor_antrian}</td>
                              <td className="fw-semibold">{a.nama_pelanggan}</td>
                              <td>{a.nama_layanan}</td>
                              <td className="fw-bold" style={{color:'#1e293b'}}>{a.kendaraan || '-'}</td>
                              <td className="text-muted">{a.no_hp || '-'}</td>
                              <td className="text-muted" style={{maxWidth: 150, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}} title={a.catatan}>{a.catatan || '-'}</td>
                              <td className="text-muted">{a.tanggal ? a.tanggal.substring(0,10) : '-'}</td>
                              <td className="text-muted fw-bold">{a.slot_waktu ? a.slot_waktu.substring(0,5) + ' WIB' : '-'}</td>
                              <td>
                                {a.nama_montir ? (
                                  <span style={{ background: '#ecfeff', color: '#0891b2', padding: '4px 10px', borderRadius: 6, fontSize: '0.82rem', fontWeight: 700 }}>
                                    🔧 {a.nama_montir}
                                  </span>
                                ) : (
                                  <span style={{ color: '#94a3b8', fontSize: '0.82rem', fontStyle: 'italic' }}>Belum Ditugaskan</span>
                                )}
                              </td>
                              <td className="text-center"><span className={`badge-status ${s.cls}`}><i className={`fas ${s.icon}`}></i> {s.label}</span></td>
                              <td className="text-center px-4">
                                <div className="action-group justify-content-center" style={{ gap: 8 }}>
                                  {a.status === 'menunggu' && (
                                    <div style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
                                      <select 
                                        id={`assign-montir-${a.id}`}
                                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: 8, border: '1.5px solid #cbd5e1', fontWeight: 700, background: '#f8fafc', cursor: 'pointer' }}
                                      >
                                        <option value="">-- Pilih Montir --</option>
                                        {pengguna.filter(p => p.role === 'montir').map(m => {
                                          const isBusy = m.is_busy > 0;
                                          return (
                                            <option key={m.id} value={m.id} style={{ color: isBusy ? '#ef4444' : '#0f172a' }}>
                                              {m.nama} {isBusy ? `(🔴 SIBUK: ${m.active_antrian_nomor} - ${m.active_kendaraan})` : ' (🟢 BEBAS)'}
                                            </option>
                                          );
                                        })}
                                      </select>
                                      <button className="btn-action call" title="Panggil & Tugaskan" onClick={() => {
                                        const el = document.getElementById(`assign-montir-${a.id}`);
                                        aksiAntrianPanggil(a.id, el ? el.value : '');
                                      }}><i className="fas fa-bell"></i></button>
                                    </div>
                                  )}
                                  {a.status === 'dipanggil' && <button className="btn-action serve" title="Layani" onClick={() => aksiAntrian(a.id,'dilayani')}><i className="fas fa-car-crash"></i></button>}
                                  {a.status === 'sedang_dilayani' && <button className="btn-action done" title="Selesai" onClick={() => aksiAntrian(a.id,'selesai')}><i className="fas fa-check"></i></button>}
                                  {['menunggu','dipanggil'].includes(a.status) && (() => {
                                    try {
                                      const cTime = a.created_at ? new Date(a.created_at).getTime() : 0;
                                      const tLeft = Math.max(0, (180000 - (waktu.getTime() - cTime)) / 1000);
                                      const m = isNaN(tLeft) ? 0 : Math.floor(tLeft / 60);
                                      const s = isNaN(tLeft) ? 0 : Math.floor(tLeft % 60);
                                      const showTimer = a.status === 'menunggu' && tLeft > 0 && cTime > 0;
                                      
                                      return (
                                        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
                                          <button className="btn-action cancel" title="Batalkan" onClick={() => aksiAntrian(a.id,'batalkan')}><i className="fas fa-times"></i></button>
                                          {showTimer && <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 800, marginTop: 4 }}>{String(m).padStart(2,'0')}:{String(s).padStart(2,'0')}</span>}
                                        </div>
                                      );
                                    } catch (e) {
                                      return <button className="btn-action cancel" title="Batalkan" onClick={() => aksiAntrian(a.id,'batalkan')}><i className="fas fa-times"></i></button>;
                                    }
                                  })()}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1.5px solid #f1f5f9', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                    Menampilkan <span style={{ color: '#0f172a', fontWeight: 700 }}>{filteredAntrian.length > 0 ? startIndexAntrian + 1 : 0}</span> sampai <span style={{ color: '#0f172a', fontWeight: 700 }}>{Math.min(startIndexAntrian + limitAntrian, filteredAntrian.length)}</span> dari <span style={{ color: '#0f172a', fontWeight: 700 }}>{filteredAntrian.length}</span> entri
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button 
                      onClick={() => setCurrentPageAntrian(p => Math.max(1, p - 1))} 
                      disabled={activePage === 1}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#ffffff', fontWeight: 700, cursor: activePage === 1 ? 'not-allowed' : 'pointer', opacity: activePage === 1 ? 0.5 : 1, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <i className="fas fa-chevron-left" style={{ marginRight: 4 }}></i> Seb.
                    </button>
                    
                    {Array.from({ length: totalPagesAntrian }, (_, i) => i + 1).map(pageNum => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPageAntrian(pageNum)}
                        style={{
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          borderRadius: '8px',
                          border: pageNum === activePage ? '1.5px solid #f97316' : '1.5px solid #cbd5e1',
                          background: pageNum === activePage ? 'linear-gradient(135deg, #f97316, #fb923c)' : '#ffffff',
                          color: pageNum === activePage ? '#ffffff' : '#0f172a',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {pageNum}
                      </button>
                    ))}

                    <button 
                      onClick={() => setCurrentPageAntrian(p => Math.min(totalPagesAntrian, p + 1))} 
                      disabled={activePage === totalPagesAntrian}
                      style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#ffffff', fontWeight: 700, cursor: activePage === totalPagesAntrian ? 'not-allowed' : 'pointer', opacity: activePage === totalPagesAntrian ? 0.5 : 1, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center' }}
                    >
                      Sel. <i className="fas fa-chevron-right" style={{ marginLeft: 4 }}></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {/* ===== KELOLA KATEGORI KENDARAAN ===== */}
          {tab === 'kategori' && (() => {
            return (
              <div className="fade-in">
                <div className="table-card">
                  <div className="table-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <h6>Kelola Kategori Kendaraan</h6>
                      <span style={{background:'#f1f5f9',color:'#64748b',padding:'4px 14px',borderRadius:50,fontSize:'0.82rem',fontWeight:700}}>Total: {kategoriList.length}</span>
                    </div>
                    <button className="btn-add" style={{ margin: 0 }} onClick={() => { setKategoriForm({id:null,nama_kategori:'',deskripsi:'',icon:'directions_car',is_active:1}); setShowKategoriModal(true); }}>
                      <i className="fas fa-plus"></i> Tambah Kategori
                    </button>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="px-4" style={{width: 80}}>No.</th>
                          <th style={{width: 100}} className="text-center">Icon</th>
                          <th>Nama Kategori</th>
                          <th>Deskripsi</th>
                          <th className="text-center">Status</th>
                          <th className="text-center px-4" style={{width: 180}}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kategoriList.map((k, index) => (
                          <tr key={k.id}>
                            <td className="px-4 fw-bold text-muted">{index + 1}</td>
                            <td className="text-center">
                              <div style={{
                                width: 44,
                                height: 44,
                                borderRadius: 12,
                                background: '#fff7ed',
                                border: '1.5px solid #fdba74',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#f97316'
                              }}>
                                <i className={`fas fa-${k.icon || 'car'}`} style={{ fontSize: '1.2rem' }}></i>
                              </div>
                            </td>
                            <td className="fw-bold" style={{color:'#1e293b', fontSize: '0.95rem'}}>{k.nama_kategori}</td>
                            <td className="text-muted" style={{maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{k.deskripsi || '-'}</td>
                            <td className="text-center">
                              <span 
                                style={{
                                  background: k.is_active ? '#f0fdf4' : '#fef2f2',
                                  color: k.is_active ? '#16a34a' : '#dc2626',
                                  padding: '4px 12px',
                                  borderRadius: 50,
                                  fontSize: '0.82rem',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                onClick={async () => {
                                  const updatedActive = k.is_active ? 0 : 1;
                                  try {
                                    const res = await fetch(`${CONFIG.API_BASE_URL}/kategori-kendaraan/${k.id}`, {
                                      method: 'PUT',
                                      headers: authH,
                                      body: JSON.stringify({
                                        nama_kategori: k.nama_kategori,
                                        deskripsi: k.deskripsi,
                                        icon: k.icon,
                                        is_active: updatedActive
                                      })
                                    });
                                    if (res.ok) {
                                      fetchKategori();
                                    }
                                  } catch {}
                                }}
                              >
                                {k.is_active ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </td>
                            <td className="text-center px-4">
                              <div className="action-group justify-content-center" style={{ gap: 8 }}>
                                <button className="btn-action edit" title="Edit Kategori" onClick={() => {
                                  setKategoriForm({
                                    id: k.id,
                                    nama_kategori: k.nama_kategori,
                                    deskripsi: k.deskripsi || '',
                                    icon: k.icon || 'directions_car',
                                    is_active: k.is_active !== undefined ? k.is_active : 1
                                  });
                                  setShowKategoriModal(true);
                                }}><i className="fas fa-edit"></i></button>
                                <button className="btn-action delete" title="Hapus Kategori" onClick={() => deleteKategori(k.id)}><i className="fas fa-trash"></i></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {kategoriList.length === 0 && (
                          <tr><td colSpan="6" className="text-center py-5 text-muted">Belum ada kategori kendaraan</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ===== KELOLA LAYANAN ===== */}
          {tab === 'layanan' && (() => {
            const filteredLayanan = layanan.filter(l => {
              if (filterStatusLayanan !== 'all') {
                const isActiveFilter = filterStatusLayanan === 'aktif' ? 1 : 0;
                if (l.is_aktif !== isActiveFilter) return false;
              }
              if (searchLayanan.trim() !== '') {
                const q = searchLayanan.toLowerCase();
                const nama = (l.nama_layanan || '').toLowerCase();
                const deskripsi = (l.deskripsi || '').toLowerCase();
                return nama.includes(q) || deskripsi.includes(q);
              }
              return true;
            });

            // Kalkulasi Pagination
            const totalEntriesLayanan = filteredLayanan.length;
            const totalPagesLayanan = Math.ceil(totalEntriesLayanan / limitLayanan) || 1;
            
            // Jaga-jaga jika currentPage melebihi totalPages akibat filtering/searching
            const activePageLayanan = currentPageLayanan > totalPagesLayanan ? 1 : currentPageLayanan;
            if (currentPageLayanan > totalPagesLayanan) {
              setCurrentPageLayanan(1);
            }

            const startIndexLayanan = (activePageLayanan - 1) * limitLayanan;
            const paginatedLayanan = filteredLayanan.slice(startIndexLayanan, startIndexLayanan + limitLayanan);

            return (
              <div className="fade-in">
                <div className="table-card">
                  <div className="table-card-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <h6>Manajemen Layanan</h6>
                      <span style={{background:'#f1f5f9',color:'#64748b',padding:'4px 14px',borderRadius:50,fontSize:'0.82rem',fontWeight:700}}>Total: {filteredLayanan.length}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Limit Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Tampilkan:</span>
                        <select
                          value={limitLayanan}
                          onChange={e => { setLimitLayanan(parseInt(e.target.value)); setCurrentPageLayanan(1); }}
                          className="form-control-custom"
                          style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px', width: '75px', margin: 0, fontWeight: 700, cursor: 'pointer' }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      {/* Search Bar */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '12px', color: '#94a3b8', fontSize: '0.85rem' }}></i>
                        <input 
                          type="text" 
                          placeholder="Cari layanan..." 
                          value={searchLayanan} 
                          onChange={e => { setSearchLayanan(e.target.value); setCurrentPageLayanan(1); }} 
                          className="form-control-custom"
                          style={{ padding: '6px 12px 6px 32px', fontSize: '0.82rem', borderRadius: '8px', width: '200px', margin: 0 }}
                        />
                        {searchLayanan && (
                          <i className="fas fa-times" onClick={() => { setSearchLayanan(''); setCurrentPageLayanan(1); }} style={{ position: 'absolute', right: '12px', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}></i>
                        )}
                      </div>
                      
                      {/* Status Filter */}
                      <select
                        value={filterStatusLayanan}
                        onChange={e => { setFilterStatusLayanan(e.target.value); setCurrentPageLayanan(1); }}
                        className="form-control-custom"
                        style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px', width: '130px', margin: 0, fontWeight: 700 }}
                      >
                        <option value="all">Semua Status</option>
                        <option value="aktif">Aktif</option>
                        <option value="nonaktif">Nonaktif</option>
                      </select>

                      <button className="btn-add" style={{ margin: 0 }} onClick={() => { setLayananForm({id:null,kategori_id:'',nama_layanan:'',deskripsi:'',estimasi_menit:30,harga:0,is_aktif:1}); setShowLayananModal(true); }}>
                        <i className="fas fa-plus"></i> Tambah Layanan
                      </button>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light"><tr><th className="px-4">Nama Layanan</th><th>Kategori</th><th>Deskripsi</th><th>Estimasi</th><th>Biaya / Harga</th><th className="text-center">Status</th><th className="text-center px-4">Aksi</th></tr></thead>
                      <tbody>
                        {paginatedLayanan.map(l => (
                          <tr key={l.id}>
                            <td className="px-4 fw-bold">{l.nama_layanan}</td>
                            <td className="fw-semibold text-primary">{l.kategori?.nama_kategori || l.nama_kategori || '-'}</td>
                            <td className="text-muted" style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.deskripsi || '-'}</td>
                            <td><span style={{background:'#f0fdf4',color:'#16a34a',padding:'4px 12px',borderRadius:50,fontSize:'0.82rem',fontWeight:700}}>±{l.estimasi_menit} mnt</span></td>
                            <td className="fw-bold" style={{color:'#1e293b'}}>Rp {l.harga ? l.harga.toLocaleString('id-ID') : '0'}</td>
                            <td className="text-center"><span style={{background:l.is_aktif?'#f0fdf4':'#fef2f2',color:l.is_aktif?'#16a34a':'#dc2626',padding:'4px 12px',borderRadius:50,fontSize:'0.82rem',fontWeight:700}}>{l.is_aktif?'Aktif':'Nonaktif'}</span></td>
                            <td className="text-center px-4">
                              <div className="action-group justify-content-center">
                                <button className="btn-action edit" title="Edit" onClick={() => { setLayananForm({id:l.id,kategori_id:l.kategori_id||'',nama_layanan:l.nama_layanan,deskripsi:l.deskripsi||'',estimasi_menit:l.estimasi_menit,harga:l.harga||0,is_aktif:l.is_aktif}); setShowLayananModal(true); }}><i className="fas fa-edit"></i></button>
                                <button className="btn-action delete" title="Hapus" onClick={() => deleteLayanan(l.id)}><i className="fas fa-trash"></i></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                        {paginatedLayanan.length === 0 && <tr><td colSpan="7" className="text-center py-5 text-muted">Tidak ada layanan yang cocok</td></tr>}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1.5px solid #f1f5f9', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                      Menampilkan <span style={{ color: '#0f172a', fontWeight: 700 }}>{filteredLayanan.length > 0 ? startIndexLayanan + 1 : 0}</span> sampai <span style={{ color: '#0f172a', fontWeight: 700 }}>{Math.min(startIndexLayanan + limitLayanan, filteredLayanan.length)}</span> dari <span style={{ color: '#0f172a', fontWeight: 700 }}>{filteredLayanan.length}</span> entri
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        onClick={() => setCurrentPageLayanan(p => Math.max(1, p - 1))} 
                        disabled={activePageLayanan === 1}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#ffffff', fontWeight: 700, cursor: activePageLayanan === 1 ? 'not-allowed' : 'pointer', opacity: activePageLayanan === 1 ? 0.5 : 1, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <i className="fas fa-chevron-left" style={{ marginRight: 4 }}></i> Seb.
                      </button>
                      
                      {Array.from({ length: totalPagesLayanan }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPageLayanan(pageNum)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            border: pageNum === activePageLayanan ? '1.5px solid #f97316' : '1.5px solid #cbd5e1',
                            background: pageNum === activePageLayanan ? 'linear-gradient(135deg, #f97316, #fb923c)' : '#ffffff',
                            color: pageNum === activePageLayanan ? '#ffffff' : '#0f172a',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button 
                        onClick={() => setCurrentPageLayanan(p => Math.min(totalPagesLayanan, p + 1))} 
                        disabled={activePageLayanan === totalPagesLayanan}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#ffffff', fontWeight: 700, cursor: activePageLayanan === totalPagesLayanan ? 'not-allowed' : 'pointer', opacity: activePageLayanan === totalPagesLayanan ? 0.5 : 1, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center' }}
                      >
                        Sel. <i className="fas fa-chevron-right" style={{ marginLeft: 4 }}></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ===== JADWAL OPERASIONAL ===== */}
          {tab === 'jadwal' && (
            <div className="fade-in">
              <div className="table-card">
                <div className="table-card-header">
                  <h6>Jadwal Operasional Bengkel</h6>
                  <button className="btn-add" onClick={() => { setJadwalForm({id:null,hari:1,jam_buka:'08:00',jam_tutup:'17:00',kuota_per_slot:5,is_libur:0}); setShowJadwalModal(true); }}>
                    <i className="fas fa-plus"></i> Tambah Jadwal
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light"><tr><th className="px-4">Hari</th><th>Jam Buka</th><th>Jam Tutup</th><th>Kuota/Slot</th><th className="text-center">Status</th><th className="text-center px-4">Aksi</th></tr></thead>
                    <tbody>
                      {jadwal.map(j => (
                        <tr key={j.id}>
                          <td className="px-4 fw-bold">{HARI[j.hari]}</td>
                          <td>{j.is_libur ? '-' : (j.jam_buka ? j.jam_buka.substring(0, 5) : '-')}</td>
                          <td>{j.is_libur ? '-' : (j.jam_tutup ? j.jam_tutup.substring(0, 5) : '-')}</td>
                          <td>{j.is_libur ? '-' : j.kuota_per_slot + ' antrian'}</td>
                          <td className="text-center"><span style={{background:j.is_libur?'#fef2f2':'#f0fdf4',color:j.is_libur?'#dc2626':'#16a34a',padding:'4px 12px',borderRadius:50,fontSize:'0.82rem',fontWeight:700}}>{j.is_libur?'Libur':'Buka'}</span></td>
                          <td className="text-center px-4">
                            <div className="action-group justify-content-center">
                              <button className="btn-action edit" onClick={() => { setJadwalForm({id:j.id,hari:j.hari,jam_buka:j.jam_buka.substring(0,5),jam_tutup:j.jam_tutup.substring(0,5),kuota_per_slot:j.kuota_per_slot,is_libur:j.is_libur}); setShowJadwalModal(true); }}><i className="fas fa-edit"></i></button>
                              <button className="btn-action delete" onClick={() => deleteJadwal(j.id)}><i className="fas fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {jadwal.length === 0 && <tr><td colSpan="6" className="text-center py-5 text-muted">Belum ada jadwal</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== LAPORAN ===== */}
          {tab === 'laporan' && (
            !laporan ? (
              <div className="text-center py-5"><div className="spinner-border text-warning spinner-border-sm"></div></div>
            ) : (
              <div className="fade-in">
                <div className="table-card">
                  <div className="table-card-header"><h6>Antrian Per Layanan (Hari Ini)</h6></div>
                <div style={{padding:'24px 32px'}}>
                  {(laporan.per_layanan || []).length === 0
                    ? <div className="empty-state"><i className="fas fa-chart-bar"></i><p>Belum ada data hari ini</p></div>
                    : laporan.per_layanan.map((p,i) => {
                        const pct = laporan.hari_ini?.total > 0 ? Math.round((p.total / laporan.hari_ini.total) * 100) : 0;
                        return (
                          <div key={i} style={{marginBottom:20}}>
                            <div className="laporan-row-item">
                              <span className="name">{p.nama_layanan}</span>
                              <span className="count">{p.total} antrian</span>
                            </div>
                            <div className="progress-bar-custom"><div className="progress-fill" style={{width:`${pct}%`}}></div></div>
                          </div>
                        );
                      })}
                </div>
              </div>
            </div>
          )
        )}

          {/* ===== KELOLA PENGGUNA ===== */}
          {tab === 'pengguna' && (() => {
            const filteredPengguna = pengguna.filter(p => {
              if (filterRolePengguna !== 'all' && p.role !== filterRolePengguna) return false;
              if (searchPengguna.trim() !== '') {
                const q = searchPengguna.toLowerCase();
                const nama = (p.nama || '').toLowerCase();
                const email = (p.email || '').toLowerCase();
                const no_hp = (p.no_hp || '').toLowerCase();
                return nama.includes(q) || email.includes(q) || no_hp.includes(q);
              }
              return true;
            });

            // Kalkulasi Pagination
            const totalEntriesPengguna = filteredPengguna.length;
            const totalPagesPengguna = Math.ceil(totalEntriesPengguna / limitPengguna) || 1;
            
            // Jaga-jaga jika currentPage melebihi totalPages akibat filtering/searching
            const activePagePengguna = currentPagePengguna > totalPagesPengguna ? 1 : currentPagePengguna;
            if (currentPagePengguna > totalPagesPengguna) {
              setCurrentPagePengguna(1);
            }

            const startIndexPengguna = (activePagePengguna - 1) * limitPengguna;
            const paginatedPengguna = filteredPengguna.slice(startIndexPengguna, startIndexPengguna + limitPengguna);

            return (
              <div className="fade-in">
                <div className="table-card">
                  <div className="table-card-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <h6>Daftar Akun Terdaftar</h6>
                      <span style={{background:'#f1f5f9',color:'#64748b',padding:'4px 14px',borderRadius:50,fontSize:'0.82rem',fontWeight:700}}>Total: {filteredPengguna.length}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      {/* Limit Selector */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 700 }}>Tampilkan:</span>
                        <select
                          value={limitPengguna}
                          onChange={e => { setLimitPengguna(parseInt(e.target.value)); setCurrentPagePengguna(1); }}
                          className="form-control-custom"
                          style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px', width: '75px', margin: 0, fontWeight: 700, cursor: 'pointer' }}
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                      </div>

                      {/* Search Bar */}
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <i className="fas fa-search" style={{ position: 'absolute', left: '12px', color: '#94a3b8', fontSize: '0.85rem' }}></i>
                        <input 
                          type="text" 
                          placeholder="Cari akun..." 
                          value={searchPengguna} 
                          onChange={e => { setSearchPengguna(e.target.value); setCurrentPagePengguna(1); }} 
                          className="form-control-custom"
                          style={{ padding: '6px 12px 6px 32px', fontSize: '0.82rem', borderRadius: '8px', width: '200px', margin: 0 }}
                        />
                        {searchPengguna && (
                          <i className="fas fa-times" onClick={() => { setSearchPengguna(''); setCurrentPagePengguna(1); }} style={{ position: 'absolute', right: '12px', color: '#94a3b8', fontSize: '0.85rem', cursor: 'pointer' }}></i>
                        )}
                      </div>
                      
                      {/* Role Filter */}
                      <select
                        value={filterRolePengguna}
                        onChange={e => { setFilterRolePengguna(e.target.value); setCurrentPagePengguna(1); }}
                        className="form-control-custom"
                        style={{ padding: '6px 12px', fontSize: '0.82rem', borderRadius: '8px', width: '150px', margin: 0, fontWeight: 700 }}
                      >
                        <option value="all">Semua Role</option>
                        <option value="pelanggan">Pelanggan</option>
                        <option value="montir">Montir / Mekanik</option>
                        <option value="admin">Admin Utama</option>
                      </select>

                      <button className="btn-submit-form" style={{ width: 'auto', padding: '8px 16px', margin: 0, fontSize: '0.82rem', borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #fb923c)', border: 'none' }} onClick={() => { setPenggunaForm({ nama: '', email: '', password: '', no_hp: '', role: 'pelanggan' }); setShowPenggunaModal(true); }}>
                        <i className="fas fa-user-plus"></i> Tambah Akun Baru
                      </button>
                    </div>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="px-4">No.</th>
                          <th>Nama Pengguna</th>
                          <th>Email</th>
                          <th>No. HP</th>
                          <th className="text-center" style={{width: 220}}>Hak Akses (Role)</th>
                          <th className="text-center px-4" style={{width: 140}}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPengguna.length === 0 ? (
                          <tr><td colSpan="6" className="text-center py-5 text-muted">Tidak ada akun yang cocok</td></tr>
                        ) : (
                          paginatedPengguna.map((p, idx) => (
                            <tr key={p.id}>
                              <td className="px-4 fw-bold text-muted">{startIndexPengguna + idx + 1}</td>
                              <td className="fw-semibold">{p.nama}</td>
                              <td className="text-muted">{p.email}</td>
                              <td className="text-muted">{p.no_hp || '-'}</td>
                              <td className="text-center">
                                <select 
                                  className="form-control-custom" 
                                  style={{
                                    padding: '6px 12px',
                                    fontSize: '0.85rem',
                                    fontWeight: 700,
                                    borderRadius: 8,
                                    border: '1.5px solid #cbd5e1',
                                    color: p.role === 'admin' ? '#f97316' : p.role === 'montir' ? '#06b6d4' : '#64748b',
                                    background: p.role === 'admin' ? '#fff7ed' : p.role === 'montir' ? '#ecfeff' : '#f8fafc',
                                    textAlign: 'center',
                                    width: '100%',
                                    cursor: 'pointer'
                                  }} 
                                  value={p.role} 
                                  onChange={e => updateUserRole(p.id, e.target.value)}
                                >
                                  <option value="pelanggan" style={{color: '#64748b'}}>Pelanggan</option>
                                  <option value="montir" style={{color: '#06b6d4'}}>Montir / Mekanik</option>
                                  <option value="admin" style={{color: '#f97316'}}>Admin Utama</option>
                                </select>
                              </td>
                              <td className="text-center px-4">
                                <div className="action-group justify-content-center" style={{ gap: 8 }}>
                                  <button className="btn-action edit" title="Edit Akun" onClick={() => {
                                    setPenggunaForm({
                                      id: p.id,
                                      nama: p.nama,
                                      email: p.email,
                                      password: '', // Kosongkan di form agar tidak wajib diubah
                                      no_hp: p.no_hp || '',
                                      role: p.role
                                    });
                                    setShowPenggunaModal(true);
                                  }}><i className="fas fa-edit"></i></button>
                                  <button className="btn-action delete" title="Hapus Akun" onClick={() => deletePengguna(p.id)}><i className="fas fa-trash"></i></button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Footer */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderTop: '1.5px solid #f1f5f9', background: '#f8fafc', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px', flexWrap: 'wrap', gap: '12px' }}>
                    <div style={{ fontSize: '0.82rem', color: '#64748b', fontWeight: 600 }}>
                      Menampilkan <span style={{ color: '#0f172a', fontWeight: 700 }}>{filteredPengguna.length > 0 ? startIndexPengguna + 1 : 0}</span> sampai <span style={{ color: '#0f172a', fontWeight: 700 }}>{Math.min(startIndexPengguna + limitPengguna, filteredPengguna.length)}</span> dari <span style={{ color: '#0f172a', fontWeight: 700 }}>{filteredPengguna.length}</span> entri
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <button 
                        onClick={() => setCurrentPagePengguna(p => Math.max(1, p - 1))} 
                        disabled={activePagePengguna === 1}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#ffffff', fontWeight: 700, cursor: activePagePengguna === 1 ? 'not-allowed' : 'pointer', opacity: activePagePengguna === 1 ? 0.5 : 1, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center' }}
                      >
                        <i className="fas fa-chevron-left" style={{ marginRight: 4 }}></i> Seb.
                      </button>
                      
                      {Array.from({ length: totalPagesPengguna }, (_, i) => i + 1).map(pageNum => (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPagePengguna(pageNum)}
                          style={{
                            padding: '6px 12px',
                            fontSize: '0.8rem',
                            borderRadius: '8px',
                            border: pageNum === activePagePengguna ? '1.5px solid #f97316' : '1.5px solid #cbd5e1',
                            background: pageNum === activePagePengguna ? 'linear-gradient(135deg, #f97316, #fb923c)' : '#ffffff',
                            color: pageNum === activePagePengguna ? '#ffffff' : '#0f172a',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {pageNum}
                        </button>
                      ))}

                      <button 
                        onClick={() => setCurrentPagePengguna(p => Math.min(totalPagesPengguna, p + 1))} 
                        disabled={activePagePengguna === totalPagesPengguna}
                        style={{ padding: '6px 12px', fontSize: '0.8rem', borderRadius: '8px', border: '1.5px solid #cbd5e1', background: '#ffffff', fontWeight: 700, cursor: activePagePengguna === totalPagesPengguna ? 'not-allowed' : 'pointer', opacity: activePagePengguna === totalPagesPengguna ? 0.5 : 1, transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center' }}
                      >
                        Sel. <i className="fas fa-chevron-right" style={{ marginLeft: 4 }}></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

        </div>
      </div>

      {/* MODAL LAYANAN */}
      {showLayananModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowLayananModal(false)}>
          <div className="modal-box">
            <div className="modal-head">
              <h5><i className="fas fa-wrench" style={{color:'#f97316',marginRight:8}}></i>{layananForm.id ? 'Edit Layanan' : 'Tambah Layanan'}</h5>
              <button className="btn-close-modal" onClick={() => setShowLayananModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body-box">
              <form onSubmit={saveLayanan}>
                <div className="form-group-custom"><label>Nama Layanan</label><input className="form-control-custom" value={layananForm.nama_layanan} onChange={e=>setLayananForm({...layananForm,nama_layanan:e.target.value})} required placeholder="Contoh: Ganti Oli"/></div>
                <div className="form-group-custom">
                  <label>Kategori Kendaraan</label>
                  <select className="form-control-custom" value={layananForm.kategori_id} onChange={e=>setLayananForm({...layananForm,kategori_id:e.target.value})} required>
                    <option value="">-- Pilih Kategori --</option>
                    {kategoriList.map(k => (
                      <option key={k.id} value={k.id}>{k.nama_kategori}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group-custom"><label>Deskripsi</label><textarea className="form-control-custom" value={layananForm.deskripsi} onChange={e=>setLayananForm({...layananForm,deskripsi:e.target.value})} rows={3} placeholder="Deskripsi layanan..." style={{resize:'none'}}></textarea></div>
                <div className="form-group-custom"><label>Estimasi (menit)</label><input type="number" className="form-control-custom" value={layananForm.estimasi_menit} onChange={e=>setLayananForm({...layananForm,estimasi_menit:parseInt(e.target.value) || 30})} min={5} required/></div>
                <div className="form-group-custom"><label>Biaya / Harga (Rupiah)</label><input type="number" className="form-control-custom" value={layananForm.harga} onChange={e=>setLayananForm({...layananForm,harga:parseInt(e.target.value) || 0})} min={0} required placeholder="Contoh: 50000"/></div>
                <div className="form-group-custom"><label>Status</label>
                  <select className="form-control-custom" value={layananForm.is_aktif} onChange={e=>setLayananForm({...layananForm,is_aktif:parseInt(e.target.value)})}>
                    <option value={1}>Aktif</option><option value={0}>Nonaktif</option>
                  </select>
                </div>
                <button type="submit" className="btn-submit-form"><i className="fas fa-save"></i> Simpan</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KATEGORI */}
      {showKategoriModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowKategoriModal(false)}>
          <div className="modal-box">
            <div className="modal-head">
              <h5><i className="fas fa-car" style={{color:'#f97316',marginRight:8}}></i>{kategoriForm.id ? 'Edit Kategori' : 'Tambah Kategori'}</h5>
              <button className="btn-close-modal" onClick={() => setShowKategoriModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body-box">
              <form onSubmit={saveKategori}>
                <div className="form-group-custom"><label>Nama Kategori</label><input className="form-control-custom" value={kategoriForm.nama_kategori} onChange={e=>setKategoriForm({...kategoriForm,nama_kategori:e.target.value})} required placeholder="Contoh: Motor"/></div>
                <div className="form-group-custom"><label>Deskripsi</label><textarea className="form-control-custom" value={kategoriForm.deskripsi} onChange={e=>setKategoriForm({...kategoriForm,deskripsi:e.target.value})} rows={3} placeholder="Deskripsi kategori..." style={{resize:'none'}}></textarea></div>
                <div className="form-group-custom">
                  <label>Icon Kendaraan</label>
                  <select className="form-control-custom" value={kategoriForm.icon} onChange={e=>setKategoriForm({...kategoriForm,icon:e.target.value})} required>
                    <option value="directions_car">Mobil (directions_car)</option>
                    <option value="two_wheeler">Motor (two_wheeler)</option>
                    <option value="directions_bus">Bus (directions_bus)</option>
                    <option value="local_shipping">Truk (local_shipping)</option>
                    <option value="airport_shuttle">Pickup (airport_shuttle)</option>
                    <option value="drive_eta">SUV (drive_eta)</option>
                    <option value="motorcycle">Motor Klasik (motorcycle)</option>
                    <option value="bicycle">Sepeda (bicycle)</option>
                  </select>
                </div>
                <div className="form-group-custom"><label>Status Kategori</label>
                  <select className="form-control-custom" value={kategoriForm.is_active} onChange={e=>setKategoriForm({...kategoriForm,is_active:parseInt(e.target.value)})}>
                    <option value={1}>Aktif</option>
                    <option value={0}>Nonaktif</option>
                  </select>
                </div>
                <button type="submit" className="btn-submit-form"><i className="fas fa-save"></i> Simpan</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL JADWAL */}
      {showJadwalModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowJadwalModal(false)}>
          <div className="modal-box">
            <div className="modal-head">
              <h5><i className="fas fa-calendar-alt" style={{color:'#f97316',marginRight:8}}></i>{jadwalForm.id ? 'Edit Jadwal' : 'Tambah Jadwal'}</h5>
              <button className="btn-close-modal" onClick={() => setShowJadwalModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body-box">
              <form onSubmit={saveJadwal}>
                <div className="form-group-custom"><label>Hari</label>
                  <select className="form-control-custom" value={jadwalForm.hari} onChange={e=>setJadwalForm({...jadwalForm,hari:parseInt(e.target.value)})}>
                    {HARI.map((h,i)=><option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
                  <div className="form-group-custom"><label>Jam Buka</label><input type="time" className="form-control-custom" value={jadwalForm.jam_buka} onChange={e=>setJadwalForm({...jadwalForm,jam_buka:e.target.value})} required/></div>
                  <div className="form-group-custom"><label>Jam Tutup</label><input type="time" className="form-control-custom" value={jadwalForm.jam_tutup} onChange={e=>setJadwalForm({...jadwalForm,jam_tutup:e.target.value})} required/></div>
                </div>
                <div className="form-group-custom"><label>Kuota Per Slot</label><input type="number" className="form-control-custom" value={jadwalForm.kuota_per_slot} onChange={e=>setJadwalForm({...jadwalForm,kuota_per_slot:parseInt(e.target.value)})} min={1}/></div>
                <div className="form-group-custom"><label>Status Hari</label>
                  <select className="form-control-custom" value={jadwalForm.is_libur} onChange={e=>setJadwalForm({...jadwalForm,is_libur:parseInt(e.target.value)})}>
                    <option value={0}>Buka</option><option value={1}>Libur</option>
                  </select>
                </div>
                <button type="submit" className="btn-submit-form"><i className="fas fa-save"></i> Simpan</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH/EDIT PENGGUNA */}
      {showPenggunaModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowPenggunaModal(false)}>
          <div className="modal-box">
            <div className="modal-head">
              <h5>
                <i className={penggunaForm.id ? "fas fa-user-edit" : "fas fa-user-plus"} style={{color:'#f97316',marginRight:8}}></i>
                {penggunaForm.id ? 'Edit Akun Pengguna' : 'Tambah Akun Baru'}
              </h5>
              <button className="btn-close-modal" onClick={() => setShowPenggunaModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body-box">
              <form onSubmit={savePengguna}>
                <div className="form-group-custom">
                  <label>Nama Pengguna</label>
                  <input type="text" className="form-control-custom" value={penggunaForm.nama} onChange={e=>setPenggunaForm({...penggunaForm,nama:e.target.value})} required placeholder="Contoh: Budi Santoso"/>
                </div>
                <div className="form-group-custom">
                  <label>Email</label>
                  <input type="email" className="form-control-custom" value={penggunaForm.email} onChange={e=>setPenggunaForm({...penggunaForm,email:e.target.value})} required placeholder="Contoh: budi@gmail.com"/>
                </div>
                <div className="form-group-custom">
                  <label>Password {penggunaForm.id && <span style={{fontSize: '0.78rem', color: '#64748b', fontWeight: 'normal'}}>(Opsional)</span>}</label>
                  <input 
                    type="password" 
                    className="form-control-custom" 
                    value={penggunaForm.password} 
                    onChange={e=>setPenggunaForm({...penggunaForm,password:e.target.value})} 
                    required={!penggunaForm.id} 
                    placeholder={penggunaForm.id ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password akun"}
                  />
                </div>
                <div className="form-group-custom">
                  <label>No. HP (Opsional)</label>
                  <input type="text" className="form-control-custom" value={penggunaForm.no_hp} onChange={e=>setPenggunaForm({...penggunaForm,no_hp:e.target.value})} placeholder="Contoh: 081234567890"/>
                </div>
                <div className="form-group-custom">
                  <label>Hak Akses / Role</label>
                  <select className="form-control-custom" value={penggunaForm.role} onChange={e=>setPenggunaForm({...penggunaForm,role:e.target.value})}>
                    <option value="pelanggan">Pelanggan (Customer)</option>
                    <option value="montir">Mekanik / Montir (Mechanic)</option>
                    <option value="admin">Admin Utama</option>
                  </select>
                </div>
                <button type="submit" className="btn-submit-form" style={{ background: 'linear-gradient(135deg, #f97316, #fb923c)', border: 'none' }}>
                  <i className={penggunaForm.id ? "fas fa-save" : "fas fa-user-check"}></i> {penggunaForm.id ? 'Simpan Perubahan' : 'Buat Akun'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
