// FILE: frontend/src/components/ConfirmModal.jsx
import React, { useEffect, useRef } from 'react';

/**
 * Premium Global Confirmation Modal
 * Dark glassmorphism design with contextual icons, animated entry/exit,
 * and human-readable action descriptions.
 */
const ConfirmModal = ({
  isOpen,
  title,
  message,
  detail,          // Optional secondary detail line
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  onConfirm,
  onCancel,
  type = 'warning', // 'warning' | 'danger' | 'success' | 'info' | 'recall'
  isProcessing = false
}) => {
  const overlayRef = useRef(null);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e) => {
      if (e.key === 'Escape' && onCancel) onCancel();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const themes = {
    warning: {
      accent: '#f59e0b',
      accentBg: 'rgba(245,158,11,0.12)',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
      icon: 'fa-exclamation-triangle',
      shadow: 'rgba(245,158,11,0.2)',
    },
    danger: {
      accent: '#ef4444',
      accentBg: 'rgba(239,68,68,0.12)',
      gradient: 'linear-gradient(135deg, #ef4444, #dc2626)',
      icon: 'fa-trash-alt',
      shadow: 'rgba(239,68,68,0.2)',
    },
    success: {
      accent: '#16a34a',
      accentBg: 'rgba(22,163,74,0.12)',
      gradient: 'linear-gradient(135deg, #16a34a, #15803d)',
      icon: 'fa-check-circle',
      shadow: 'rgba(22,163,74,0.2)',
    },
    info: {
      accent: '#f59e0b',
      accentBg: 'rgba(245,158,11,0.15)',
      gradient: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
      icon: 'fa-info-circle',
      shadow: 'rgba(245,158,11,0.2)',
    },
    recall: {
      accent: '#7c3aed',
      accentBg: 'rgba(124,58,237,0.12)',
      gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      icon: 'fa-volume-up',
      shadow: 'rgba(124,58,237,0.2)',
    },
    serve: {
      accent: '#ea580c',
      accentBg: 'rgba(234,88,12,0.12)',
      gradient: 'linear-gradient(135deg, #ea580c, #c2410c)',
      icon: 'fa-wrench',
      shadow: 'rgba(234,88,12,0.2)',
    },
  };

  const theme = themes[type] || themes.warning;

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current && onCancel) onCancel(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 99999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'cmOverlayIn 0.25s ease',
      }}
    >
      <div style={{
        background: 'linear-gradient(145deg, rgba(15,23,42,0.97), rgba(30,41,59,0.97))',
        border: '1px solid rgba(71,85,105,0.3)',
        borderRadius: 20,
        maxWidth: 420, width: '100%',
        padding: 0,
        boxShadow: `0 25px 60px rgba(0,0,0,0.5), 0 0 30px ${theme.shadow}`,
        overflow: 'hidden',
        animation: 'cmCardIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        {/* Accent bar */}
        <div style={{ height: 3, background: theme.gradient }} />

        <div style={{ padding: '28px 28px 24px' }}>
          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 56, height: 56, borderRadius: 16,
              background: theme.accentBg,
              marginBottom: 6,
            }}>
              <i className={`fas ${theme.icon}`} style={{
                fontSize: '1.4rem', color: theme.accent,
                animation: type === 'danger' ? 'cmPulse 2s infinite' : 'none'
              }}></i>
            </div>

            <h3 style={{
              margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 900,
              color: '#f1f5f9', letterSpacing: '-0.3px', lineHeight: 1.3,
            }}>
              {title}
            </h3>

            <p style={{
              margin: 0, fontSize: '0.82rem', color: '#94a3b8',
              lineHeight: 1.6, fontWeight: 500,
            }}>
              {message}
            </p>

            {detail && (
              <div style={{
                marginTop: 12, padding: '10px 14px',
                background: 'rgba(71,85,105,0.15)',
                border: '1px solid rgba(71,85,105,0.2)',
                borderRadius: 10, textAlign: 'left',
              }}>
                <p style={{
                  margin: 0, fontSize: '0.75rem', color: '#cbd5e1',
                  lineHeight: 1.6, fontWeight: 500,
                }}>
                  {detail}
                </p>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onCancel}
              disabled={isProcessing}
              style={{
                flex: 1, padding: '11px 16px', borderRadius: 12,
                background: 'rgba(15,23,42,0.6)',
                border: '1px solid rgba(71,85,105,0.3)',
                color: '#94a3b8', fontSize: '0.8rem', fontWeight: 700,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                opacity: isProcessing ? 0.5 : 1,
              }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.target.style.background = 'rgba(30,41,59,0.8)';
                  e.target.style.color = '#e2e8f0';
                }
              }}
              onMouseLeave={(e) => {
                e.target.style.background = 'rgba(15,23,42,0.6)';
                e.target.style.color = '#94a3b8';
              }}
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              disabled={isProcessing}
              style={{
                flex: 1, padding: '11px 16px', borderRadius: 12,
                background: theme.gradient,
                border: 'none',
                color: '#fff', fontSize: '0.8rem', fontWeight: 800,
                cursor: isProcessing ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 4px 16px ${theme.shadow}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                opacity: isProcessing ? 0.7 : 1,
              }}
            >
              {isProcessing ? (
                <>
                  <i className="fas fa-spinner fa-spin" style={{ fontSize: '0.75rem' }}></i>
                  Memproses...
                </>
              ) : (
                confirmText
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cmOverlayIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes cmCardIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cmPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ConfirmModal;
