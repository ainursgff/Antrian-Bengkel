// FILE: CustomerInsightCard.jsx
import React, { useState } from 'react';

export default function CustomerInsightCard({ customer, onToggleBlacklist, onViewHistory, onEdit, onDelete }) {
  const [loadingHistory, setLoadingHistory] = useState(false);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Belum Pernah';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="customer-card fade-in" style={{
      background: '#fff',
      border: '1px solid #e2e8f0',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      gap: '20px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    }}>
      {/* Decorative loyalty background glow */}
      <div style={{
        position: 'absolute',
        top: '-50px',
        right: '-50px',
        width: '120px',
        height: '120px',
        borderRadius: '50%',
        background: customer.total_servis >= 10 ? 'rgba(168, 85, 247, 0.05)' : customer.total_servis >= 5 ? 'rgba(234, 179, 8, 0.05)' : 'rgba(59, 130, 246, 0.05)',
        filter: 'blur(20px)',
        zIndex: 0
      }}></div>

      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Card Header: Name & Loyalty Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h4 style={{ margin: 0, fontWeight: 800, color: '#0f172a', fontSize: '1.15rem' }}>{customer.nama}</h4>
            <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
              <i className="far fa-envelope"></i> {customer.email}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
              <i className="fas fa-phone-alt"></i> {customer.no_hp || '-'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
            <span style={{
              padding: '6px 12px',
              borderRadius: '50px',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              background: customer.total_servis >= 10 ? '#f3e8ff' : customer.total_servis >= 5 ? '#fef9c3' : '#dbeafe',
              color: customer.total_servis >= 10 ? '#7e22ce' : customer.total_servis >= 5 ? '#a16207' : '#1d4ed8',
              border: '1px solid currentColor'
            }}>
              {customer.loyalty}
            </span>
            {onEdit && onDelete && (
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  onClick={onEdit}
                  style={{
                    border: 'none',
                    background: '#f1f5f9',
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}
                  title="Edit Profil Pengguna"
                  onMouseEnter={e => e.currentTarget.style.background = '#e2e8f0'}
                  onMouseLeave={e => e.currentTarget.style.background = '#f1f5f9'}
                >
                  <i className="fas fa-edit" style={{ color: '#475569', fontSize: '0.85rem' }}></i>
                </button>
                <button
                  onClick={onDelete}
                  style={{
                    border: 'none',
                    background: '#fef2f2',
                    width: '30px',
                    height: '30px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'background 0.2s'
                  }}
                  title="Hapus / Nonaktifkan Pengguna"
                  onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
                  onMouseLeave={e => e.currentTarget.style.background = '#fef2f2'}
                >
                  <i className="fas fa-trash-alt" style={{ color: '#ef4444', fontSize: '0.85rem' }}></i>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Operational Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          background: '#f8fafc',
          padding: '16px',
          borderRadius: '12px',
          border: '1px solid #f1f5f9',
          marginBottom: '16px'
        }}>
          <div>
            <small style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Kunjungan</small>
            <strong style={{ fontSize: '1rem', color: '#0f172a' }}>{customer.total_servis}x Servis</strong>
          </div>
          <div>
            <small style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Transaksi</small>
            <strong style={{ fontSize: '1rem', color: '#16a34a' }}>{formatRupiah(customer.total_transaksi)}</strong>
          </div>
          <div style={{ gridColumn: '1 / -1', borderTop: '1px solid #e2e8f0', paddingTop: '8px', marginTop: '4px' }}>
            <small style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Kendaraan Terakhir</small>
            <strong style={{ fontSize: '0.9rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <i className="fas fa-motorcycle" style={{ color: '#f97316' }}></i> {customer.kendaraan_terakhir}
            </strong>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <small style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Kunjungan Terakhir</small>
            <strong style={{ fontSize: '0.9rem', color: '#334155' }}>
              <i className="far fa-calendar-alt"></i> {formatDate(customer.terakhir_datang)}
            </strong>
          </div>
        </div>
      </div>

      {/* Action Buttons & Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid #f1f5f9',
        paddingTop: '16px',
        zIndex: 1
      }}>
        {/* Blacklist Toggle Switch */}
        <button
          onClick={() => onToggleBlacklist(customer.id, !customer.is_blacklist)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: customer.is_blacklist ? '#ef4444' : '#64748b',
            transition: 'color 0.2s'
          }}
        >
          <i className={`fas ${customer.is_blacklist ? 'fa-ban' : 'fa-check-circle'}`} style={{ fontSize: '1.05rem' }}></i>
          {customer.is_blacklist ? '🚫 BLACKLISTED' : '🟢 AKTIF'}
        </button>

        {/* Quick History Button */}
        <button
          onClick={() => onViewHistory(customer)}
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            color: '#2563eb',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '50px',
            fontSize: '0.8rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#2563eb';
            e.currentTarget.style.color = '#fff';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(59, 130, 246, 0.08)';
            e.currentTarget.style.color = '#2563eb';
          }}
        >
          <i className="fas fa-history"></i> Riwayat
        </button>
      </div>
    </div>
  );
}
