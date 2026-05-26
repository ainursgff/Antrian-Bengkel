// FILE: frontend/src/pages/ArsipOperasional.jsx
import React, { useState, useEffect } from 'react';
import CONFIG from '../config';
import { useToast } from '../context/ToastContext';
import { useQuery } from '../context/QueryProvider';

export default function ArsipOperasional() {
  const { showToast } = useToast();
  const { query, fetchWithRetry } = useQuery();

  const token = localStorage.getItem('antrian_token');

  const [archives, setArchives] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filtering States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [limit, setLimit] = useState(15);
  const [offset, setOffset] = useState(0);

  // Hard Delete Confirmation Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [targetDeleteId, setTargetDeleteId] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  
  // Archiving Simulation State
  const [simulating, setSimulating] = useState(false);

  const API_URL = CONFIG.API_BASE_URL;

  const handleSimulateArchive = async () => {
    setSimulating(true);
    try {
      const res = await fetchWithRetry(`${API_URL}/antrian/archive/run`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memproses simulasi arsip.');
      }
      
      showToast(`Simulasi Sukses! Berhasil memindahkan ${data.archivedCount} antrian selesai/dibatalkan ke database arsip!`, 'success');
      fetchArchives();
    } catch (err) {
      showToast(err.message || 'Gagal memproses simulasi arsip.', 'error');
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    fetchArchives();
  }, [offset, limit, selectedMonth]);

  const fetchArchives = async (searchOverride = null) => {
    setLoading(true);
    setError('');
    try {
      const searchVal = searchOverride !== null ? searchOverride : searchTerm;
      
      const queryParams = new URLSearchParams({
        search: searchVal,
        month: selectedMonth,
        limit,
        offset
      }).toString();

      const cacheKey = `archives_${searchVal}_${selectedMonth}_${limit}_${offset}`;
      
      const data = await query(cacheKey, async () => {
        const res = await fetchWithRetry(`${API_URL}/antrian/archive?${queryParams}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || 'Gagal memuat arsip operasional.');
        }
        return json;
      });

      setArchives(data.data || []);
      setTotalCount(data.total || 0);
    } catch (err) {
      setError(err.message || 'Gagal memuat arsip operasional.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setOffset(0);
    fetchArchives();
  };

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedMonth('');
    setOffset(0);
    fetchArchives('');
  };

  const formatRupiah = (num) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(num || 0);
  };

  const formatTanggalIndo = (tglStr) => {
    if (!tglStr) return '-';
    try {
      const d = new Date(tglStr);
      if (isNaN(d.getTime())) return tglStr.substring(0, 10);
      const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch { return tglStr.substring(0, 10); }
  };

  // Hard Delete Lifecycle
  const initiateHardDelete = (id) => {
    setTargetDeleteId(id);
    setDeleteConfirmText('');
    setShowDeleteModal(true);
  };

  const executeHardDelete = async () => {
    if (deleteConfirmText !== 'SUPER_CONFIRM_HARD_DELETE') {
      showToast('Teks konfirmasi ganda salah. Penghapusan dibatalkan.', 'error');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetchWithRetry(`${API_URL}/antrian/${targetDeleteId}/hard-delete`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirm_token: 'SUPER_CONFIRM_HARD_DELETE' })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus data secara permanen.');
      }
      
      showToast('Data antrian berhasil dihapus permanen dari sistem.', 'success');
      setShowDeleteModal(false);
      fetchArchives();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus data secara permanen.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Stats aggregators
  const totalRevenue = archives
    .filter(a => a.status?.toLowerCase() === 'selesai')
    .reduce((acc, curr) => acc + Number(curr.total_harga || 0), 0);

  return (
    <div className="fade-in">
      {/* JUMBOTRON TITLE */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '24px 32px', borderRadius: '16px', color: '#fff' }}>
        <div>
          <h6 style={{ margin: 0, fontSize: '0.85rem', color: '#f97316', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Database Archiving System</h6>
          <h4 style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.25rem' }}>Arsip Operasional Bengkel</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: '#94a3b8' }}>Manajemen riwayat dan pencarian data antrian selesai/dibatalkan yang berumur lebih dari 30 hari.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleSimulateArchive}
            disabled={simulating}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.85rem', fontWeight: 800, cursor: simulating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 16px -4px rgba(16,185,129,0.35)', transition: 'all 0.2s', opacity: simulating ? 0.7 : 1 }}
          >
            <i className={simulating ? "fas fa-spinner fa-spin" : "fas fa-magic"}></i> {simulating ? "Memproses..." : "Simulasi Arsip Sekarang"}
          </button>
          <button
            onClick={handleResetFilters}
            style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s' }}
          >
            <i className="fas fa-undo"></i> Reset Filter
          </button>
          <button
            onClick={() => fetchArchives()}
            style={{ padding: '10px 20px', background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 16px -4px rgba(249,115,22,0.35)', transition: 'all 0.2s' }}
          >
            <i className="fas fa-sync-alt"></i> Refresh Data
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon orange">
            <i className="fas fa-archive"></i>
          </div>
          <div className="stat-info">
            <small>Total Terarsip</small>
            <h3>{totalCount} <span style={{ fontSize: '1rem', fontWeight: 600, color: '#64748b' }}>Data</span></h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon green">
            <i className="fas fa-wallet"></i>
          </div>
          <div className="stat-info">
            <small>Omset Terarsip</small>
            <h3 style={{ color: '#10b981' }}>{formatRupiah(totalRevenue)}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon blue">
            <i className="fas fa-server"></i>
          </div>
          <div className="stat-info">
            <small>Status Database</small>
            <h3 style={{ color: '#3b82f6', fontSize: '1.6rem', marginTop: 8 }}>99.8% Efficient</h3>
          </div>
        </div>
      </div>

      {/* SEARCH & FILTERS container */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 24, marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        <form onSubmit={handleSearchSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Kata Kunci Pencarian</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 16, color: '#94a3b8' }}></i>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama pelanggan, nomor antrian, plat nomor, atau nama montir..."
                style={{ width: '100%', padding: '12px 16px 12px 42px', border: '1.5px solid #e2e8f0', borderRadius: 12, outline: 'none', fontFamily: 'inherit', fontSize: '0.9rem', transition: 'border-color 0.2s', background: '#f8fafc' }}
              />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Filter Bulan Operasional</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: '100%', padding: '12px 16px', border: '1.5px solid #e2e8f0', borderRadius: 12, outline: 'none', fontFamily: 'inherit', fontSize: '0.9rem', background: '#f8fafc' }}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button
              type="submit"
              style={{ width: '100%', padding: '13px 20px', background: '#1e293b', color: '#fff', border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', transition: 'background-color 0.2s' }}
            >
              <i className="fas fa-filter"></i> Terapkan Filter
            </button>
          </div>
        </form>
      </div>

      {/* DATA TABLE */}
      {loading ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 60, textAlign: 'center' }}>
          <i className="fas fa-spinner fa-spin" style={{ fontSize: '2.5rem', color: '#f97316', marginBottom: 16 }}></i>
          <div style={{ fontWeight: 700, color: '#1e293b' }}>Memuat arsip data...</div>
          <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>Melakukan query basis data operasional</div>
        </div>
      ) : error ? (
        <div style={{ background: '#fef2f2', border: '1px solid #fee2e2', borderRadius: 20, padding: 24, color: '#dc2626', display: 'flex', gap: 16, alignItems: 'center' }}>
          <i className="fas fa-exclamation-triangle" style={{ fontSize: '1.8rem' }}></i>
          <div>
            <div style={{ fontWeight: 800 }}>Terjadi Kesalahan Server</div>
            <div style={{ fontSize: '0.85rem', marginTop: 2 }}>{error}</div>
          </div>
        </div>
      ) : archives.length === 0 ? (
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 80, textAlign: 'center' }}>
          <i className="fas fa-search" style={{ fontSize: '3rem', color: '#94a3b8', marginBottom: 16 }}></i>
          <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '1.1rem' }}>Tidak Ada Data Arsip</div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: 6, maxWidth: 400, margin: '6px auto 0 auto' }}>Tidak ditemukan records arsip yang cocok dengan kata kunci pencarian Anda.</div>
        </div>
      ) : (
        <div className="table-card">
          <div className="table-card-header">
            <h6>Daftar Data Terarsip ({totalCount} antrian)</h6>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '16px 24px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>No. Antrian</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Tanggal</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Pelanggan</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Kendaraan</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Jasa Servis</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Montir</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Biaya</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '16px 24px', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: '0.9rem' }}>
                {archives.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="table-row-hover">
                    <td style={{ padding: '16px 24px', fontWeight: 800, color: '#ea580c' }}>{item.nomor_antrian}</td>
                    <td style={{ padding: '16px 24px', color: '#334155' }}>{formatTanggalIndo(item.tanggal)}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.nama_pelanggan}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>{item.no_hp || item.email}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#334155' }}>{item.kendaraan || '-'}</td>
                    <td style={{ padding: '16px 24px', color: '#475569', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={item.nama_layanan}>
                      {item.nama_layanan}
                    </td>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#4f46e5' }}>{item.nama_montir || 'Petugas'}</td>
                    <td style={{ padding: '16px 24px', fontWeight: 800, color: '#16a34a' }}>{formatRupiah(item.total_harga)}</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span className={`badge-status ${item.status?.toLowerCase() === 'selesai' ? 'badge-selesai' : 'badge-dibatalkan'}`}>
                        <i className={`fas ${item.status?.toLowerCase() === 'selesai' ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                        {item.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <button
                        onClick={() => initiateHardDelete(item.id)}
                        style={{ border: 'none', background: 'rgba(239,68,68,0.08)', color: '#ef4444', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                        className="btn-trash-hover"
                        title="Hapus Permanen Dari Database"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* PAGINATION */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>
              Menampilkan <span style={{ color: '#0f172a', fontWeight: 800 }}>{archives.length}</span> dari <span style={{ color: '#0f172a', fontWeight: 800 }}>{totalCount}</span> arsip
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
                style={{ padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700, cursor: offset === 0 ? 'not-allowed' : 'pointer', opacity: offset === 0 ? 0.5 : 1, transition: 'all 0.2s' }}
              >
                Sebelumnya
              </button>
              <button
                disabled={offset + limit >= totalCount}
                onClick={() => setOffset(offset + limit)}
                style={{ padding: '8px 16px', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.8rem', fontWeight: 700, cursor: (offset + limit >= totalCount) ? 'not-allowed' : 'pointer', opacity: (offset + limit >= totalCount) ? 0.5 : 1, transition: 'all 0.2s' }}
              >
                Selanjutnya
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Double Verification Hard Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-box" style={{ maxWidth: 460 }}>
            <div className="modal-head">
              <h5 style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#dc2626', margin: 0 }}>
                <i className="fas fa-exclamation-triangle"></i> Double-Verification Delete
              </h5>
              <button className="btn-close-modal" onClick={() => setShowDeleteModal(false)}><i className="fas fa-times"></i></button>
            </div>
            <div className="modal-body-box" style={{ padding: 24 }}>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', lineHeight: '1.6' }}>
                Tindakan ini akan **menghapus secara fisik dan permanen** data antrian dari database bengkel. Tindakan ini **tidak dapat dipulihkan** dengan cara apa pun.
              </p>
              
              <div style={{ marginTop: 20 }}>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>
                  Tulis kode keamanan berikut untuk melanjutkan:
                </label>
                <div style={{ background: '#f8fafc', padding: '10px', borderRadius: 10, textAlign: 'center', fontFamily: 'monospace', fontWeight: 800, color: '#ef4444', border: '1px dashed #fee2e2', marginBottom: 12, letterSpacing: 0.5 }}>
                  SUPER_CONFIRM_HARD_DELETE
                </div>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Masukkan token di atas..."
                  style={{ width: '100%', padding: '12px 14px', border: '1.5px solid #e2e8f0', borderRadius: 12, outline: 'none', fontFamily: 'inherit', fontSize: '0.85rem', textAlign: 'center', textTransform: 'uppercase' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                <button
                  disabled={deleting}
                  onClick={() => setShowDeleteModal(false)}
                  style={{ flex: 1, padding: '12px', background: '#f1f5f9', border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                >
                  Batal
                </button>
                <button
                  disabled={deleting || deleteConfirmText !== 'SUPER_CONFIRM_HARD_DELETE'}
                  onClick={executeHardDelete}
                  style={{ flex: 1, padding: '12px', background: '#dc2626', border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 800, color: '#fff', cursor: (deleting || deleteConfirmText !== 'SUPER_CONFIRM_HARD_DELETE') ? 'not-allowed' : 'pointer', opacity: (deleting || deleteConfirmText !== 'SUPER_CONFIRM_HARD_DELETE') ? 0.4 : 1, transition: 'all 0.2s', boxShadow: '0 8px 16px -4px rgba(220,38,38,0.25)' }}
                >
                  {deleting ? 'Memproses...' : 'Hapus Permanen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
