// FILE: frontend/src/pages/RiwayatServis.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CONFIG from '../config';

const RiwayatServis = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const API_URL = CONFIG.API_BASE_URL;

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('antrian_token');
      const res = await fetch(`${API_URL}/antrian/riwayat`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal memuat riwayat servis.');
      }
      const historyList = Array.isArray(data) ? data : (data && Array.isArray(data.data) ? data.data : []);
      setHistory(historyList);
    } catch (err) {
      setError(err.message || 'Gagal memuat riwayat servis Anda.');
    } finally {
      setLoading(false);
    }
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

  const getStatusBadge = (status) => {
    const s = status?.toLowerCase();
    if (s === 'selesai') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 50,
          background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)'
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }}></span>
          Selesai
        </span>
      );
    } else if (s === 'dibatalkan') {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 50,
          background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)'
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444' }}></span>
          Dibatalkan
        </span>
      );
    } else {
      return (
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: '0.72rem', fontWeight: 800, padding: '4px 10px', borderRadius: 50,
          background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)'
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b' }}></span>
          {status}
        </span>
      );
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a, #020617)',
      color: '#f8fafc',
      padding: '40px 24px',
      fontFamily: "'Plus Jakarta Sans', sans-serif"
    }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Header Section */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: 20,
          marginBottom: 40,
          paddingBottom: 24,
          borderBottom: '1px solid rgba(51,65,85,0.4)'
        }}>
          <div>
            <h1 style={{
              margin: 0,
              fontSize: '2rem',
              fontWeight: 900,
              letterSpacing: '-0.5px',
              background: 'linear-gradient(to right, #fb923c, #fbbf24)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Riwayat Servis Kendaraan
            </h1>
            <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 500 }}>
              Pantau laporan lengkap, rincian biaya, dan catatan montir dari servis masa lalu Anda.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button
              onClick={() => navigate('/')}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 12,
                background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(71,85,105,0.4)',
                color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700,
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.background = 'rgba(30,41,59,0.8)'}
              onMouseLeave={(e) => e.target.style.background = 'rgba(30,41,59,0.5)'}
            >
              <i className="fas fa-arrow-left"></i> Kembali ke Beranda
            </button>
            <button
              onClick={fetchHistory}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 12,
                background: 'linear-gradient(135deg, #f97316, #ea580c)', border: 'none',
                color: '#fff', fontSize: '0.8rem', fontWeight: 800,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 14px rgba(234,88,12,0.3)'
              }}
            >
              <i className="fas fa-sync-alt"></i> Refresh Riwayat
            </button>
          </div>
        </div>

        {/* State Handler */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem', color: '#ea580c', marginBottom: 16 }}></i>
            <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600 }}>Menghubungkan ke server cloud...</p>
          </div>
        ) : error ? (
          <div style={{
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
            borderRadius: 16, padding: '16px 20px', color: '#ef4444',
            display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 24
          }}>
            <i className="fas fa-exclamation-circle" style={{ fontSize: '1.2rem', marginTop: 2 }}></i>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontWeight: 800, color: '#fca5a5', fontSize: '0.9rem' }}>Gagal Memuat Data</h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#fca5a5' }}>{error}</p>
            </div>
          </div>
        ) : history.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 40px',
            background: 'rgba(30,41,59,0.2)', border: '1px dashed rgba(71,85,105,0.4)',
            borderRadius: 24
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyItems: 'center',
              width: 56, height: 56, borderRadius: '50%',
              background: 'rgba(30,41,59,0.6)', border: '1px solid rgba(71,85,105,0.4)',
              color: '#64748b', fontSize: '1.5rem', marginBottom: 20,
              justifyContent: 'center', alignContent: 'center'
            }}>
              <i className="fas fa-history"></i>
            </div>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: 800, color: '#e2e8f0' }}>Belum Ada Riwayat Servis</h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.82rem', maxWidth: 360, margin: '0 auto', lineHeight: 1.5 }}>
              Semua antrian Anda yang telah selesai dikerjakan atau dibatalkan akan otomatis terekam secara permanen di sini.
            </p>
          </div>
        ) : (
          /* Cards List Grid */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {history.map((item) => (
              <div
                key={item.id}
                style={{
                  position: 'relative',
                  overflow: 'hidden',
                  borderRadius: 20,
                  background: 'rgba(30,41,59,0.3)',
                  border: '1px solid rgba(71,85,105,0.3)',
                  padding: '24px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 24,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                }}
              >
                {/* Left Section: Ticket Info & Vehicle */}
                <div style={{ flex: 1, minWidth: 280 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                    <span style={{
                      fontSize: '0.68rem', fontFamily: 'monospace', fontWeight: 800,
                      padding: '3px 8px', background: 'rgba(71,85,105,0.5)',
                      color: '#cbd5e1', borderRadius: 4, border: '1px solid rgba(71,85,105,0.4)',
                      textTransform: 'uppercase'
                    }}>
                      Ticket: {item.nomor_antrian}
                    </span>
                    {getStatusBadge(item.status)}
                    {item.origin === 'archive' && (
                      <span style={{
                        fontSize: '0.6rem', fontWeight: 800, textTransform: 'uppercase',
                        padding: '2px 6px', background: 'rgba(30,41,59,0.8)',
                        color: '#64748b', border: '1px solid rgba(71,85,105,0.2)', borderRadius: 4
                      }}>
                        Archived
                      </span>
                    )}
                  </div>
                  
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '1.25rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <i className="fas fa-car" style={{ color: '#f97316' }}></i>
                    {item.kendaraan || 'Kendaraan Tidak Tercatat'}
                  </h3>

                  <div style={{
                    fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600,
                    background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(51,65,85,0.4)',
                    padding: '10px 14px', borderRadius: 10, display: 'flex', gap: 6
                  }}>
                    <span style={{ color: '#64748b' }}>Layanan:</span>
                    <span style={{ color: '#f8fafc' }}>{item.nama_layanan || 'Servis Khusus'}</span>
                  </div>

                  {/* Operational Details Footer */}
                  <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 16, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(51,65,85,0.3)'
                  }}>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Tanggal</span>
                      <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, marginTop: 4, display: 'block' }}>
                        {formatTanggalIndo(item.tanggal)}
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Mulai Servis</span>
                      <span style={{ color: '#cbd5e1', fontSize: '0.8rem', fontWeight: 700, marginTop: 4, display: 'block' }}>
                        {item.slot_waktu ? item.slot_waktu.substring(0, 5) : '--:--'} WIB
                      </span>
                    </div>
                    <div>
                      <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', letterSpacing: '0.5px' }}>Montir Petugas</span>
                      <span style={{ color: '#fb923c', fontSize: '0.8rem', fontWeight: 800, marginTop: 4, display: 'block' }}>
                        <i className="fas fa-wrench" style={{ marginRight: 6, fontSize: '0.75rem' }}></i>
                        {item.nama_montir || 'Petugas Bengkel'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Section: Invoice & Notes */}
                <div style={{
                  width: '100%', maxWidth: 280,
                  background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(51,65,85,0.4)',
                  borderRadius: 14, padding: '16px', display: 'flex', flexDirection: 'column',
                  justifyContent: 'space-between', gap: 16
                }}>
                  <div>
                    <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: 6, letterSpacing: '0.5px' }}>Catatan Pengerjaan</span>
                    <p style={{ margin: 0, fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.5, fontStyle: 'italic', background: 'rgba(15,23,42,0.2)', padding: 10, borderRadius: 8, border: '1px solid rgba(51,65,85,0.2)' }}>
                      {item.catatan ? `"${item.catatan}"` : '"Servis standar berkala berjalan lancar tanpa kendala teknis."'}
                    </p>
                  </div>

                  <div style={{ paddingTop: 12, borderTop: '1px solid rgba(51,65,85,0.3)' }}>
                    <span style={{ color: '#64748b', fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: 2, letterSpacing: '0.5px' }}>Total Biaya Jasa</span>
                    <span style={{
                      fontSize: '1.4rem', fontWeight: 900,
                      background: 'linear-gradient(to right, #fb923c, #f59e0b)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent'
                    }}>
                      {formatRupiah(item.total_harga)}
                    </span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};

export default RiwayatServis;
