import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CONFIG from '../config';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: '', email: '', password: '', no_hp: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setShowSuccessModal(true);
      } else {
        setError(data.error || 'Gagal mendaftar');
      }
    } catch {
      setError('Gagal terhubung ke server. Pastikan backend aktif.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'rgba(249,115,22,0.15)', borderRadius: 20, marginBottom: 16 }}>
              <i className="fas fa-car-side" style={{ fontSize: '1.8rem', color: '#f97316' }}></i>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0 }}>Daftar Akun</h1>
            <p style={{ color: '#94a3b8', marginTop: 8, fontSize: '0.95rem' }}>Buat akun untuk mulai ambil antrian</p>
          </div>

          <div style={{ background: '#fff', borderRadius: 24, padding: '40px', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              {[
                { label: 'Nama Lengkap', key: 'nama', type: 'text', icon: 'fa-user', placeholder: 'Nama kamu' },
                { label: 'Email', key: 'email', type: 'email', icon: 'fa-envelope', placeholder: 'email@kamu.com' },
                { label: 'Nomor HP (WhatsApp)', key: 'no_hp', type: 'tel', icon: 'fa-phone', placeholder: '0812xxxx' },
                { label: 'Password', key: 'password', type: 'password', icon: 'fa-lock', placeholder: 'Minimal 6 karakter' },
              ].map(f => (
                <div key={f.key} style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>{f.label}</label>
                  <div style={{ position: 'relative' }}>
                    <i className={`fas ${f.icon}`} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      required={f.key !== 'no_hp'}
                      style={{ width: '100%', padding: '13px 16px 13px 40px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.95rem', color: '#0f172a', background: '#f8fafc', outline: 'none', transition: 'border-color 0.3s' }}
                      onFocus={e => e.target.style.borderColor = '#f97316'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>
              ))}
              <button type="submit" disabled={isLoading} style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'inherit', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(249,115,22,0.35)', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                {isLoading ? <><span className="spinner-border spinner-border-sm" role="status"></span> Memproses...</> : <><i className="fas fa-user-plus"></i> Buat Akun</>}
              </button>
            </form>
            <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: '#64748b' }}>
              Sudah punya akun?{' '}
              <Link to="/login" style={{ color: '#f97316', fontWeight: 700 }}>Masuk di sini</Link>
            </div>
          </div>
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Link to="/" style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <i className="fas fa-arrow-left"></i> Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>

      {/* MODAL: SUKSES PENDAFTARAN */}
      {showSuccessModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 28, padding: '40px 32px', maxWidth: '440px', width: '100%', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', animation: 'fadeInScale 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
            <style>
              {`
                @keyframes fadeInScale {
                  from { opacity: 0; transform: scale(0.9); }
                  to { opacity: 1; transform: scale(1); }
                }
              `}
            </style>
            <div style={{ width: 88, height: 88, borderRadius: '50%', background: '#f0fdf4', color: '#16a34a', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.8rem', marginBottom: 24, boxShadow: '0 10px 25px -5px rgba(22,163,74,0.2)' }}>
              <i className="fas fa-check-circle"></i>
            </div>
            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0f172a', marginBottom: 12 }}>Pendaftaran Berhasil!</h3>
            <p style={{ color: '#64748b', fontSize: '0.98rem', lineHeight: 1.6, marginBottom: 32 }}>
              Selamat! Akun Anda atas nama <strong style={{ color: '#0f172a' }}>{form.nama}</strong> telah resmi terdaftar. Silakan masuk untuk mulai mengambil nomor antrian.
            </p>
            <button 
              onClick={() => navigate('/login', { state: { msg: 'Akun berhasil dibuat! Silakan login.' } })}
              style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', border: 'none', borderRadius: 16, fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 25px -5px rgba(249,115,22,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <i className="fas fa-sign-in-alt"></i> Masuk ke Akun Sekarang
            </button>
          </div>
        </div>
      )}
    </>
  );
}
