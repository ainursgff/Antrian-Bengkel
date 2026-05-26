// FILE: frontend/src/components/Sidebar.jsx
import React from 'react';

const MENU_GROUPS = [
  {
    title: 'DASHBOARD',
    items: [
      { id: 'dashboard', label: 'Ringkasan Operasional', icon: 'fa-chart-line' },
    ]
  },
  {
    title: 'OPERASIONAL',
    items: [
      { id: 'antrian', label: 'Antrian Hari Ini', icon: 'fa-list-ol' },
      { id: 'pending', label: 'Kendaraan Pending', icon: 'fa-exclamation-circle' },
    ]
  },
  {
    title: 'MANAJEMEN',
    items: [
      { id: 'layanan', label: 'Layanan & Kategori', icon: 'fa-wrench' },
      { id: 'jadwal', label: 'Kapasitas Operasional', icon: 'fa-calendar-alt' },
      { id: 'pengguna', label: 'Manajemen Pengguna', icon: 'fa-users' },
    ]
  },
  {
    title: 'HISTORI & ANALITIK',
    items: [
      { id: 'archive', label: 'Arsip Operasional', icon: 'fa-archive' },
      { id: 'laporan', label: 'Laporan & Analitik', icon: 'fa-chart-pie' },
    ]
  },
  {
    title: 'SISTEM',
    items: [
      { id: 'audit', label: 'Audit Log', icon: 'fa-history' },
      { id: 'pengaturan', label: 'Pengaturan', icon: 'fa-cog' },
    ]
  }
];

export default function Sidebar({ activeTab, onTabChange, onLogout, user = {} }) {
  return (
    <aside style={{ width: 280, background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', color: '#fff', display: 'flex', flexDirection: 'column', height: '100vh', position: 'sticky', top: 0, overflowY: 'auto', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
      {/* BRAND HEADER */}
      <div style={{ padding: '24px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(249,115,22,0.3)' }}>
          <i className="fas fa-wrench" style={{ color: '#fff', fontSize: '1.2rem' }}></i>
        </div>
        <div>
          <h4 style={{ margin: 0, fontWeight: 900, fontSize: '1.1rem', letterSpacing: '0.5px' }}>BENGKELKU</h4>
          <span style={{ fontSize: '0.68rem', color: '#f97316', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Control Center</span>
        </div>
      </div>

      {/* USER PROFILE INFO */}
      <div style={{ padding: '20px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 800 }}>
          {user.nama ? user.nama.charAt(0).toUpperCase() : 'A'}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 800, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{user.nama || 'Administrator'}</div>
          <div style={{ fontSize: '0.68rem', color: '#94a3b8', marginTop: 1 }}>{user.email || 'admin@bengkelku.com'}</div>
        </div>
      </div>

      {/* NAV LIST */}
      <div style={{ flex: 1, padding: '24px 16px' }}>
        {MENU_GROUPS.map((group, gIdx) => (
          <div key={gIdx} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 900, color: '#64748b', paddingLeft: 12, marginBottom: 8, letterSpacing: '1.5px' }}>
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {group.items.map(item => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onTabChange(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: 'none',
                      background: isActive ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)' : 'transparent',
                      color: isActive ? '#fff' : '#94a3b8',
                      fontSize: '0.85rem',
                      fontWeight: isActive ? 800 : 700,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      boxShadow: isActive ? '0 4px 12px rgba(234,88,12,0.25)' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = '#94a3b8';
                        e.currentTarget.style.background = 'transparent';
                      }
                    }}
                  >
                    <i className={`fas ${item.icon}`} style={{ width: 18, textAlign: 'center', fontSize: '0.92rem' }}></i>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* LOGOUT BUTTON */}
      <div style={{ padding: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <button
          onClick={onLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            width: '100%',
            padding: '12px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.02)',
            color: '#ef4444',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
            e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
          }}
        >
          <i className="fas fa-sign-out-alt"></i>
          Keluar Sistem
        </button>
      </div>
    </aside>
  );
}
