// FILE: frontend/src/components/OperationalAlertPanel.jsx
import React from 'react';

export default function OperationalAlertPanel({ antrian = [], pengguna = [] }) {
  const activeQueues = antrian.filter(a => ['menunggu', 'dipanggil', 'sedang_dilayani'].includes(a.status));
  const waitingQueues = antrian.filter(a => a.status === 'menunggu');
  const montirs = pengguna.filter(p => p.role === 'montir' && p.is_aktif === 1);

  // 1. Overload Trigger
  const isOverloaded = waitingQueues.length > 5;

  // 2. SLA Delayed (waiting for > 20 mins)
  const delayedQueues = waitingQueues.filter(a => {
    const diffMs = new Date() - new Date(a.created_at || a.updated_at);
    const diffMins = diffMs / 1000 / 60;
    return diffMins > 20; // 20 minutes SLA threshold
  });

  // 3. Pending Issues (sparepart or verification)
  const pendingIssueQueues = antrian.filter(a => 
    ['menunggu_sparepart', 'menunggu_verifikasi_pelanggan', 'revisi_servis'].includes(a.status)
  );

  // 4. Idle Mechanics (FREE and no active serving)
  const idleMontirs = montirs.filter(m => 
    !antrian.some(a => a.montir_id === m.id && a.status === 'sedang_dilayani')
  );

  const hasAlerts = isOverloaded || delayedQueues.length > 0 || pendingIssueQueues.length > 0 || (idleMontirs.length > 0 && activeQueues.length > 0);

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.015)' }}>
      <h6 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: hasAlerts ? '#ef4444' : '#10b981', display: 'inline-block', boxShadow: hasAlerts ? '0 0 10px #ef4444' : '0 0 10px #10b981' }}></span>
        Operational Alerts ({isOverloaded ? 1 : 0 + delayedQueues.length + pendingIssueQueues.length + (idleMontirs.length > 0 && activeQueues.length > 0 ? 1 : 0)})
      </h6>

      {!hasAlerts ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', textAlign: 'center' }}>
          <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '2rem', marginBottom: 8 }}></i>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Kondisi Operasional Prima</span>
          <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>Tidak ada masalah SLA, sparepart, atau overload antrian.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
          {/* Overload Alert */}
          {isOverloaded && (
            <div style={{ display: 'flex', gap: 12, background: '#fef2f2', border: '1px solid #fee2e2', padding: 12, borderRadius: 12 }}>
              <i className="fas fa-exclamation-triangle" style={{ color: '#ef4444', fontSize: '1.1rem', marginTop: 2 }}></i>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#991b1b' }}>Antrean Overload!</div>
                <div style={{ fontSize: '0.73rem', color: '#b91c1c', marginTop: 1 }}>Ada {waitingQueues.length} antrean menunggu. Pertimbangkan tambah montir cadangan.</div>
              </div>
            </div>
          )}

          {/* SLA Warning */}
          {delayedQueues.map(q => (
            <div key={q.id} style={{ display: 'flex', gap: 12, background: '#fffbeb', border: '1px solid #fef3c7', padding: 12, borderRadius: 12 }}>
              <i className="fas fa-clock" style={{ color: '#d97706', fontSize: '1.1rem', marginTop: 2 }}></i>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#92400e' }}>Keterlambatan SLA!</div>
                <div style={{ fontSize: '0.73rem', color: '#b45309', marginTop: 1 }}>
                  Antrean <strong style={{ fontWeight: 800 }}>{q.nomor_antrian}</strong> ({q.kendaraan}) telah menunggu lebih dari 20 menit.
                </div>
              </div>
            </div>
          ))}

          {/* Pending Sparepart / Verification Issue */}
          {pendingIssueQueues.map(q => (
            <div key={q.id} style={{ display: 'flex', gap: 12, background: '#eff6ff', border: '1px solid #dbeafe', padding: 12, borderRadius: 12 }}>
              <i className="fas fa-info-circle" style={{ color: '#3b82f6', fontSize: '1.1rem', marginTop: 2 }}></i>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1e40af' }}>Servis Tertunda (Pending)</div>
                <div style={{ fontSize: '0.73rem', color: '#1d4ed8', marginTop: 1 }}>
                  Antrean <strong style={{ fontWeight: 800 }}>{q.nomor_antrian}</strong> pending status: <span style={{ textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 800 }}>{q.status.replace(/_/g, ' ')}</span>.
                </div>
              </div>
            </div>
          ))}

          {/* Idle Mechanic Warning */}
          {idleMontirs.length > 0 && activeQueues.length > 0 && (
            <div style={{ display: 'flex', gap: 12, background: '#f8fafc', border: '1px solid #e2e8f0', padding: 12, borderRadius: 12 }}>
              <i className="fas fa-user-clock" style={{ color: '#64748b', fontSize: '1.1rem', marginTop: 2 }}></i>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 800, color: '#334155' }}>Montir Idle Terlalu Lama</div>
                <div style={{ fontSize: '0.73rem', color: '#475569', marginTop: 1 }}>
                  Ada {idleMontirs.length} montir siap kerja, sementara ada {waitingQueues.length} antrean menunggu. Lakukan penugasan cepat!
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
