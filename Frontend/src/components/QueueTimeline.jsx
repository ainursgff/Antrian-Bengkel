// FILE: frontend/src/components/QueueTimeline.jsx
import React from 'react';

const STATUS_ICON = {
  menunggu: { icon: 'fa-clock', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  dipanggil: { icon: 'fa-bell', color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
  sedang_dilayani: { icon: 'fa-wrench', color: '#ea580c', bg: 'rgba(234,88,12,0.12)' },
  menunggu_verifikasi_pelanggan: { icon: 'fa-user-check', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
  menunggu_sparepart: { icon: 'fa-cogs', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  revisi_servis: { icon: 'fa-redo', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  selesai: { icon: 'fa-check-circle', color: '#16a34a', bg: 'rgba(22,163,74,0.12)' },
  dibatalkan: { icon: 'fa-times-circle', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
};

const STATUS_LABEL = {
  menunggu: 'Menunggu Panggilan',
  dipanggil: 'Dipanggil ke Area Servis',
  sedang_dilayani: 'Sedang Diservis',
  menunggu_verifikasi_pelanggan: 'Menunggu Verifikasi Pelanggan',
  menunggu_sparepart: 'Menunggu Sparepart',
  revisi_servis: 'Permintaan Revisi Servis',
  selesai: 'Servis Selesai',
  dibatalkan: 'Antrian Dibatalkan',
};

const formatTime = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

export default function QueueTimeline({ logs = [], isLoading = false }) {
  if (isLoading) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center' }}>
        <i className="fas fa-spinner fa-spin" style={{ fontSize: '1.5rem', color: '#94a3b8', marginBottom: 10, display: 'block' }}></i>
        <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>Memuat timeline...</span>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div style={{ padding: '32px 0', textAlign: 'center', color: '#64748b' }}>
        <i className="fas fa-stream" style={{ fontSize: '1.5rem', color: '#cbd5e1', marginBottom: 10, display: 'block' }}></i>
        <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>Belum ada aktivitas tercatat</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      {/* Vertical line */}
      <div style={{
        position: 'absolute', left: 11, top: 8, bottom: 8, width: 2,
        background: 'linear-gradient(to bottom, #e2e8f0, #f1f5f9)',
        borderRadius: 2
      }} />

      {logs.map((log, i) => {
        const statusInfo = STATUS_ICON[log.status_baru] || { icon: 'fa-circle', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)' };
        const isLast = i === logs.length - 1;
        const actorLabel = log.actor_nama
          ? `${log.actor_nama} (${log.actor_role === 'admin' ? 'Admin' : log.actor_role === 'montir' ? 'Montir' : 'Pelanggan'})`
          : 'Sistem';

        return (
          <div key={log.id || i} style={{
            position: 'relative',
            paddingBottom: isLast ? 0 : 20,
            animation: `fadeSlideIn 0.4s ease ${i * 0.08}s both`
          }}>
            {/* Node dot */}
            <div style={{
              position: 'absolute', left: -28, top: 2,
              width: 22, height: 22, borderRadius: '50%',
              background: statusInfo.bg,
              border: `2px solid ${statusInfo.color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2,
              boxShadow: isLast ? `0 0 12px ${statusInfo.color}40` : 'none'
            }}>
              <i className={`fas ${statusInfo.icon}`} style={{ fontSize: '0.55rem', color: statusInfo.color }}></i>
            </div>

            {/* Content card */}
            <div style={{
              background: isLast ? 'rgba(15,23,42,0.03)' : '#fff',
              border: `1px solid ${isLast ? statusInfo.color + '30' : '#f1f5f9'}`,
              borderRadius: 12,
              padding: '10px 14px',
              transition: 'all 0.2s'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontSize: '0.78rem', fontWeight: 800, color: statusInfo.color,
                    display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3
                  }}>
                    <span>{STATUS_LABEL[log.status_baru] || log.status_baru}</span>
                    {isLast && (
                      <span style={{
                        fontSize: '0.6rem', background: statusInfo.color, color: '#fff',
                        padding: '1px 6px', borderRadius: 50, fontWeight: 800, letterSpacing: '0.5px'
                      }}>
                        TERKINI
                      </span>
                    )}
                  </div>
                  {log.catatan && (
                    <div style={{ fontSize: '0.73rem', color: '#475569', fontWeight: 500, lineHeight: 1.5, marginBottom: 4 }}>
                      {log.catatan}
                    </div>
                  )}
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <i className="fas fa-user-circle" style={{ fontSize: '0.7rem' }}></i>
                    {actorLabel}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#334155' }}>
                    {formatTime(log.created_at)}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 600 }}>
                    {formatDate(log.created_at)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
