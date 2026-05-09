import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CONFIG from '../config';

export default function AdminLoginPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user.role !== 'admin') {
          setError('Akses ditolak. Akun ini bukan administrator.');
          return;
        }

        localStorage.setItem('antrian_token', data.token);
        localStorage.setItem('antrian_role', data.user.role);
        localStorage.setItem('antrian_user', JSON.stringify(data.user));

        navigate('/admin');
      } else {
        setError(data.message || 'Email atau password salah');
      }
    } catch {
      setError('Gagal terhubung ke server. Pastikan backend aktif.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#020617)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        {/* Logo Admin */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 20, marginBottom: 16 }}>
            <i className="fas fa-user-shield" style={{ fontSize: '1.8rem', color: '#f97316' }}></i>
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', margin: 0 }}>Portal Admin</h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: '0.9rem' }}>Akses khusus pengelola bengkel</p>
        </div>

        <div style={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 24, padding: '40px', boxShadow: '0 40px 80px rgba(0,0,0,0.5)' }}>
          {error && (
            <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid #ef4444', color: '#fca5a5', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-exclamation-triangle"></i> {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Email Admin</label>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-envelope" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}></i>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="admin@bengkel.com" required
                  style={{ width: '100%', padding: '13px 16px 13px 40px', border: '1.5px solid #334155', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.95rem', color: '#fff', background: '#0f172a', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
            </div>
            <div style={{ marginBottom: '28px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-lock" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748b' }}></i>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required
                  style={{ width: '100%', padding: '13px 16px 13px 40px', border: '1.5px solid #334155', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.95rem', color: '#fff', background: '#0f172a', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#f97316'}
                  onBlur={e => e.target.style.borderColor = '#334155'}
                />
              </div>
            </div>
            <button type="submit" disabled={isLoading}
              style={{ width: '100%', padding: '15px', background: '#f97316', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'inherit', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(249,115,22,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {isLoading ? <><span className="spinner-border spinner-border-sm" role="status"></span> Autentikasi...</> : <><i className="fas fa-sign-in-alt"></i> Masuk Dashboard</>}
            </button>
          </form>
        </div>
        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <Link to="/" style={{ color: '#475569', fontSize: '0.85rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-arrow-left"></i> Kembali ke Website Utama
          </Link>
        </div>
      </div>
    </div>
  );
}
