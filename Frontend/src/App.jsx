import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminPage from './pages/AdminPage';
import MontirPage from './pages/MontirPage';
import RiwayatServis from './pages/RiwayatServis';
import { ToastProvider } from './context/ToastContext';
import { QueryProvider } from './context/QueryProvider';

function App() {
  return (
    <ToastProvider>
      <QueryProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/archive" element={<Navigate to="/admin" />} />
            <Route path="/riwayat" element={<RiwayatServis />} />
            <Route path="/montir" element={<MontirPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </QueryProvider>
    </ToastProvider>
  );
}

export default App;
