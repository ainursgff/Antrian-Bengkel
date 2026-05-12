import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CONFIG from '../config';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const successMsg = location.state?.msg || '';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStatus, setForgotStatus] = useState(''); // '', 'loading', 'input_new_password', 'submitting_new_password', 'success'
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');

  const handleForgotSubmitEmail = async (e) => {
    e.preventDefault();
    setForgotStatus('loading');
    setForgotError('');
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotStatus('input_new_password');
      } else {
        setForgotError(data.error || 'Email tidak terdaftar di sistem');
        setForgotStatus('');
      }
    } catch {
      setForgotError('Gagal terhubung ke server');
      setForgotStatus('');
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotStatus('submitting_new_password');
    setForgotError('');
    try {
      const res = await fetch(`${CONFIG.API_BASE_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, password: newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setForgotStatus('success');
      } else {
        setForgotError(data.error || 'Gagal mengubah password');
        setForgotStatus('input_new_password');
      }
    } catch {
      setForgotError('Gagal terhubung ke server');
      setForgotStatus('input_new_password');
    }
  };

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
        localStorage.setItem('antrian_token', data.token);
        localStorage.setItem('antrian_role', data.user.role);
        localStorage.setItem('antrian_user', JSON.stringify(data.user));

        if (data.user.role === 'admin') navigate('/admin');
        else if (data.user.role === 'montir') navigate('/montir');
        else navigate('/');
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
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: '440px' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, background: 'rgba(249,115,22,0.15)', borderRadius: 20, marginBottom: 16 }}>
            <i className="fas fa-car-side" style={{ fontSize: '1.8rem', color: '#f97316' }}></i>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', margin: 0 }}>Selamat Datang</h1>
          <p style={{ color: '#94a3b8', marginTop: 8, fontSize: '0.95rem' }}>Masuk ke sistem antrian bengkel</p>
        </div>

        <div style={{ background: '#fff', borderRadius: 24, padding: '40px', boxShadow: '0 40px 80px rgba(0,0,0,0.3)' }}>
          {successMsg && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-check-circle"></i> {successMsg}
            </div>
          )}
          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
          {showForgot ? (
            <div style={{ animation: 'fadeIn 0.3s ease' }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 56, height: 56, background: 'rgba(249,115,22,0.1)', borderRadius: '50%', marginBottom: 16 }}>
                  <i className="fas fa-key" style={{ fontSize: '1.5rem', color: '#f97316' }}></i>
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {forgotStatus === 'input_new_password' || forgotStatus === 'submitting_new_password' ? 'Ubah Password Baru' : 'Lupa Password?'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: 8 }}>
                  {forgotStatus === 'input_new_password' || forgotStatus === 'submitting_new_password'
                    ? `Masukkan password baru Anda untuk email ${forgotEmail}`
                    : 'Masukkan email terdaftar Anda untuk memproses verifikasi dan mengubah password Anda.'}
                </p>
              </div>

              {forgotError && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: 12, marginBottom: 20, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fas fa-exclamation-circle"></i> {forgotError}
                </div>
              )}
              
              {forgotStatus === 'success' ? (
                <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', padding: '16px', borderRadius: 12, textAlign: 'center', marginBottom: 20 }}>
                  <i className="fas fa-check-circle" style={{ fontSize: '2.5rem', marginBottom: 12, color: '#16a34a' }}></i>
                  <h5 style={{ fontWeight: 800, margin: 0 }}>Sukses Diperbarui!</h5>
                  <p style={{ fontSize: '0.85rem', marginTop: 8, marginBottom: 0 }}>Password baru Anda berhasil disimpan. Silakan masuk kembali menggunakan password baru tersebut.</p>
                </div>
              ) : forgotStatus === 'input_new_password' || forgotStatus === 'submitting_new_password' ? (
                <form onSubmit={handleResetPassword}>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ position: 'relative' }}>
                      <i className="fas fa-lock" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Password Baru Anda (Min. 6 Karakter)" required
                        style={{ width: '100%', padding: '13px 16px 13px 40px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#f97316'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={forgotStatus === 'submitting_new_password'}
                    style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'inherit', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 10px 20px -5px rgba(249,115,22,0.35)' }}>
                    {forgotStatus === 'submitting_new_password' ? <span className="spinner-border spinner-border-sm" role="status"></span> : <><i className="fas fa-save"></i> Perbarui Password Baru</>}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleForgotSubmitEmail}>
                  <div style={{ marginBottom: '24px' }}>
                    <div style={{ position: 'relative' }}>
                      <i className="fas fa-envelope" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                      <input type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} placeholder="email@kamu.com" required
                        style={{ width: '100%', padding: '13px 16px 13px 40px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none' }}
                        onFocus={e => e.target.style.borderColor = '#f97316'}
                        onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                      />
                    </div>
                  </div>
                  <button type="submit" disabled={forgotStatus === 'loading'}
                    style={{ width: '100%', padding: '15px', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'inherit', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {forgotStatus === 'loading' ? <span className="spinner-border spinner-border-sm" role="status"></span> : <><i className="fas fa-shield-alt"></i> Verifikasi Email</>}
                  </button>
                </form>
              )}
              
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button type="button" onClick={() => { setShowForgot(false); setForgotStatus(''); setForgotEmail(''); setNewPassword(''); setForgotError(''); }} style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <i className="fas fa-arrow-left"></i> Kembali ke Login
                </button>
              </div>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-envelope" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@kamu.com" required
                      style={{ width: '100%', padding: '13px 16px 13px 40px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#f97316'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '28px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Password</label>
                    <button type="button" onClick={() => setShowForgot(true)} style={{ background: 'none', border: 'none', padding: 0, color: '#f97316', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}>Lupa Password?</button>
                  </div>
                  <div style={{ position: 'relative' }}>
                    <i className="fas fa-lock" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}></i>
                    <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Password kamu" required
                      style={{ width: '100%', padding: '13px 16px 13px 40px', border: '1.5px solid #e2e8f0', borderRadius: 12, fontFamily: 'inherit', fontSize: '0.95rem', outline: 'none' }}
                      onFocus={e => e.target.style.borderColor = '#f97316'}
                      onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                    />
                  </div>
                </div>
                <button type="submit" disabled={isLoading}
                  style={{ width: '100%', padding: '15px', background: 'linear-gradient(135deg,#f97316,#fb923c)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'inherit', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 10px 20px -5px rgba(249,115,22,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  {isLoading ? <><span className="spinner-border spinner-border-sm" role="status"></span> Memproses...</> : <><i className="fas fa-sign-in-alt"></i> Masuk</>}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: 24, fontSize: '0.9rem', color: '#64748b' }}>
                Belum punya akun?{' '}
                <Link to="/register" style={{ color: '#f97316', fontWeight: 700 }}>Daftar di sini</Link>
              </div>
            </>
          )}
        </div>
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <Link to="/" style={{ color: '#94a3b8', fontSize: '0.9rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <i className="fas fa-arrow-left"></i> Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
