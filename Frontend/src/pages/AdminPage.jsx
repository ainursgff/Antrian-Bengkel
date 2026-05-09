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

  const [tab, setTab] = useState('dashboard');
  const [antrian, setAntrian] = useState([]);
  const [layanan, setLayanan] = useState([]);
  const [jadwal, setJadwal] = useState([]);
  const [laporan, setLaporan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [showLayananModal, setShowLayananModal] = useState(false);
  const [layananForm, setLayananForm] = useState({ id: null, nama_layanan: '', deskripsi: '', estimasi_menit: 30, is_aktif: 1 });

  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [jadwalForm, setJadwalForm] = useState({ id: null, hari: 1, jam_buka: '08:00', jam_tutup: '17:00', kuota_per_slot: 5, is_libur: 0 });

  useEffect(() => {
    if (!token || localStorage.getItem('antrian_role') !== 'admin') { navigate('/login'); return; }
    const link = document.createElement('link');
    link.href = '/stylesheets/admin.css'; link.rel = 'stylesheet';
    document.head.appendChild(link);
    fetchAll();
    const iv = setInterval(fetchAntrian, 10000);
    return () => { clearInterval(iv); document.head.removeChild(link); };
  }, []);

  const fetchAll = () => { fetchAntrian(); fetchLayanan(); fetchJadwal(); fetchLaporan(); };
  const fetchAntrian = async () => {
    try {
      const r = await fetch(`${CONFIG.API_BASE_URL}/antrian`, { headers: authH });
      setAntrian(await r.json());
    } catch {} finally { setIsLoading(false); }
  };
  const fetchLayanan = async () => {
    try { const r = await fetch(`${CONFIG.API_BASE_URL}/layanan`); setLayanan(await r.json()); } catch {}
  };
  const fetchJadwal = async () => {
    try { const r = await fetch(`${CONFIG.API_BASE_URL}/jadwal`); setJadwal(await r.json()); } catch {}
  };
  const fetchLaporan = async () => {
    try { const r = await fetch(`${CONFIG.API_BASE_URL}/laporan`, { headers: authH }); setLaporan(await r.json()); } catch {}
  };

  const aksiAntrian = async (id, aksi) => {
    if (!window.confirm(`${aksi} antrian ini?`)) return;
    await fetch(`${CONFIG.API_BASE_URL}/antrian/${id}/${aksi}`, { method: 'PUT', headers: authH });
    fetchAntrian();
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
    { id: 'layanan', label: 'Kelola Layanan', icon: 'fa-wrench' },
    { id: 'jadwal', label: 'Jadwal Operasional', icon: 'fa-calendar-alt' },
    { id: 'laporan', label: 'Laporan', icon: 'fa-chart-bar' },
  ];

  const TAB_LABELS = { dashboard:'Dashboard', antrian:'Kelola Antrian', layanan:'Kelola Layanan', jadwal:'Jadwal Operasional', laporan:'Laporan Antrian' };

  return (
    <div className="panel-layout">
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
          <button className="btn-logout" onClick={logout}><i className="fas fa-sign-out-alt"></i> Keluar</button>
        </div>
      </nav>

      {/* MAIN */}
      <div className="main-area">
        <header className="topbar">
          <h5 className="topbar-title">{TAB_LABELS[tab]}</h5>
          <div className="topbar-user">
            <div className="user-info"><div className="user-name">Administrator</div><div className="user-role">Admin Bengkel</div></div>
            <img src="https://ui-avatars.com/api/?name=Admin&background=f97316&color=fff&bold=true" className="avatar" alt="Admin" />
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
              <div className="table-card">
                <div className="table-card-header"><h6><i className="fas fa-clock" style={{color:'#f97316'}}></i> &nbsp;5 Antrian Terbaru Hari Ini</h6></div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light"><tr><th className="px-4">No. Antrian</th><th>Nama</th><th>Layanan</th><th>Est. Waktu</th><th className="text-center">Status</th></tr></thead>
                    <tbody>
                      {isLoading ? <tr><td colSpan="5" className="text-center py-5"><div className="spinner-border text-warning spinner-border-sm"></div></td></tr>
                        : antrian.slice().reverse().slice(0,5).map(a => {
                          const s = STATUS_MAP[a.status] || {};
                          return (
                            <tr key={a.id}>
                              <td className="px-4 fw-bold" style={{color:'#f97316'}}>{a.nomor_antrian}</td>
                              <td className="fw-semibold">{a.nama_pelanggan}</td>
                              <td>{a.nama_layanan}</td>
                              <td className="text-muted">{a.slot_waktu ? a.slot_waktu.substring(0,5) : '-'}</td>
                              <td className="text-center"><span className={`badge-status ${s.cls}`}><i className={`fas ${s.icon}`}></i> {s.label}</span></td>
                            </tr>
                          );
                        })}
                      {!isLoading && antrian.length === 0 && <tr><td colSpan="5" className="text-center py-5 text-muted">Belum ada antrian hari ini</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ===== KELOLA ANTRIAN ===== */}
          {tab === 'antrian' && (
            <div className="fade-in">
              <div className="table-card">
                <div className="table-card-header">
                  <h6>Daftar Antrian Hari Ini</h6>
                  <span style={{background:'#f1f5f9',color:'#64748b',padding:'4px 14px',borderRadius:50,fontSize:'0.82rem',fontWeight:700}}>Total: {antrian.length}</span>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light">
                      <tr><th className="px-4">No.</th><th>Nama Pelanggan</th><th>Layanan</th><th>No. HP</th><th>Est. Waktu</th><th className="text-center">Status</th><th className="text-center px-4">Aksi</th></tr>
                    </thead>
                    <tbody>
                      {antrian.length === 0 ? <tr><td colSpan="7" className="text-center py-5 text-muted">Belum ada antrian</td></tr>
                        : antrian.map(a => {
                          const s = STATUS_MAP[a.status] || {};
                          return (
                            <tr key={a.id}>
                              <td className="px-4 fw-bold" style={{color:'#f97316'}}>{a.nomor_antrian}</td>
                              <td className="fw-semibold">{a.nama_pelanggan}<div className="text-muted" style={{fontSize:'0.82rem'}}>{a.catatan}</div></td>
                              <td>{a.nama_layanan}</td>
                              <td className="text-muted">{a.no_hp}</td>
                              <td className="text-muted">{a.slot_waktu ? a.slot_waktu.substring(0,5) : '-'}</td>
                              <td className="text-center"><span className={`badge-status ${s.cls}`}><i className={`fas ${s.icon}`}></i> {s.label}</span></td>
                              <td className="text-center px-4">
                                <div className="action-group justify-content-center">
                                  {a.status === 'menunggu' && <button className="btn-action call" title="Panggil" onClick={() => aksiAntrian(a.id,'panggil')}><i className="fas fa-bell"></i></button>}
                                  {a.status === 'dipanggil' && <button className="btn-action serve" title="Layani" onClick={() => aksiAntrian(a.id,'dilayani')}><i className="fas fa-car-crash"></i></button>}
                                  {a.status === 'sedang_dilayani' && <button className="btn-action done" title="Selesai" onClick={() => aksiAntrian(a.id,'selesai')}><i className="fas fa-check"></i></button>}
                                  {['menunggu','dipanggil'].includes(a.status) && <button className="btn-action cancel" title="Batalkan" onClick={() => aksiAntrian(a.id,'batalkan')}><i className="fas fa-times"></i></button>}
                                </div>
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

          {/* ===== KELOLA LAYANAN ===== */}
          {tab === 'layanan' && (
            <div className="fade-in">
              <div className="table-card">
                <div className="table-card-header">
                  <h6>Manajemen Layanan</h6>
                  <button className="btn-add" onClick={() => { setLayananForm({id:null,nama_layanan:'',deskripsi:'',estimasi_menit:30,is_aktif:1}); setShowLayananModal(true); }}>
                    <i className="fas fa-plus"></i> Tambah Layanan
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="table table-hover align-middle mb-0">
                    <thead className="table-light"><tr><th className="px-4">Nama Layanan</th><th>Deskripsi</th><th>Estimasi</th><th className="text-center">Status</th><th className="text-center px-4">Aksi</th></tr></thead>
                    <tbody>
                      {layanan.map(l => (
                        <tr key={l.id}>
                          <td className="px-4 fw-bold">{l.nama_layanan}</td>
                          <td className="text-muted" style={{maxWidth:220,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{l.deskripsi || '-'}</td>
                          <td><span style={{background:'#f0fdf4',color:'#16a34a',padding:'4px 12px',borderRadius:50,fontSize:'0.82rem',fontWeight:700}}>±{l.estimasi_menit} mnt</span></td>
                          <td className="text-center"><span style={{background:l.is_aktif?'#f0fdf4':'#fef2f2',color:l.is_aktif?'#16a34a':'#dc2626',padding:'4px 12px',borderRadius:50,fontSize:'0.82rem',fontWeight:700}}>{l.is_aktif?'Aktif':'Nonaktif'}</span></td>
                          <td className="text-center px-4">
                            <div className="action-group justify-content-center">
                              <button className="btn-action edit" title="Edit" onClick={() => { setLayananForm({id:l.id,nama_layanan:l.nama_layanan,deskripsi:l.deskripsi||'',estimasi_menit:l.estimasi_menit,is_aktif:l.is_aktif}); setShowLayananModal(true); }}><i className="fas fa-edit"></i></button>
                              <button className="btn-action delete" title="Hapus" onClick={() => deleteLayanan(l.id)}><i className="fas fa-trash"></i></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {layanan.length === 0 && <tr><td colSpan="5" className="text-center py-5 text-muted">Belum ada layanan</td></tr>}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

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
                          <td>{j.is_libur ? '-' : j.jam_buka}</td>
                          <td>{j.is_libur ? '-' : j.jam_tutup}</td>
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
          {tab === 'laporan' && laporan && (
            <div className="fade-in">
              <div className="stats-row" style={{marginBottom:24}}>
                {[
                  { label:'Total Hari Ini', val: laporan.hari_ini?.total || 0, icon:'fa-list-ol', cls:'orange' },
                  { label:'Menunggu', val: laporan.hari_ini?.menunggu || 0, icon:'fa-clock', cls:'yellow' },
                  { label:'Selesai', val: laporan.hari_ini?.selesai || 0, icon:'fa-check-circle', cls:'green' },
                  { label:'Dibatalkan', val: laporan.hari_ini?.dibatalkan || 0, icon:'fa-times-circle', cls:'red' },
                ].map((s,i) => (
                  <div className="stat-card" key={i}>
                    <div className={`stat-icon ${s.cls}`}><i className={`fas ${s.icon}`}></i></div>
                    <div className="stat-info"><small>{s.label}</small><h3>{s.val}</h3></div>
                  </div>
                ))}
              </div>
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
          )}

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
                <div className="form-group-custom"><label>Deskripsi</label><textarea className="form-control-custom" value={layananForm.deskripsi} onChange={e=>setLayananForm({...layananForm,deskripsi:e.target.value})} rows={3} placeholder="Deskripsi layanan..." style={{resize:'none'}}></textarea></div>
                <div className="form-group-custom"><label>Estimasi (menit)</label><input type="number" className="form-control-custom" value={layananForm.estimasi_menit} onChange={e=>setLayananForm({...layananForm,estimasi_menit:parseInt(e.target.value)})} min={5} required/></div>
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
    </div>
  );
}
