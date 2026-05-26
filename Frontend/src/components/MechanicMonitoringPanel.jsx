// FILE: frontend/src/components/MechanicMonitoringPanel.jsx
import React from 'react';

export default function MechanicMonitoringPanel({ pengguna = [], antrian = [], onAssignQuick }) {
  const montirs = pengguna.filter(p => p.role === 'montir' && p.is_aktif === 1);

  const getMontirWorkload = (montirId) => {
    // Active servings today
    const serving = antrian.filter(a => a.montir_id === montirId && a.status === 'sedang_dilayani');
    // Completed today
    const completed = antrian.filter(a => a.montir_id === montirId && a.status === 'selesai');
    // Pending spareparts today
    const pending = antrian.filter(a => a.montir_id === montirId && a.status === 'menunggu_sparepart');

    const activeCount = serving.length;
    const totalToday = serving.length + completed.length + pending.length;

    let status = 'FREE';
    let cls = 'badge-success';
    let style = { background: '#dcfce7', color: '#15803d' };
    let workloadPercentage = 0;

    if (activeCount > 0) {
      status = 'SIBUK';
      style = { background: '#ffedd5', color: '#ea580c' };
      workloadPercentage = Math.min(100, activeCount * 50); // Each active serving is 50% load
    }
    if (activeCount >= 2) {
      status = 'OVERLOAD';
      style = { background: '#fee2e2', color: '#b91c1c' };
      workloadPercentage = 100;
    }

    return {
      status,
      style,
      workloadPercentage,
      activeQueues: serving,
      completedCount: completed.length,
      totalToday
    };
  };

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.015)' }}>
      <h6 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <i className="fas fa-users-cog" style={{ color: '#f97316' }}></i>
        Monitoring Montir & Workload ({montirs.length})
      </h6>

      {montirs.length === 0 ? (
        <div style={{ padding: '24px 0', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
          Tidak ada montir aktif terdaftar dalam sistem.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {montirs.map(m => {
            const metrics = getMontirWorkload(m.id);
            return (
              <div key={m.id} style={{ border: '1px solid #f1f5f9', borderRadius: 12, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>{m.nama}</span>
                    <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: 2 }}>
                      Selesai: {metrics.completedCount} antrean hari ini
                    </div>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 900, padding: '4px 10px', borderRadius: 50, ...metrics.style }}>
                    {metrics.status}
                  </span>
                </div>

                {/* Progress workload bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748b', marginBottom: 4 }}>
                    <span>Workload</span>
                    <span>{metrics.workloadPercentage}%</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ 
                      width: `${metrics.workloadPercentage}%`, 
                      height: '100%', 
                      background: metrics.status === 'FREE' ? '#10b981' : metrics.status === 'SIBUK' ? '#f97316' : '#ef4444',
                      borderRadius: 4,
                      transition: 'width 0.4s ease'
                    }}></div>
                  </div>
                </div>

                {/* Active Assignment Info */}
                {metrics.activeQueues.length > 0 ? (
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 4 }}>
                    {metrics.activeQueues.map(aq => (
                      <span key={aq.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 6, padding: '3px 8px', fontSize: '0.72rem', fontWeight: 700, color: '#1e293b' }}>
                        <i className="fas fa-motorcycle" style={{ color: '#64748b' }}></i>
                        {aq.nomor_antrian} ({aq.kendaraan})
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>Siap menerima kendaraan</span>
                    {onAssignQuick && (
                      <button 
                        onClick={() => onAssignQuick(m)}
                        style={{ border: 'none', background: 'rgba(249,115,22,0.1)', color: '#f97316', padding: '4px 8px', borderRadius: 6, fontSize: '0.7rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      >
                        <i className="fas fa-plus-circle"></i> Quick Assign
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
