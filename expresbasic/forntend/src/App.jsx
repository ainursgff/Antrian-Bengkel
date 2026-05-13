import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import ParticlesComponent from './components/ParticlesComponent';
import Login from './pages/Login';
import Register from './pages/Register';
import Kategori from './pages/Kategori';
import Produk from './pages/Produk';
import Home from './pages/Home';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  return (
    <Router>
      <div className="dashboard-container" style={{ position: 'relative', minHeight: '100vh' }}>
        <ParticlesComponent id="tsparticles" />
        <Navigation token={token} onLogout={handleLogout} />
        
        <Routes>
          <Route path="/" element={<Navigate to={token ? "/home" : "/login"} replace />} />
          <Route path="/home" element={token ? <Home /> : <Navigate to="/login" replace />} />
          <Route path="/login" element={!token ? <Login setToken={setToken} /> : <Navigate to="/home" replace />} />
          <Route path="/register" element={!token ? <Register /> : <Navigate to="/home" replace />} />
          <Route path="/kategori" element={token ? <Kategori /> : <Navigate to="/login" replace />} />
          <Route path="/produk" element={token ? <Produk /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
