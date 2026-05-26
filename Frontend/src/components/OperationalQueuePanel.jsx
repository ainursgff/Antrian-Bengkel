// FILE: frontend/src/components/OperationalQueuePanel.jsx
import React from 'react';

const STATUS_MAP = {
  menunggu: { label: 'Menunggu', cls: 'badge-menunggu', icon: 'fa-clock' },
  dipanggil: { label: 'Dipanggil', cls: 'badge-dipanggil', icon: 'fa-bell' },
  sedang_dilayani: { label: 'Sedang Diservis', cls: 'badge-sedang_dilayani', icon: 'fa-wrench' },
  menunggu_sparepart: { label: 'Pending Sparepart', cls: 'badge-dibatalkan', icon: 'fa-spinner fa-spin' },
  menunggu_verifikasi_pelanggan: { label: 'Persetujuan Pelanggan', cls: 'badge-dipanggil', icon: 'fa-user-check' },
  revisi_servis: { label: 'Revisi Servis', cls: 'badge-dibatalkan', icon: 'fa-redo' },
  selesai: { label: 'Selesai', cls: 'badge-selesai', icon: 'fa-check-circle' },
  dibatalkan: { label: 'Dibatalkan', cls: 'badge-dibatalkan', icon: 'fa-times-circle' },
};

export default function OperationalQueuePanel({ antrian = [], onAction, onAssignQuick }) {
  const activeQueues = antrian.filter(a => ['menunggu', 'dipanggil', 'sedang_dilayani'].includes(a.status));

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.015)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h6 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <i className="fas fa-satellite-dish" style={{ color: '#ea580c' }}></i>
          Real-Time Active Queue ({activeQueues.length})
        </h6>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', fontWeight: 800, color: '#16a34a', background: '#dcfce7', padding: '3px 10px', borderRadius: 50 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', animation: 'pulse 1.5s infinite', display: 'inline-block' }}></span>
          Live Sync Active
        </span>
      </div>

      {activeQueues.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b' }}>
          <i className="fas fa-clipboard-list" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: 12, display: 'block' }}></i>
          <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>Antrean Aktif Kosong</span>
          <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0 0' }}>Tidak ada kendaraan sedang mengantre atau dilayani saat ini.</p>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>No.</th>
                <th style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Pelanggan & Unit</th>
                <th style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Jasa Servis</th>
                <th style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Assign Montir</th>
                <th style={{ padding: '12px 16px', fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {activeQueues.map(a => {
                const sMap = STATUS_MAP[a.status] || { label: a.status, cls: 'badge-menunggu', icon: 'fa-clock' };
                return (
                  <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }} className="table-row-hover">
                    <td style={{ padding: '12px 16px', fontWeight: 800, color: '#ea580c' }}>{a.nomor_antrian}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem' }}>{a.nama_pelanggan || 'Guest'}</div>
                      <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: 1 }}>{a.kendaraan}</div>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>{a.nama_layanan || 'Servis Umum'}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {a.nama_montir ? (
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#4f46e5' }}>
                          <i className="fas fa-user-cog" style={{ marginRight: 6 }}></i>
                          {a.nama_montir}
                        </span>
                      ) : (
                        <span style={{ color: '#ef4444', fontSize: '0.72rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <i className="fas fa-user-slash"></i> Belum Ditugaskan
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span className={`badge-status ${sMap.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', padding: '3px 8px', borderRadius: 50 }}>
                        <i className={`fas ${sMap.icon}`}></i>
                        {sMap.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
