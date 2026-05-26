// FILE: frontend/src/pages/AdminPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import CONFIG from '../config';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { useQuery } from '../context/QueryProvider';
import ArsipOperasional from './ArsipOperasional';
import Sidebar from '../components/Sidebar';
import OperationalQueuePanel from '../components/OperationalQueuePanel';
import MechanicMonitoringPanel from '../components/MechanicMonitoringPanel';
import OperationalAlertPanel from '../components/OperationalAlertPanel';
import CustomerInsightCard from '../components/CustomerInsightCard';
import MechanicOperationalCard from '../components/MechanicOperationalCard';
import QueueTimeline from '../components/QueueTimeline';

import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const STATUS_MAP = {
  menunggu: { label: 'Menunggu', cls: 'badge-menunggu', icon: 'fa-clock' },
  dipanggil: { label: 'Dipanggil', cls: 'badge-dipanggil', icon: 'fa-bell' },
  sedang_dilayani: { label: 'Sedang Diservis', cls: 'badge-sedang_dilayani', icon: 'fa-wrench' },
  menunggu_sparepart: { label: 'Pending Sparepart', cls: 'badge-dibatalkan', icon: 'fa-spinner fa-spin' },
  menunggu_verifikasi_pelanggan: { label: 'Persetujuan Pelanggan', cls: 'badge-dipanggil', icon: 'fa-user-check' },
  revisi_servis: { label: 'Revisi Servis', cls: 'badge-dibatalkan', icon: 'fa-redo' },
  selesai: { label: 'Selesai', cls: 'badge-selesai', icon: 'fa-check-circle' },
  dibatalkan: { label: 'Dibatalkan', cls: 'badge-dibatalkan', icon: 'fa-times-circle' },
};

const HARI = ['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'];

export default function AdminPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { query, fetchWithRetry, invalidateQuery } = useQuery();

  const token = localStorage.getItem('antrian_token');
  const authH = { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' };
  const user = JSON.parse(localStorage.getItem('antrian_user') || '{}');

  const formatTanggalIndo = (tglStr) => {
    if (!tglStr) return '-';
    try {
      const d = new Date(tglStr);
      if (isNaN(d.getTime())) return tglStr.substring(0, 10);
      
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(today.getDate() - 1);
      
      const months = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
      
      const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
      
      if (isSameDay(d, today)) {
        return 'Hari ini';
      } else if (isSameDay(d, yesterday)) {
        return 'Kemarin';
      } else {
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
      }
    } catch { return tglStr.substring(0, 10); }
  };

  const [tab, setTab] = useState('dashboard');
  const [syncInterval, setSyncInterval] = useState(() => {
    return parseInt(localStorage.getItem('admin_sync_interval') || '10000');
  });
  const [enableTTS, setEnableTTS] = useState(() => {
    return localStorage.getItem('admin_enable_tts') !== 'false';
  });
  const [waktu, setWaktu] = useState(new Date());
  const [antrian, setAntrian] = useState([]);
  const [layanan, setLayanan] = useState([]);
  const [jadwal, setJadwal] = useState([]);
  const [laporan, setLaporan] = useState(null);
  const [pengguna, setPengguna] = useState([]);
  const [kategoriList, setKategoriList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [expandedRowId, setExpandedRowId] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [timelineLogs, setTimelineLogs] = useState([]);
  const [timelineLoading, setTimelineLoading] = useState(false);

  // Reusable confirmation modal state
  const [confirmConfig, setConfirmConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    detail: '',
    confirmText: 'Konfirmasi',
    cancelText: 'Batal',
    onConfirm: () => {},
    type: 'warning',
    isProcessing: false
  });

  const openConfirm = (title, message, onConfirm, type = 'warning', opts = {}) => {
    setConfirmConfig({
      isOpen: true,
      title,
      message,
      detail: opts.detail || '',
      confirmText: opts.confirmText || 'Konfirmasi',
      cancelText: opts.cancelText || 'Kembali',
      onConfirm: async () => {
        setConfirmConfig(prev => ({ ...prev, isProcessing: true }));
        try {
          await onConfirm();
        } finally {
          closeConfirm();
        }
      },
      type,
      isProcessing: false
    });
  };

  const closeConfirm = () => {
    setConfirmConfig(prev => ({ ...prev, isOpen: false, isProcessing: false }));
  };

  const fetchTimeline = async (antrianId) => {
    setTimelineLoading(true);
    setTimelineLogs([]);
    try {
      const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/antrian/${antrianId}/timeline`, { headers: authH });
      const json = await r.json();
      if (json.success && Array.isArray(json.data)) {
        setTimelineLogs(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch timeline:', e);
    } finally {
      setTimelineLoading(false);
    }
  };

  // States untuk interaktivitas Data Table (Search & Filter)
  const [searchAntrian, setSearchAntrian] = useState('');
  const [filterStatusAntrian, setFilterStatusAntrian] = useState('all');
  const [searchLayanan, setSearchLayanan] = useState('');
  const [filterStatusLayanan, setFilterStatusLayanan] = useState('all');
  const [filterKategoriLayanan, setFilterKategoriLayanan] = useState('all');

  // States untuk Pagination (Limit & Halaman)
  const [currentPageAntrian, setCurrentPageAntrian] = useState(1);
  const [limitAntrian, setLimitAntrian] = useState(10);
  const [currentPageLayanan, setCurrentPageLayanan] = useState(1);
  const [limitLayanan, setLimitLayanan] = useState(10);
  const [searchPengguna, setSearchPengguna] = useState('');
  const [filterRolePengguna, setFilterRolePengguna] = useState('all');
  const [currentPagePengguna, setCurrentPagePengguna] = useState(1);
  const [limitPengguna, setLimitPengguna] = useState(10);

  const [showLayananModal, setShowLayananModal] = useState(false);
  const [layananForm, setLayananForm] = useState({ id: null, kategori_id: '', nama_layanan: '', deskripsi: '', estimasi_menit: 30, harga: 0, is_aktif: 1 });

  const [showKategoriModal, setShowKategoriModal] = useState(false);
  const [kategoriForm, setKategoriForm] = useState({ id: null, nama_kategori: '', deskripsi: '', icon: 'directions_car', is_active: 1 });

  const [showJadwalModal, setShowJadwalModal] = useState(false);
  const [jadwalForm, setJadwalForm] = useState({ id: null, hari: 1, jam_buka: '08:00', jam_tutup: '17:00', kuota_per_slot: 5, is_libur: 0 });

  const [showPenggunaModal, setShowPenggunaModal] = useState(false);
  const [penggunaForm, setPenggunaForm] = useState({ nama: '', email: '', password: '', no_hp: '', role: 'pelanggan' });

  // Quick Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignTargetQueue, setAssignTargetQueue] = useState(null);
  const [selectedAssignMontirId, setSelectedAssignMontirId] = useState('');

  // Consolidated Manajemen Pengguna States
  const [customers, setCustomers] = useState([]);
  const [mechanics, setMechanics] = useState([]);
  const [subTab, setSubTab] = useState('pelanggan'); // 'pelanggan' | 'montir' | 'admin'
  const [selectedCustomerHistory, setSelectedCustomerHistory] = useState(null);
  const [customerHistoryList, setCustomerHistoryList] = useState([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  const openAssignModal = async (q) => {
    setAssignTargetQueue(q);
    setSelectedAssignMontirId(q.montir_id || '');
    setShowAssignModal(true);
    setRecommendations([]);
    try {
      const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/montir/recommendation/${q.id}`, { headers: authH });
      const d = await r.json();
      if (d.success) {
        setRecommendations(d.data || []);
      }
    } catch {}
  };

  useEffect(() => {
    if (!token || localStorage.getItem('antrian_role') !== 'admin') { navigate('/login'); return; }
    const link = document.createElement('link');
    link.href = '/stylesheets/admin.css'; link.rel = 'stylesheet';
    document.head.appendChild(link);
    fetchAll();
    
    if (sessionStorage.getItem('show_welcome_toast') === 'true') {
      setShowWelcome(true);
      sessionStorage.removeItem('show_welcome_toast');
      setTimeout(() => setShowWelcome(false), 3000);
    }

    const clockIv = setInterval(() => setWaktu(new Date()), 1000);
    return () => { clearInterval(clockIv); document.head.removeChild(link); };
  }, []);

  useEffect(() => {
    const iv = setInterval(fetchAntrian, syncInterval);
    return () => clearInterval(iv);
  }, [syncInterval]);

  const fetchAll = () => { fetchAntrian(); fetchLayanan(); fetchJadwal(); fetchLaporan(); fetchPengguna(); fetchKategori(); fetchAuditLogs(); };
  
  const fetchAuditLogs = async () => {
    try {
      const data = await query('admin_audit_logs', async () => {
        const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/antrian/activity-logs`, { headers: authH });
        const json = await r.json();
        return json.data || [];
      }, { forceRefetch: true });
      setAuditLogs(data);
    } catch {}
  };

  
  const fetchKategori = async () => {
    try {
      const data = await query('admin_kategori', async () => {
        const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/kategori-kendaraan`);
        return await r.json();
      });
      setKategoriList(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchPengguna = async () => {
    try {
      const data = await query('admin_users', async () => {
        const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/auth/users`, { headers: authH });
        const json = await r.json();
        return json.data || [];
      }, { forceRefetch: true });
      setPengguna(data);

      // Fetch customer insight CRM list
      const custRes = await fetchWithRetry(`${CONFIG.API_BASE_URL}/users/customers`, { headers: authH });
      const custJson = await custRes.json();
      if (custJson.success) {
        setCustomers(custJson.data || []);
      }

      // Fetch real-time mechanics workload
      const mechRes = await fetchWithRetry(`${CONFIG.API_BASE_URL}/montir/workload`, { headers: authH });
      const mechJson = await mechRes.json();
      if (mechJson.success) {
        setMechanics(mechJson.data || []);
      }
    } catch {}
  };

  const toggleBlacklistCustomer = async (customerId, isBlacklist) => {
    try {
      const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/users/${customerId}/blacklist`, {
        method: 'PUT',
        headers: authH,
        body: JSON.stringify({ is_blacklist: isBlacklist })
      });
      const d = await r.json();
      if (d.success) {
        showToast(isBlacklist ? 'Pelanggan dimasukkan ke daftar hitam!' : 'Pelanggan berhasil diaktifkan kembali.', 'success');
        fetchPengguna();
      } else {
        showToast(d.error || 'Gagal mengubah status blacklist', 'error');
      }
    } catch {
      showToast('Koneksi terputus', 'error');
    }
  };

  const viewCustomerHistory = async (customer) => {
    setSelectedCustomerHistory(customer);
    setShowHistoryModal(true);
    setCustomerHistoryList([]);
    try {
      const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/users/${customer.id}/history`, { headers: authH });
      const d = await r.json();
      if (d.success) {
        setCustomerHistoryList(d.data || []);
      }
    } catch {
      showToast('Gagal memuat riwayat pelanggan', 'error');
    }
  };

  const updateMechanicSkills = async (mechanicId, skills) => {
    try {
      const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/montir/${mechanicId}/skills`, {
        method: 'POST',
        headers: authH,
        body: JSON.stringify({ skills })
      });
      const d = await r.json();
      if (d.success) {
        showToast('Keahlian montir berhasil diperbarui!', 'success');
        fetchPengguna();
      } else {
        showToast(d.error || 'Gagal memperbarui keahlian', 'error');
      }
    } catch {
      showToast('Koneksi terputus', 'error');
    }
  };

  const updateUserRole = async (userId, newRole) => {
    openConfirm('Perbarui Hak Akses', 'Apakah Anda yakin ingin mengubah role pengguna ini?', async () => {
      try {
        const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/auth/users/${userId}/role`, {
          method: 'PUT',
          headers: authH,
          body: JSON.stringify({ role: newRole })
        });
        const d = await r.json();
        if (d.success) {
          showToast('Role berhasil diperbarui!', 'success');
          invalidateQuery('admin_users');
          fetchPengguna();
        } else {
          showToast(d.error || 'Gagal memperbarui role', 'error');
        }
      } catch {
        showToast('Koneksi bermasalah', 'error');
      }
    });
  };

  const savePengguna = async (e) => {
    e.preventDefault();
    const isEdit = penggunaForm.id ? true : false;
    const method = isEdit ? 'PUT' : 'POST';
    const url = isEdit ? `${CONFIG.API_BASE_URL}/auth/users/${penggunaForm.id}` : `${CONFIG.API_BASE_URL}/auth/users`;
    try {
      const r = await fetchWithRetry(url, {
        method,
        headers: authH,
        body: JSON.stringify(penggunaForm)
      });
      const d = await r.json();
      if (d.success) {
        showToast(isEdit ? 'Data akun berhasil diperbarui!' : 'Akun baru berhasil ditambahkan!', 'success');
        setShowPenggunaModal(false);
        invalidateQuery('admin_users');
        fetchPengguna();
      } else {
        showToast(d.error || 'Gagal menyimpan data akun', 'error');
      }
    } catch {
      showToast('Koneksi terputus', 'error');
    }
  };

  const deletePengguna = async (id) => {
    if (id === user.id) {
      showToast('Anda tidak bisa menghapus akun Anda sendiri yang sedang login!', 'error');
      return;
    }
    const target = pengguna.find(p => p.id === id);
    openConfirm(
      '🗑️ Nonaktifkan Akun Pengguna',
      `Akun "${target?.nama || ''}" (${target?.email || ''}) akan dinonaktifkan secara permanen.`,
      async () => {
        try {
          const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/auth/users/${id}`, {
            method: 'DELETE',
            headers: authH
          });
          const d = await r.json();
          if (d.success) {
            showToast('Akun pengguna berhasil dinonaktifkan!', 'success');
            invalidateQuery('admin_users');
            fetchPengguna();
          } else {
            showToast(d.error || 'Gagal menghapus akun pengguna', 'error');
          }
        } catch {
          showToast('Koneksi terputus', 'error');
        }
      },
      'danger',
      { detail: 'Pengguna yang dinonaktifkan tidak akan dapat login kembali. Seluruh riwayat antrean akan tetap tersimpan sebagai arsip.', confirmText: 'Ya, Nonaktifkan', cancelText: 'Kembali' }
    );
  };

  const fetchAntrian = async () => {
    try {
      const data = await query('admin_antrian', async () => {
        const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/antrian`, { headers: authH });
        if (r.status === 401 || r.status === 403) return logout();
        const json = await r.json();
        return json.data || [];
      }, { forceRefetch: true });
      setAntrian(Array.isArray(data) ? data : []);
      fetchPengguna();
    } catch {} finally { setIsLoading(false); }
  };

  const fetchLayanan = async () => {
    try {
      const data = await query('admin_layanan', async () => {
        const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/layanan`);
        return await r.json();
      });
      setLayanan(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchJadwal = async () => {
    try {
      const data = await query('admin_jadwal', async () => {
        const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/jadwal`);
        return await r.json();
      });
      setJadwal(Array.isArray(data) ? data : []);
    } catch {}
  };

  const fetchLaporan = async () => {
    try {
      const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/laporan`, { headers: authH });
      const json = await r.json();
      if (json.success) setLaporan(json.data);
    } catch {}
  };

  // ===== CONTEXTUAL QUEUE ACTION CONFIGS =====
  const AKSI_CONFIG = {
    panggil: {
      title: '🔊 Panggil Ulang Antrean',
      getMessage: (q) => `Nomor antrean ${q?.nomor_antrian || ''} akan dipanggil ulang melalui pengeras suara.`,
      detail: 'Pelanggan akan mendengar panggilan ulang melalui sistem audio. Gunakan fitur ini jika pelanggan belum merespons panggilan pertama.',
      confirmText: 'Ya, Panggil Ulang',
      type: 'recall',
      toast: 'Antrean berhasil dipanggil ulang!',
    },
    dilayani: {
      title: '🔧 Mulai Servis Kendaraan',
      getMessage: (q) => `Kendaraan ${q?.kendaraan || ''} milik ${q?.nama_pelanggan || 'pelanggan'} akan mulai diservis.`,
      detail: 'Status akan berubah menjadi "Sedang Diservis". Montir yang ditugaskan akan mulai mengerjakan kendaraan ini.',
      confirmText: 'Ya, Mulai Servis',
      type: 'serve',
      toast: 'Servis kendaraan telah dimulai!',
    },
    selesai: {
      title: '✅ Selesaikan Servis',
      getMessage: (q) => `Servis kendaraan ${q?.kendaraan || ''} telah selesai dikerjakan.`,
      detail: 'Pelanggan akan menerima notifikasi untuk melakukan verifikasi dan persetujuan hasil pengerjaan.',
      confirmText: 'Ya, Selesai',
      type: 'success',
      toast: 'Servis selesai, menunggu verifikasi pelanggan.',
    },
    dibatalkan: {
      title: '❌ Batalkan Antrian',
      getMessage: (q) => `Antrian ${q?.nomor_antrian || ''} akan dibatalkan secara permanen.`,
      detail: 'Pelanggan akan menerima notifikasi pembatalan otomatis. Tindakan ini tidak dapat dikembalikan.',
      confirmText: 'Ya, Batalkan',
      type: 'danger',
      toast: 'Antrian berhasil dibatalkan.',
    },
  };

  const aksiAntrian = async (id, aksi) => {
    const q = antrian.find(item => item.id === id);
    const cfg = AKSI_CONFIG[aksi] || {
      title: 'Konfirmasi Aksi',
      getMessage: () => `Apakah Anda yakin ingin melanjutkan?`,
      confirmText: 'Konfirmasi',
      type: 'warning',
      toast: 'Status antrian berhasil diperbarui.',
    };

    openConfirm(
      cfg.title,
      cfg.getMessage(q),
      async () => {
        try {
          const res = await fetchWithRetry(`${CONFIG.API_BASE_URL}/antrian/${id}/${aksi}`, { method: 'PUT', headers: authH });
          const json = await res.json();
          if (res.ok && json.success) {
            showToast(cfg.toast, 'success');
            invalidateQuery('admin_antrian');
            fetchAntrian();

            // --- TRIGGER SPEECH ON PANGGIL ---
            if (aksi === 'panggil' && enableTTS) {
              try {
                if (q) {
                  const cleanedNum = q.nomor_antrian.replace(/[^A-Za-z0-9]/g, '').split('').join(' ');
                  const text = `Panggilan ulang. Nomor antrean, ${cleanedNum}, silakan menuju ke area servis.`;
                  const utterance = new SpeechSynthesisUtterance(text);
                  utterance.lang = 'id-ID';
                  utterance.rate = 0.85;
                  window.speechSynthesis.speak(utterance);
                }
              } catch (speechErr) {
                console.error('Speech synthesis error:', speechErr);
              }
            }
          } else {
            showToast(json.error || 'Gagal memperbarui status antrian.', 'error');
          }
        } catch {
          showToast('Koneksi terputus', 'error');
        }
      },
      cfg.type,
      { detail: cfg.detail, confirmText: cfg.confirmText, cancelText: 'Kembali' }
    );
  };

  const aksiAntrianPanggil = async (id, montirId) => {
    if (!montirId) {
      showToast('Silakan pilih Montir terlebih dahulu sebelum memanggil antrian!', 'error');
      return;
    }
    const selectedMontir = pengguna.find(p => p.id === parseInt(montirId));
    if (selectedMontir && selectedMontir.is_busy > 0) {
      openConfirm(
        '⚠️ Montir Sedang Sibuk',
        `Montir ${selectedMontir.nama} saat ini sedang mengerjakan kendaraan lain.`,
        () => proceedPanggil(id, montirId),
        'warning',
        { detail: `Montir sedang melayani antrian ${selectedMontir.active_antrian_nomor} (${selectedMontir.active_kendaraan}). Apakah Anda tetap ingin menugaskan montir ini?`, confirmText: 'Ya, Tetap Tugaskan', cancelText: 'Pilih Montir Lain' }
      );
    } else {
      openConfirm(
        '📢 Panggil & Tugaskan Montir',
        'Antrian akan dipanggil dan montir yang dipilih akan mulai ditugaskan.',
        () => proceedPanggil(id, montirId),
        'info',
        { confirmText: 'Ya, Panggil Sekarang', cancelText: 'Kembali' }
      );
    }
  };

  const proceedPanggil = async (id, montirId) => {
    try {
      const r = await fetchWithRetry(`${CONFIG.API_BASE_URL}/antrian/${id}/panggil`, {
        method: 'PUT',
        headers: authH,
        body: JSON.stringify({ montir_id: montirId })
      });
      const d = await r.json();
      if (d.success) {
        showToast('Antrian berhasil dipanggil dan montir ditugaskan!', 'success');
        setShowAssignModal(false);
        setAssignTargetQueue(null);
        invalidateQuery('admin_antrian');
        fetchAntrian();

        // --- TRIGGER TEXT-TO-SPEECH VOICE CALL ---
        if (enableTTS) {
          try {
            const queueNumber = d.data?.nomor_antrian || assignTargetQueue?.nomor_antrian || '';
            if (queueNumber) {
              const cleanedNum = queueNumber.replace(/[^A-Za-z0-9]/g, '').split('').join(' ');
              const text = `Nomor antrean, ${cleanedNum}, silakan menuju ke area servis.`;
              const utterance = new SpeechSynthesisUtterance(text);
              utterance.lang = 'id-ID';
              utterance.rate = 0.85;
              window.speechSynthesis.speak(utterance);
            }
          } catch (speechErr) {
            console.error('Speech synthesis error:', speechErr);
          }
        }
      } else {
        showToast(d.error || 'Gagal memanggil antrian', 'error');
      }
    } catch {
      showToast('Koneksi bermasalah', 'error');
    }
  };

  const saveLayanan = async (e) => {
    e.preventDefault();
    const method = layananForm.id ? 'PUT' : 'POST';
    const url = layananForm.id ? `${CONFIG.API_BASE_URL}/layanan/${layananForm.id}` : `${CONFIG.API_BASE_URL}/layanan`;
    try {
      const res = await fetchWithRetry(url, { method, headers: authH, body: JSON.stringify(layananForm) });
      if (res.ok) {
        showToast(layananForm.id ? 'Layanan berhasil diperbarui!' : 'Layanan berhasil ditambahkan!', 'success');
        setShowLayananModal(false);
        invalidateQuery('admin_layanan');
        fetchLayanan();
      } else {
        showToast('Gagal menyimpan layanan.', 'error');
      }
    } catch {
      showToast('Koneksi bermasalah', 'error');
    }
  };

  const deleteLayanan = async (id) => {
    const target = layanan.find(l => l.id === id);
    openConfirm(
      '🗑️ Hapus Jasa Servis',
      `Layanan "${target?.nama_layanan || ''}" akan dihapus secara permanen.`,
      async () => {
        try {
          const res = await fetchWithRetry(`${CONFIG.API_BASE_URL}/layanan/${id}`, { method: 'DELETE', headers: authH });
          if (res.ok) {
            showToast('Layanan berhasil dihapus.', 'success');
            invalidateQuery('admin_layanan');
            fetchLayanan();
          } else {
            showToast('Gagal menghapus layanan.', 'error');
          }
        } catch {
          showToast('Koneksi terputus', 'error');
        }
      },
      'danger',
      { detail: 'Data layanan yang terhapus tidak dapat dikembalikan. Pastikan tidak ada antrean aktif yang menggunakan layanan ini.', confirmText: 'Ya, Hapus Permanen', cancelText: 'Kembali' }
    );
  };

  const saveKategori = async (e) => {
    e.preventDefault();
    const method = kategoriForm.id ? 'PUT' : 'POST';
    const url = kategoriForm.id ? `${CONFIG.API_BASE_URL}/kategori-kendaraan/${kategoriForm.id}` : `${CONFIG.API_BASE_URL}/kategori-kendaraan`;
    try {
      const res = await fetchWithRetry(url, {
        method,
        headers: authH,
        body: JSON.stringify(kategoriForm)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(kategoriForm.id ? 'Kategori berhasil diperbarui!' : 'Kategori berhasil ditambahkan!', 'success');
        setShowKategoriModal(false);
        invalidateQuery('admin_kategori');
        fetchKategori();
        invalidateQuery('admin_layanan');
        fetchLayanan();
      } else {
        showToast(data.error || 'Gagal menyimpan kategori', 'error');
      }
    } catch {
      showToast('Gagal menghubungi server', 'error');
    }
  };

  const deleteKategori = async (id) => {
    const target = kategoriList.find(k => k.id === id);
    openConfirm(
      '🗑️ Hapus Kategori Kendaraan',
      `Kategori "${target?.nama_kategori || ''}" akan dihapus.`,
      async () => {
        try {
          const res = await fetchWithRetry(`${CONFIG.API_BASE_URL}/kategori-kendaraan/${id}`, {
            method: 'DELETE',
            headers: authH
          });
          const data = await res.json();
          if (res.ok && data.success) {
            showToast('Kategori berhasil dihapus!', 'success');
            invalidateQuery('admin_kategori');
            fetchKategori();
            invalidateQuery('admin_layanan');
            fetchLayanan();
          } else {
            showToast(data.error || 'Gagal menghapus kategori', 'error');
          }
        } catch {
          showToast('Gagal menghubungi server', 'error');
        }
      },
      'danger',
      { detail: 'Jika masih ada layanan yang terhubung ke kategori ini, penghapusan akan ditolak oleh sistem demi keamanan data.', confirmText: 'Ya, Hapus Kategori', cancelText: 'Kembali' }
    );
  };

  const saveJadwal = async (e) => {
    e.preventDefault();
    const method = jadwalForm.id ? 'PUT' : 'POST';
    const url = jadwalForm.id ? `${CONFIG.API_BASE_URL}/jadwal/${jadwalForm.id}` : `${CONFIG.API_BASE_URL}/jadwal`;
    try {
      const res = await fetchWithRetry(url, { method, headers: authH, body: JSON.stringify(jadwalForm) });
      if (res.ok) {
        showToast('Jadwal berhasil disimpan!', 'success');
        setShowJadwalModal(false);
        invalidateQuery('admin_jadwal');
        fetchJadwal();
      } else {
        showToast('Gagal menyimpan jadwal.', 'error');
      }
    } catch {
      showToast('Koneksi bermasalah', 'error');
    }
  };

  const deleteJadwal = async (id) => {
    const target = jadwal.find(j => j.id === id);
    openConfirm(
      '🗑️ Hapus Jadwal Operasional',
      `Jadwal hari ${target ? HARI[target.hari] : ''} akan dihapus dari sistem.`,
      async () => {
        try {
          const res = await fetchWithRetry(`${CONFIG.API_BASE_URL}/jadwal/${id}`, { method: 'DELETE', headers: authH });
          if (res.ok) {
            showToast('Jadwal berhasil dihapus.', 'success');
            invalidateQuery('admin_jadwal');
            fetchJadwal();
          } else {
            showToast('Gagal menghapus jadwal.', 'error');
          }
        } catch {
          showToast('Koneksi terputus', 'error');
        }
      },
      'danger',
      { detail: 'Jadwal yang dihapus tidak dapat dikembalikan. Pelanggan tidak akan bisa membooking servis pada hari ini.', confirmText: 'Ya, Hapus Jadwal', cancelText: 'Kembali' }
    );
  };

  const logout = async () => {
    await fetchWithRetry(`${CONFIG.API_BASE_URL}/auth/logout`, { method: 'POST', headers: authH });
    localStorage.clear(); navigate('/login');
  };

  const totalAntrianHariIni = antrian.filter(a => {
    const today = new Date().toISOString().substring(0, 10);
    return a.tanggal && a.tanggal.substring(0, 10) === today;
  });

  const antrianAktif = totalAntrianHariIni.filter(a => ['menunggu', 'dipanggil', 'sedang_dilayani'].includes(a.status));
  const montirAktif = pengguna.filter(p => p.role === 'montir' && p.is_aktif === 1);
  const montirIdle = montirAktif.filter(m => !antrian.some(a => a.montir_id === m.id && a.status === 'sedang_dilayani'));
  const antrianPendingSparepart = antrian.filter(a => a.status === 'menunggu_sparepart').length;
  
  const antrianTerlambatSLA = antrian.filter(a => {
    if (a.status !== 'menunggu') return false;
    const diffMin = (new Date() - new Date(a.created_at)) / 1000 / 60;
    return diffMin > 30;
  }).length;

  const stats = {
    total: antrian.length,
    menunggu: antrian.filter(a => a.status === 'menunggu').length,
    dipanggil: antrian.filter(a => a.status === 'dipanggil').length,
    dilayani: antrian.filter(a => a.status === 'sedang_dilayani').length,
    pending: antrianPendingSparepart,
    selesai: antrian.filter(a => a.status === 'selesai').length,
  };

  const TABS = [
    { id: 'dashboard', label: 'Dashboard Monitor', icon: 'fa-chart-line' },
    { id: 'antrian', label: 'Antrian Hari Ini', icon: 'fa-list-ol' },
    { id: 'kategori', label: 'Kategori Kendaraan', icon: 'fa-car' },
    { id: 'layanan', label: 'Kelola Layanan', icon: 'fa-wrench' },
    { id: 'jadwal', label: 'Jadwal Operasional', icon: 'fa-calendar-alt' },
    { id: 'laporan', label: 'Laporan Antrian', icon: 'fa-chart-bar' },
    { id: 'pengguna', label: 'Kelola Pengguna', icon: 'fa-users' },
    { id: 'archive', label: 'Arsip Operasional', icon: 'fa-archive' },
  ];

  const TAB_LABELS = { 
    dashboard: 'Dashboard Monitor', 
    antrian: 'Kelola Antrian', 
    kategori: 'Kategori Kendaraan', 
    layanan: 'Kelola Layanan', 
    jadwal: 'Jadwal Operasional', 
    laporan: 'Laporan Antrian', 
    pengguna: 'Kelola Pengguna',
    archive: 'Arsip Operasional'
  };

  return (
    <div className="panel-layout" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', minHeight: '100vh', background: '#f8fafc' }}>
      <style>{`
        @keyframes slideDownFadeInOut {
          0% { transform: translate(-50%, -20px); opacity: 0; }
          12% { transform: translate(-50%, 0); opacity: 1; }
          88% { transform: translate(-50%, 0); opacity: 1; }
          100% { transform: translate(-50%, -20px); opacity: 0; }
        }
        .control-grid {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .control-grid {
            grid-template-columns: 1fr;
          }
        }
        .stat-card-glow {
          box-shadow: 0 4px 20px rgba(0,0,0,0.015);
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .stat-card-glow:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0,0,0,0.04);
        }
        .sub-tab-btn {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
      `}</style>

      {showWelcome && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: 'rgba(22, 163, 74, 0.95)',
          backdropFilter: 'blur(10px)',
          color: '#fff',
          padding: '16px 28px',
          borderRadius: '16px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontWeight: '700',
          fontSize: '1rem',
          animation: 'slideDownFadeInOut 3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          pointerEvents: 'none'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', width: '32px', height: '32px', borderRadius: '50%' }}>
            <i className="fas fa-check" style={{ fontSize: '1rem' }}></i>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', opacity: 0.9, fontWeight: 500 }}>Login Berhasil</div>
            <div>Selamat Datang, {user.nama || 'Admin'}! 👋</div>
          </div>
        </div>
      )}

      {/* NEW INTEGRATED SIDEBAR */}
      <Sidebar activeTab={tab} onTabChange={setTab} onLogout={logout} user={user} />

      {/* MAIN CONTAINER */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto' }}>
        
        {/* TOPBAR HEADER CONTROL CENTER */}
        <header style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', sticky: 'top', zIndex: 100 }}>
          <div>
            <h5 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '1.15rem', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ textTransform: 'uppercase', color: '#ea580c', letterSpacing: '0.5px' }}>
                {tab === 'dashboard' ? 'Ringkasan Operasional' : tab === 'antrian' ? 'Antrian Hari Ini' : tab === 'montir' ? 'Monitoring Montir' : tab === 'pending' ? 'Kendaraan Pending' : tab === 'layanan' ? 'Kelola Layanan' : tab === 'jadwal' ? 'Kapasitas Operasional' : tab === 'pengguna' ? 'Kelola Pengguna' : tab === 'archive' ? 'Arsip Operasional' : tab === 'laporan' ? 'Laporan & Analitik' : tab === 'audit' ? 'Audit Log' : 'Pengaturan'}
              </span>
            </h5>
            <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 600 }}>Bengkelku Control Command Center</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            {/* LIVE DIGITAL CLOCK */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc', padding: '6px 14px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
              <i className="fas fa-clock" style={{ color: '#ea580c', fontSize: '0.85rem' }}></i>
              <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1e293b' }}>
                {waktu.toLocaleTimeString('id-ID')} WIB
              </span>
            </div>
            {/* FORCE SYNC BUTTON */}
            <button 
              onClick={fetchAll}
              style={{ border: 'none', background: '#ea580c', color: '#fff', width: 34, height: 34, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(234,88,12,0.2)', transition: 'all 0.2s' }}
              title="Perbarui Semua Data"
            >
              <i className="fas fa-sync-alt"></i>
            </button>
          </div>
        </header>

        {/* CONTENT ENVELOPE */}
        <div style={{ padding: 32, flex: 1 }}>
          
          {/* ============================================================== */}
          {/* TAB 1: DASHBOARD COMMAND CENTER                                */}
          {/* ============================================================== */}
          {tab === 'dashboard' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* OPERATIONAL STATUS BAR */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', padding: '24px 32px', borderRadius: '16px', color: '#fff', boxShadow: '0 10px 25px rgba(15,23,42,0.15)' }}>
                <div>
                  <h6 style={{ margin: 0, fontSize: '0.82rem', color: '#f97316', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Beban Operasional Real-time</h6>
                  <h4 style={{ margin: '4px 0 0 0', fontWeight: 800, fontSize: '1.25rem' }}>
                    Status Bengkel: {antrianAktif.length > 5 ? '⚠️ Beban Sangat Padat' : '🟢 Kondisi Normal & Kondusif'}
                  </h4>
                </div>
                <div style={{ background: antrianAktif.length > 5 ? '#ef4444' : '#16a34a', color: '#fff', padding: '6px 16px', borderRadius: '50px', fontSize: '0.8rem', fontWeight: 900, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {antrianAktif.length > 5 ? '⚠️ OVERLOAD WARN' : '🟢 RUNNING CLEAN'}
                </div>
              </div>

              {/* CORE METRICS SUMMARY CARD */}
              <div className="stats-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16 }}>
                {[
                  { label:'Total Antrean', val: stats.total, icon:'fa-list-ol', color:'#3b82f6', bg:'rgba(59,130,246,0.08)' },
                  { label:'Menunggu', val: stats.menunggu, icon:'fa-clock', color:'#eab308', bg:'rgba(234,179,8,0.08)' },
                  { label:'Montir Bekerja', val: `${montirAktif.length - montirIdle.length} / ${montirAktif.length}`, icon:'fa-user-cog', color:'#f97316', bg:'rgba(249,115,22,0.08)' },
                  { label:'SLA Tertunda (>20m)', val: antrianTerlambatSLA, icon:'fa-exclamation-triangle', color:'#ef4444', bg:'rgba(239,68,68,0.08)' },
                  { label:'Pending Sparepart', val: stats.pending, icon:'fa-cog', color:'#6366f1', bg:'rgba(99,102,241,0.08)' },
                ].map((s,i) => (
                  <div key={i} className="stat-card stat-card-glow" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: s.color }}>
                      <i className={`fas ${s.icon}`}></i>
                    </div>
                    <div>
                      <small style={{ display: 'block', fontSize: '0.74rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{s.label}</small>
                      <h3 style={{ margin: '4px 0 0 0', fontWeight: 900, color: '#0f172a', fontSize: '1.4rem' }}>{s.val}</h3>
                    </div>
                  </div>
                ))}
              </div>

              {/* TWO COLUMN GRID REALTIME CENTER */}
              <div className="control-grid">
                {/* LEFT COLUMN: ACTIVE QUEUE SYSTEM PANEL */}
                <OperationalQueuePanel 
                  antrian={antrian} 
                  onAction={aksiAntrian} 
                  onAssignQuick={(q) => { 
                    openAssignModal(q);
                  }} 
                />

                {/* RIGHT COLUMN: ALERTS & MECHANICS PANEL */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                  <OperationalAlertPanel antrian={antrian} pengguna={pengguna} />
                  <MechanicMonitoringPanel 
                    pengguna={pengguna} 
                    antrian={antrian} 
                    onAssignQuick={(m) => { 
                      showToast(`Silakan lakukan penugasan langsung lewat daftar antrian di sebelah kiri!`, 'info'); 
                    }} 
                  />
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 2: DETAILED ANTRIAN HARI INI                               */}
          {/* ============================================================== */}
          {tab === 'antrian' && (() => {
            const filteredAntrian = antrian.filter(a => {
              if (filterStatusAntrian !== 'all' && a.status !== filterStatusAntrian) return false;
              if (searchAntrian.trim() !== '') {
                const q = searchAntrian.toLowerCase();
                const nama = (a.nama_pelanggan || '').toLowerCase();
                const nomor = (a.nomor_antrian || '').toLowerCase();
                const kendaraan = (a.kendaraan || '').toLowerCase();
                const layananName = (a.nama_layanan || '').toLowerCase();
                return nama.includes(q) || nomor.includes(q) || kendaraan.includes(q) || layananName.includes(q);
              }
              return true;
            });

            const totalEntries = filteredAntrian.length;
            const totalPages = Math.ceil(totalEntries / limitAntrian) || 1;
            const activePage = currentPageAntrian > totalPages ? 1 : currentPageAntrian;
            const startIndex = (activePage - 1) * limitAntrian;
            const paginated = filteredAntrian.slice(startIndex, startIndex + limitAntrian);

            return (
              <div className="fade-in table-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                
                {/* FILTERS & SEARCH ROW */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <input 
                      type="text" 
                      placeholder="Cari antrean..." 
                      value={searchAntrian}
                      onChange={(e) => { setSearchAntrian(e.target.value); setCurrentPageAntrian(1); }}
                      style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.82rem', width: 220 }}
                    />
                    <select 
                      value={filterStatusAntrian} 
                      onChange={(e) => { setFilterStatusAntrian(e.target.value); setCurrentPageAntrian(1); }}
                      style={{ padding: '8px 16px', border: '1px solid #e2e8f0', borderRadius: 10, fontSize: '0.82rem', background: '#fff', fontWeight: 600 }}
                    >
                      <option value="all">Semua Status</option>
                      {Object.keys(STATUS_MAP).map(key => (
                        <option key={key} value={key}>{STATUS_MAP[key].label}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <small style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>Tampilkan</small>
                    <select
                      value={limitAntrian}
                      onChange={(e) => { setLimitAntrian(parseInt(e.target.value)); setCurrentPageAntrian(1); }}
                      style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.78rem', fontWeight: 700 }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                {/* DATA TABLE */}
                <div style={{ overflowX: 'auto' }}>
                  <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>No. Antrean</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Pelanggan</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Kendaraan</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Layanan</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Ditugaskan Ke</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Tanggal & Waktu</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}><i className="fas fa-spinner fa-spin"></i> Memuat data...</td></tr>
                      ) : paginated.map(a => {
                        const sMap = STATUS_MAP[a.status] || { label: a.status, cls: 'badge-menunggu', icon: 'fa-clock' };
                        const isExpanded = expandedRowId === a.id;
                        return (
                          <React.Fragment key={a.id}>
                            <tr style={{ borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }} onClick={() => { const nextExpanded = isExpanded ? null : a.id; setExpandedRowId(nextExpanded); if (nextExpanded) fetchTimeline(a.id); }} className="table-row-hover">
                              <td style={{ padding: '14px 16px', fontWeight: 800, color: '#ea580c' }}>
                                <i className={`fas ${isExpanded ? 'fa-chevron-down' : 'fa-chevron-right'}`} style={{ marginRight: 8, fontSize: '0.75rem', color: '#94a3b8' }}></i>
                                {a.nomor_antrian}
                              </td>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>{a.nama_pelanggan || 'Guest'}</td>
                              <td style={{ padding: '14px 16px', fontWeight: 600, color: '#334155' }}>{a.kendaraan}</td>
                              <td style={{ padding: '14px 16px', color: '#475569', fontWeight: 600 }}>{a.nama_layanan || 'Servis Umum'}</td>
                              <td style={{ padding: '14px 16px', fontWeight: 700, color: a.nama_montir ? '#4f46e5' : '#ef4444' }}>
                                <i className="fas fa-user-cog" style={{ marginRight: 6 }}></i>
                                {a.nama_montir || 'Belum Ada'}
                              </td>
                              <td style={{ padding: '14px 16px', fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                                {formatTanggalIndo(a.tanggal)} @ {a.slot_waktu ? a.slot_waktu.substring(0,5) : '-'}
                              </td>
                              <td style={{ padding: '14px 16px' }}>
                                <span className={`badge-status ${sMap.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', padding: '3px 8px', borderRadius: 50 }}>
                                  <i className={`fas ${sMap.icon}`}></i>
                                  {sMap.label}
                                </span>
                              </td>
                              <td style={{ padding: '14px 16px', textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                                <div style={{ display: 'inline-flex', gap: 6 }}>
                                  {['menunggu', 'dipanggil'].includes(a.status) && (
                                    <button 
                                      onClick={() => openAssignModal(a)}
                                      style={{ border: 'none', background: '#eff6ff', color: '#3b82f6', padding: '6px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <i className="fas fa-user-plus"></i> Tugaskan
                                    </button>
                                  )}
                                  {a.status === 'dipanggil' && (
                                    <>
                                      <button 
                                        onClick={() => aksiAntrian(a.id, 'panggil')}
                                        style={{ border: 'none', background: '#f5f3ff', color: '#7c3aed', padding: '6px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                      >
                                        <i className="fas fa-volume-up"></i> Panggil Lagi
                                      </button>
                                      <button 
                                        onClick={() => aksiAntrian(a.id, 'dilayani')}
                                        style={{ border: 'none', background: '#fff7ed', color: '#ea580c', padding: '6px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                      >
                                        <i className="fas fa-wrench"></i> Mulai Servis
                                      </button>
                                    </>
                                  )}
                                  {a.status === 'sedang_dilayani' && (
                                    <button 
                                      onClick={() => aksiAntrian(a.id, 'selesai')}
                                      style={{ border: 'none', background: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <i className="fas fa-check"></i> Selesai
                                    </button>
                                  )}
                                  {a.status !== 'selesai' && a.status !== 'dibatalkan' && (
                                    <button 
                                      onClick={() => aksiAntrian(a.id, 'dibatalkan')}
                                      style={{ border: 'none', background: '#fef2f2', color: '#ef4444', padding: '6px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                                    >
                                      <i className="fas fa-times"></i> Batal
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>

                            {/* EXPANDED ROW FOR NOTES & QUICK METADATA */}
                            {isExpanded && (
                              <tr style={{ background: '#f8fafc' }}>
                                <td colSpan="8" style={{ padding: '20px 24px', borderBottom: '1px solid #e2e8f0' }}>
                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                                    {/* LEFT: Info Metadata */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                                      <div>
                                        <strong style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>
                                          <i className="fas fa-address-book" style={{ marginRight: 6, color: '#3b82f6' }}></i>Kontak Pelanggan
                                        </strong>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}><i className="fas fa-phone" style={{ marginRight: 6 }}></i> {a.no_hp || '-'}</span>
                                        <span style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginTop: 2 }}>{a.email || '-'}</span>
                                      </div>
                                      <div>
                                        <strong style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>
                                          <i className="fas fa-clipboard-list" style={{ marginRight: 6, color: '#ea580c' }}></i>Catatan Kerusakan / Keluhan
                                        </strong>
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: '#475569', lineHeight: 1.5, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>{a.catatan || 'Tidak ada catatan keluhan khusus.'}</p>
                                      </div>
                                      <div>
                                        <strong style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.5px' }}>
                                          <i className="fas fa-stopwatch" style={{ marginRight: 6, color: '#f59e0b' }}></i>SLA Waktu Antrean
                                        </strong>
                                        <span style={{ fontSize: '0.78rem', color: '#475569' }}>
                                          Dibuat pada: {new Date(a.created_at).toLocaleString('id-ID')}<br/>
                                          Terakhir diupdate: {new Date(a.updated_at).toLocaleString('id-ID')}
                                        </span>
                                      </div>
                                    </div>

                                    {/* RIGHT: Queue Journey Timeline */}
                                    <div>
                                      <strong style={{ display: 'block', fontSize: '0.72rem', color: '#64748b', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.5px' }}>
                                        <i className="fas fa-route" style={{ marginRight: 6, color: '#7c3aed' }}></i>Queue Journey Timeline
                                      </strong>
                                      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', maxHeight: 260, overflowY: 'auto' }}>
                                        <QueueTimeline logs={timelineLogs} isLoading={timelineLoading} />
                                      </div>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                      {!isLoading && paginated.length === 0 && (
                        <tr><td colSpan="8" style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>Tidak menemukan antrean yang cocok.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* PAGINATION PANEL */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, borderTop: '1px solid #f1f5f9', paddingTop: 16 }}>
                  <small style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 700 }}>
                    Menampilkan {startIndex + 1} - {Math.min(startIndex + limitAntrian, totalEntries)} dari {totalEntries} Antrean
                  </small>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button 
                      disabled={activePage === 1}
                      onClick={() => setCurrentPageAntrian(activePage - 1)}
                      style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: '0.78rem', cursor: activePage === 1 ? 'not-allowed' : 'pointer', opacity: activePage === 1 ? 0.5 : 1 }}
                    >
                      Sebelumnya
                    </button>
                    <button 
                      disabled={activePage === totalPages}
                      onClick={() => setCurrentPageAntrian(activePage + 1)}
                      style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 8, background: '#fff', fontSize: '0.78rem', cursor: activePage === totalPages ? 'not-allowed' : 'pointer', opacity: activePage === totalPages ? 0.5 : 1 }}
                    >
                      Selanjutnya
                    </button>
                  </div>
                </div>

              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* TAB 3: DEDICATED MONITORING MONTIR                             */}
          {/* ============================================================== */}
          {tab === 'montir' && (() => {
            const listMontir = pengguna.filter(p => p.role === 'montir');
            return (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                  <h5 style={{ margin: '0 0 8px 0', fontWeight: 800 }}>Daftar & Workload Montir Bengkel</h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Monitoring beban kerja montir aktif, keahlian khusus, dan unit yang sedang diservis.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
                  {listMontir.map(m => {
                    const serving = antrian.filter(a => a.montir_id === m.id && a.status === 'sedang_dilayani');
                    const completed = antrian.filter(a => a.montir_id === m.id && a.status === 'selesai');
                    const isBusy = m.is_aktif === 1 && serving.length > 0;
                    
                    return (
                      <div key={m.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, boxShadow: '0 4px 20px rgba(0,0,0,0.01)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{ width: 42, height: 42, borderRadius: '50%', background: isBusy ? '#fff7ed' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: isBusy ? '#ea580c' : '#16a34a' }}>
                              {m.nama.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0f172a', display: 'block' }}>{m.nama}</span>
                              <small style={{ fontSize: '0.74rem', color: '#64748b' }}>{m.email}</small>
                            </div>
                          </div>
                          <span style={{ fontSize: '0.7rem', fontWeight: 900, padding: '3px 8px', borderRadius: 50, background: isBusy ? '#ffedd5' : '#dcfce7', color: isBusy ? '#ea580c' : '#15803d' }}>
                            {isBusy ? 'SIBUK' : 'FREE'}
                          </span>
                        </div>

                        <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 12, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.78rem' }}>
                          <div>
                            <span style={{ display: 'block', color: '#64748b' }}>No. Handphone:</span>
                            <strong style={{ color: '#334155' }}>{m.no_hp || '-'}</strong>
                          </div>
                          <div>
                            <span style={{ display: 'block', color: '#64748b' }}>Total Selesai Hari Ini:</span>
                            <strong style={{ color: '#16a34a' }}>{completed.length} Antrean</strong>
                          </div>
                        </div>

                        {isBusy ? (
                          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 10 }}>
                            <small style={{ display: 'block', fontSize: '0.68rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>Unit Aktif Sedang Diservis</small>
                            {serving.map(s => (
                              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a' }}>{s.nomor_antrian} ({s.kendaraan})</span>
                                <span style={{ fontSize: '0.74rem', color: '#ea580c', fontWeight: 700 }}>{s.nama_layanan}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div style={{ textAlign: 'center', background: '#f0fdf4', padding: 8, borderRadius: 10, border: '1px solid #dcfce7', fontSize: '0.75rem', fontWeight: 700, color: '#15803d' }}>
                            <i className="fas fa-check-circle" style={{ marginRight: 6 }}></i> Siap Menerima Kendaraan Baru
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* TAB 4: KENDARAAN PENDING / SPAREPART ISSUES                    */}
          {/* ============================================================== */}
          {tab === 'pending' && (() => {
            const pendingQueues = antrian.filter(a => 
              ['menunggu_sparepart', 'menunggu_verifikasi_pelanggan', 'revisi_servis'].includes(a.status)
            );
            return (
              <div className="fade-in table-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 20 }}>
                  <h5 style={{ margin: '0 0 4px 0', fontWeight: 800 }}><i className="fas fa-exclamation-circle" style={{ color: '#ea580c', marginRight: 8 }}></i> Kendaraan Operasional Pending</h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Daftar kendaraan yang tertunda pengerjaannya karena masalah sparepart, verifikasi harga oleh pelanggan, atau revisi pengerjaan.</p>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>No. Antrean</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Pelanggan</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Unit Kendaraan</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Montir</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Status Delay</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Catatan Kendala</th>
                        <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textAlign: 'center' }}>Unblock Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingQueues.length === 0 ? (
                        <tr><td colSpan="7" style={{ textAlign: 'center', padding: '40px 0', color: '#64748b', fontSize: '0.85rem' }}>Tidak ada kendaraan sedang pending saat ini. Bagus!</td></tr>
                      ) : pendingQueues.map(a => {
                        const sMap = STATUS_MAP[a.status] || { label: a.status, cls: 'badge-menunggu', icon: 'fa-clock' };
                        return (
                          <tr key={a.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '14px 16px', fontWeight: 800, color: '#ea580c' }}>{a.nomor_antrian}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                              {a.nama_pelanggan || 'Guest'}<br/>
                              <small style={{ color: '#64748b' }}>{a.no_hp}</small>
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 600 }}>{a.kendaraan}</td>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: '#4f46e5' }}>{a.nama_montir || 'Belum Ada'}</td>
                            <td style={{ padding: '14px 16px' }}>
                              <span className={`badge-status ${sMap.cls}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', padding: '3px 8px', borderRadius: 50 }}>
                                <i className={`fas ${sMap.icon}`}></i>
                                {sMap.label}
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', fontSize: '0.8rem', color: '#b91c1c', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {a.catatan || 'Keterangan tertunda belum diinput oleh montir.'}
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button 
                                  onClick={() => aksiAntrian(a.id, 'dilayani')}
                                  style={{ border: 'none', background: '#dcfce7', color: '#15803d', padding: '6px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  Lanjutkan Servis
                                </button>
                                <button 
                                  onClick={() => aksiAntrian(a.id, 'selesai')}
                                  style={{ border: 'none', background: '#eff6ff', color: '#2563eb', padding: '6px 12px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
                                >
                                  Selesaikan Langsung
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* TAB 5: UNIFIED LAYANAN & KATEGORI KENDARAAN (CONSOLIDATED)     */}
          {/* ============================================================== */}
          {tab === 'layanan' && (() => {
            const filteredLayanan = layanan.filter(l => {
              if (filterStatusLayanan !== 'all' && l.is_aktif !== parseInt(filterStatusLayanan)) return false;
              if (filterKategoriLayanan !== 'all' && l.kategori_id !== parseInt(filterKategoriLayanan)) return false;
              if (searchLayanan.trim() !== '') {
                const term = searchLayanan.toLowerCase();
                return (l.nama_layanan || '').toLowerCase().includes(term) || (l.deskripsi || '').toLowerCase().includes(term);
              }
              return true;
            });

            return (
              <div className="fade-in" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24 }}>
                
                {/* LEFT BLOCK: JASA LAYANAN MANAGEMENT */}
                <div className="table-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h5 style={{ margin: 0, fontWeight: 800 }}>Daftar Jasa Servis</h5>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>Kelola tarif, estimasi pengerjaan, dan kategori jasa.</p>
                    </div>
                    <button
                      onClick={() => { setLayananForm({ id: null, kategori_id: '', nama_layanan: '', deskripsi: '', estimasi_menit: 30, harga: 0, is_aktif: 1 }); setShowLayananModal(true); }}
                      style={{ border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', padding: '8px 16px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 12px rgba(234,88,12,0.2)' }}
                    >
                      <i className="fas fa-plus-circle"></i> Tambah Jasa
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                    <input 
                      type="text" 
                      placeholder="Cari jasa..." 
                      value={searchLayanan}
                      onChange={(e) => setSearchLayanan(e.target.value)}
                      style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.78rem', flex: 1 }}
                    />
                    <select
                      value={filterKategoriLayanan}
                      onChange={(e) => setFilterKategoriLayanan(e.target.value)}
                      style={{ padding: '6px 12px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: '0.78rem', background: '#fff' }}
                    >
                      <option value="all">Semua Kategori</option>
                      {kategoriList.map(k => (
                        <option key={k.id} value={k.id}>{k.nama_kategori}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                          <th style={{ padding: 12 }}>Nama Jasa</th>
                          <th style={{ padding: 12 }}>Tarif (Rp)</th>
                          <th style={{ padding: 12 }}>Estimasi</th>
                          <th style={{ padding: 12 }}>Status</th>
                          <th style={{ padding: 12, textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLayanan.map(l => (
                          <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: 12 }}>
                              <strong style={{ color: '#0f172a', display: 'block' }}>{l.nama_layanan}</strong>
                              <small style={{ color: '#64748b' }}>{l.nama_kategori || 'Semua Unit'}</small>
                            </td>
                            <td style={{ padding: 12, fontWeight: 800 }}>Rp {parseInt(l.harga).toLocaleString('id-ID')}</td>
                            <td style={{ padding: 12, color: '#ea580c', fontWeight: 700 }}><i className="fas fa-hourglass-half" style={{ marginRight: 6 }}></i>{l.estimasi_menit} mnt</td>
                            <td style={{ padding: 12 }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: 50, background: l.is_aktif ? '#dcfce7' : '#fee2e2', color: l.is_aktif ? '#15803d' : '#b91c1c' }}>
                                {l.is_aktif ? 'Aktif' : 'Nonaktif'}
                              </span>
                            </td>
                            <td style={{ padding: 12, textAlign: 'center' }}>
                              <div style={{ display: 'inline-flex', gap: 6 }}>
                                <button onClick={() => { setLayananForm(l); setShowLayananModal(true); }} style={{ border: 'none', background: '#f1f5f9', padding: 6, borderRadius: 6, cursor: 'pointer' }}><i className="fas fa-edit" style={{ color: '#475569' }}></i></button>
                                <button onClick={() => deleteLayanan(l.id)} style={{ border: 'none', background: '#fef2f2', padding: 6, borderRadius: 6, cursor: 'pointer' }}><i className="fas fa-trash-alt" style={{ color: '#ef4444' }}></i></button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RIGHT BLOCK: KATEGORI KENDARAAN MANAGEMENT */}
                <div className="table-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <div>
                      <h5 style={{ margin: 0, fontWeight: 800 }}>Kategori Unit</h5>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748b' }}>Kelola model pengelompokan kendaraan.</p>
                    </div>
                    <button
                      onClick={() => { setKategoriForm({ id: null, nama_kategori: '', deskripsi: '', icon: 'directions_car', is_active: 1 }); setShowKategoriModal(true); }}
                      style={{ border: 'none', background: '#f1f5f9', color: '#475569', padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                    >
                      <i className="fas fa-plus"></i> Tambah Kategori
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {kategoriList.map(k => (
                      <div key={k.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9', padding: 12, borderRadius: 12 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(234,88,12,0.1)', color: '#ea580c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>
                            <i className={`fas fa-${k.icon || 'motorcycle'}`}></i>
                          </div>
                          <div>
                            <strong style={{ fontSize: '0.85rem', color: '#0f172a', display: 'block' }}>{k.nama_kategori}</strong>
                            <small style={{ fontSize: '0.72rem', color: '#64748b' }}>{k.deskripsi || 'Tidak ada deskripsi'}</small>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 4 }}>
                          <button onClick={() => { setKategoriForm(k); setShowKategoriModal(true); }} style={{ border: 'none', background: '#f1f5f9', padding: 6, borderRadius: 6, cursor: 'pointer' }}><i className="fas fa-edit" style={{ color: '#475569', fontSize: '0.75rem' }}></i></button>
                          <button onClick={() => deleteKategori(k.id)} style={{ border: 'none', background: '#fef2f2', padding: 6, borderRadius: 6, cursor: 'pointer' }}><i className="fas fa-trash-alt" style={{ color: '#ef4444', fontSize: '0.75rem' }}></i></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* TAB 6: KAPASITAS OPERASIONAL                                   */}
          {/* ============================================================== */}
          {tab === 'jadwal' && (
            <div className="fade-in table-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 20 }}>
                <div>
                  <h5 style={{ margin: 0, fontWeight: 800 }}>Kapasitas & Kuota Operasional</h5>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Atur jam operasional bengkel, status hari libur, dan pembatasan slot kuota pengerjaan kendaraan.</p>
                </div>
                <button
                  onClick={() => { setJadwalForm({ id: null, hari: 1, jam_buka: '08:00', jam_tutup: '17:00', kuota_per_slot: 5, is_libur: 0 }); setShowJadwalModal(true); }}
                  style={{ border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', padding: '8px 16px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <i className="fas fa-plus-circle"></i> Tambah Jam Slot
                </button>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table className="table-custom" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', textAlign: 'left' }}>
                      <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Hari Kerja</th>
                      <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Jam Buka - Tutup</th>
                      <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Kuota Per-Slot Waktu</th>
                      <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>Status Operasional</th>
                      <th style={{ padding: '12px 16px', fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jadwal.map(j => (
                      <tr key={j.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#0f172a' }}>{HARI[j.hari] || 'Minggu'}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700, color: '#334155' }}><i className="fas fa-clock" style={{ marginRight: 6, color: '#94a3b8' }}></i> {j.jam_buka.substring(0,5)} - {j.jam_tutup.substring(0,5)} WIB</td>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#ea580c' }}>{j.kuota_per_slot} Kendaraan</td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, padding: '3px 10px', borderRadius: 50, background: j.is_libur ? '#fee2e2' : '#dcfce7', color: j.is_libur ? '#b91c1c' : '#15803d' }}>
                            {j.is_libur ? '⚠️ Libur' : '🟢 Buka'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <div style={{ display: 'inline-flex', gap: 6 }}>
                            <button onClick={() => { setJadwalForm(j); setShowJadwalModal(true); }} style={{ border: 'none', background: '#f1f5f9', padding: 6, borderRadius: 6, cursor: 'pointer' }}><i className="fas fa-edit" style={{ color: '#475569' }}></i></button>
                            <button onClick={() => deleteJadwal(j.id)} style={{ border: 'none', background: '#fef2f2', padding: 6, borderRadius: 6, cursor: 'pointer' }}><i className="fas fa-trash-alt" style={{ color: '#ef4444' }}></i></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 7: KELOLA PENGGUNA (USERS)                                 */}
          {/* ============================================================== */}
          {/* ============================================================== */}
          {/* TAB 7: MANAJEMEN PENGGUNA (HUMAN RESOURCE CONTROL CENTER)      */}
          {/* ============================================================== */}
          {tab === 'pengguna' && (() => {
            const filteredCustomers = customers.filter(c => {
              if (searchPengguna.trim() !== '') {
                const term = searchPengguna.toLowerCase();
                return (c.nama || '').toLowerCase().includes(term) || (c.email || '').toLowerCase().includes(term) || (c.no_hp || '').toLowerCase().includes(term);
              }
              return true;
            });

            const filteredMechanics = mechanics.filter(m => {
              if (searchPengguna.trim() !== '') {
                const term = searchPengguna.toLowerCase();
                return (m.nama || '').toLowerCase().includes(term) || (m.email || '').toLowerCase().includes(term) || (m.no_hp || '').toLowerCase().includes(term);
              }
              return true;
            });

            const filteredAdmins = pengguna.filter(p => p.role === 'admin').filter(a => {
              if (searchPengguna.trim() !== '') {
                const term = searchPengguna.toLowerCase();
                return (a.nama || '').toLowerCase().includes(term) || (a.email || '').toLowerCase().includes(term) || (a.no_hp || '').toLowerCase().includes(term);
              }
              return true;
            });

            return (
              <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Header & Quick Action */}
                <div style={{
                  background: '#fff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}>
                  <div>
                    <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a', fontSize: '1.4rem' }}>Manajemen Pengguna & Sumber Daya Operasional</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', marginTop: '4px' }}>
                      Kelola profil pelanggan terdaftar, pantau performa & beban kerja (workload) montir, serta atur akun admin dalam satu control center terpadu.
                    </p>
                  </div>
                  <button
                    onClick={() => { setPenggunaForm({ nama: '', email: '', password: '', no_hp: '', role: 'pelanggan' }); setShowPenggunaModal(true); }}
                    style={{
                      border: 'none',
                      background: 'linear-gradient(135deg,#f97316,#ea580c)',
                      color: '#fff',
                      padding: '12px 24px',
                      borderRadius: '12px',
                      fontSize: '0.85rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(234,88,12,0.2)'
                    }}
                  >
                    <i className="fas fa-user-plus"></i> Tambah Akun Pengguna
                  </button>
                </div>

                {/* Sub-Tabs & Search Row */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                  borderBottom: '2px solid #e2e8f0',
                  paddingBottom: '4px'
                }}>
                  {/* Sub-Tabs Selector */}
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[
                      { id: 'pelanggan', label: `👥 Pelanggan (${filteredCustomers.length})` },
                      { id: 'montir', label: `🔧 Montir / Teknisi (${filteredMechanics.length})` },
                      { id: 'admin', label: `🛡️ Administrator (${filteredAdmins.length})` }
                    ].map(st => {
                      const isActive = subTab === st.id;
                      return (
                        <button
                          key={st.id}
                          onClick={() => setSubTab(st.id)}
                          style={{
                            padding: '12px 20px',
                            border: 'none',
                            background: isActive ? 'rgba(234,88,12,0.08)' : 'transparent',
                            color: isActive ? '#ea580c' : '#64748b',
                            fontSize: '0.88rem',
                            fontWeight: isActive ? 900 : 700,
                            borderRadius: '12px 12px 0 0',
                            borderBottom: isActive ? '3px solid #ea580c' : '3px solid transparent',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                        >
                          {st.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Real-time Search input */}
                  <div style={{ position: 'relative', width: '280px' }}>
                    <i className="fas fa-search" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: '0.85rem' }}></i>
                    <input
                      type="text"
                      placeholder="Cari nama, email, no hp..."
                      value={searchPengguna}
                      onChange={(e) => setSearchPengguna(e.target.value)}
                      style={{
                        padding: '10px 16px 10px 38px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '12px',
                        fontSize: '0.85rem',
                        width: '100%',
                        outline: 'none',
                        transition: 'border 0.2s'
                      }}
                      onFocus={e => e.currentTarget.style.borderColor = '#ea580c'}
                      onBlur={e => e.currentTarget.style.borderColor = '#cbd5e1'}
                    />
                  </div>
                </div>

                {/* Sub-Tab Panel Renderers */}
                <div>
                  {/* PANEL 1: PELANGGAN (CRM VIEW) */}
                  {subTab === 'pelanggan' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: '24px'
                    }}>
                      {filteredCustomers.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                          <i className="fas fa-users-slash" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '12px' }}></i>
                          <h5 style={{ margin: 0, fontWeight: 800, color: '#475569' }}>Tidak Ada Data Pelanggan</h5>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>Silakan tambahkan akun pelanggan baru atau sesuaikan kata kunci pencarian Anda.</p>
                        </div>
                      ) : (
                        filteredCustomers.map(cust => (
                          <CustomerInsightCard
                            key={cust.id}
                            customer={cust}
                            onToggleBlacklist={toggleBlacklistCustomer}
                            onViewHistory={viewCustomerHistory}
                            onEdit={() => { setPenggunaForm({ ...cust, role: cust.role || 'pelanggan', password: '' }); setShowPenggunaModal(true); }}
                            onDelete={() => deletePengguna(cust.id)}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* PANEL 2: MONTIR (OPERATIONAL VIEW WITH REAL-TIME WORKLOAD) */}
                  {subTab === 'montir' && (
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                      gap: '24px'
                    }}>
                      {filteredMechanics.length === 0 ? (
                        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px', background: '#fff', borderRadius: '16px', border: '1px dashed #cbd5e1' }}>
                          <i className="fas fa-users-cog" style={{ fontSize: '2.5rem', color: '#94a3b8', marginBottom: '12px' }}></i>
                          <h5 style={{ margin: 0, fontWeight: 800, color: '#475569' }}>Tidak Ada Data Montir</h5>
                          <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b', marginTop: '4px' }}>Belum ada akun pengguna dengan role 'montir' terdaftar di sistem.</p>
                        </div>
                      ) : (
                        filteredMechanics.map(mech => (
                          <MechanicOperationalCard
                            key={mech.id}
                            mechanic={mech}
                            onUpdateSkills={updateMechanicSkills}
                            onEdit={() => { setPenggunaForm({ ...mech, role: mech.role || 'montir', password: '' }); setShowPenggunaModal(true); }}
                            onDelete={() => deletePengguna(mech.id)}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* PANEL 3: ADMINISTRATOR (BASIC ACCOUNT PANEL) */}
                  {subTab === 'admin' && (
                    <div style={{
                      background: '#fff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      overflow: 'hidden',
                      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '16px 24px', fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Nama Administrator</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>Alamat Email</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase' }}>No. Handphone</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Status Akun</th>
                            <th style={{ padding: '16px 24px', fontSize: '0.74rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', textAlign: 'center' }}>Aksi</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredAdmins.length === 0 ? (
                            <tr>
                              <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#64748b', fontWeight: 700 }}>
                                Tidak ada akun admin yang cocok dengan pencarian.
                              </td>
                            </tr>
                          ) : (
                            filteredAdmins.map(admin => (
                              <tr key={admin.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '16px 24px', fontWeight: 800, color: '#0f172a' }}>{admin.nama}</td>
                                <td style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>{admin.email}</td>
                                <td style={{ padding: '16px 24px', color: '#475569', fontWeight: 600 }}>{admin.no_hp || '-'}</td>
                                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                  <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '4px 10px', borderRadius: 50, background: '#fee2e2', color: '#b91c1c' }}>
                                    🛡️ SECURE ADMIN
                                  </span>
                                </td>
                                <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                                    <button onClick={() => { setPenggunaForm({ ...admin, role: admin.role || 'admin', password: '' }); setShowPenggunaModal(true); }} style={{ border: 'none', background: '#f1f5f9', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}><i className="fas fa-edit" style={{ color: '#475569' }}></i></button>
                                    <button onClick={() => deletePengguna(admin.id)} style={{ border: 'none', background: '#fef2f2', padding: '8px', borderRadius: '8px', cursor: 'pointer', transition: 'background 0.2s' }}><i className="fas fa-trash-alt" style={{ color: '#ef4444' }}></i></button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* ============================================================== */}
                {/* ⚠️ CUSTOMER HISTORY DETAILED MODAL DRAWER                      */}
                {/* ============================================================== */}
                {showHistoryModal && selectedCustomerHistory && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '20px', padding: '28px', width: '600px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>Riwayat Servis Pelanggan</h4>
                          <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>{selectedCustomerHistory.nama} ({selectedCustomerHistory.email})</span>
                        </div>
                        <button onClick={() => setShowHistoryModal(false)} style={{ border: 'none', background: '#f1f5f9', padding: '8px 12px', borderRadius: '50%', cursor: 'pointer', fontSize: '1rem', color: '#64748b' }}><i className="fas fa-times"></i></button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {customerHistoryList.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '32px', color: '#94a3b8', fontWeight: 700 }}>
                            Belum ada riwayat transaksi servis untuk pelanggan ini.
                          </div>
                        ) : (
                          customerHistoryList.map(h => (
                            <div key={h.id} style={{
                              border: '1px solid #e2e8f0',
                              borderRadius: '12px',
                              padding: '16px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: '#f8fafc'
                            }}>
                              <div>
                                <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>Ticket #{h.nomor_antrian}</strong>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                                  Layanan: <strong>{h.nama_layanan || 'Servis Umum'}</strong>
                                </span>
                                <span style={{ fontSize: '0.8rem', color: '#64748b', display: 'block', marginTop: '2px' }}>
                                  Kendaraan: <strong>{h.kendaraan || '-'}</strong>
                                </span>
                                <small style={{ color: '#94a3b8', display: 'block', marginTop: '4px' }}>Tanggal: {new Date(h.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</small>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                                <span style={{
                                  padding: '4px 10px',
                                  borderRadius: '50px',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  textTransform: 'uppercase',
                                  background: h.status === 'selesai' ? '#dcfce7' : h.status === 'dibatalkan' ? '#fee2e2' : '#fef9c3',
                                  color: h.status === 'selesai' ? '#15803d' : h.status === 'dibatalkan' ? '#b91c1c' : '#a16207'
                                }}>
                                  {h.status}
                                </span>
                                <strong style={{ fontSize: '1rem', color: '#16a34a' }}>
                                  {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(h.total_harga || 0)}
                                </strong>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ============================================================== */}
          {/* TAB 8: ARSIP OPERASIONAL                                       */}
          {/* ============================================================== */}
          {tab === 'archive' && (
            <div className="fade-in">
              <ArsipOperasional token={token} />
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 9: LAPORAN & ANALITIK (KPI MONTIR)                         */}
          {/* ============================================================== */}
          {tab === 'laporan' && (
            <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* TOP SUMMARY */}
              <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                <h5 style={{ margin: '0 0 4px 0', fontWeight: 800 }}><i className="fas fa-chart-pie" style={{ color: '#ea580c', marginRight: 8 }}></i> Laporan Pendapatan & Kinerja</h5>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Analitik total transaksi, omset yang dihasilkan, and performa penyelesaian per montir.</p>
              </div>

              {/* STATS ANALYTICS */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
                
                {/* REVENUE STAT CARD */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Estimasi Pendapatan</span>
                    <i className="fas fa-wallet" style={{ color: '#16a34a', fontSize: '1.2rem' }}></i>
                  </div>
                  <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>
                    Rp {laporan ? parseInt(laporan.total_pendapatan || 0).toLocaleString('id-ID') : '0'}
                  </h3>
                  <small style={{ color: '#64748b', display: 'block', marginTop: 8 }}>*Akumulasi omset dari jasa servis yang sukses diselesaikan.</small>
                </div>

                {/* COMPLETED STAT CARD */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <span style={{ fontSize: '0.78rem', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Total Servis Selesai</span>
                    <i className="fas fa-check-double" style={{ color: '#3b82f6', fontSize: '1.2rem' }}></i>
                  </div>
                  <h3 style={{ margin: 0, fontWeight: 900, color: '#0f172a' }}>
                    {laporan ? laporan.total_selesai : '0'} <span style={{ fontSize: '0.9rem', color: '#64748b' }}>Unit Kendaraan</span>
                  </h3>
                  <small style={{ color: '#64748b', display: 'block', marginTop: 8 }}>Total kendaraan yang berhasil dikerjakan.</small>
                </div>
              </div>

              {/* BAR CHART & SERVICE SUMMARY TABLE */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 24, marginBottom: 24 }}>
                
                {/* CHART JS: JUMLAH PESANAN PER LAYANAN */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                  <h6 style={{ margin: '0 0 20px 0', fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <i className="fas fa-chart-bar" style={{ color: '#3b82f6', marginRight: 8 }}></i>
                    Grafik Volume Pesanan per Layanan
                  </h6>
                  <div style={{ height: 320, position: 'relative' }}>
                    {laporan && laporan.per_layanan && laporan.per_layanan.length > 0 ? (
                      <Bar 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: { display: false },
                            tooltip: { 
                              backgroundColor: '#0f172a',
                              titleFont: { size: 14, weight: 'bold' },
                              padding: 12,
                              borderRadius: 8
                            }
                          },
                          scales: {
                            y: { beginAtZero: true, grid: { color: '#f1f5f9' }, ticks: { color: '#94a3b8' } },
                            x: { grid: { display: false }, ticks: { color: '#64748b', font: { weight: 'bold', size: 10 } } }
                          }
                        }}
                        data={{
                          labels: laporan.per_layanan.map(l => l.nama_layanan.length > 15 ? l.nama_layanan.substring(0,12) + '...' : l.nama_layanan),
                          datasets: [{
                            label: 'Total Pesanan',
                            data: laporan.per_layanan.map(l => l.total),
                            backgroundColor: [
                              'rgba(59, 130, 246, 0.8)',
                              'rgba(249, 115, 22, 0.8)',
                              'rgba(16, 185, 129, 0.8)',
                              'rgba(99, 102, 241, 0.8)',
                              'rgba(236, 72, 153, 0.8)'
                            ],
                            borderRadius: 6,
                            borderWidth: 0,
                            barThickness: 30
                          }]
                        }}
                      />
                    ) : (
                      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '0.9rem' }}>
                        Belum ada data pesanan layanan hari ini.
                      </div>
                    )}
                  </div>
                </div>

                {/* TABLE: SUMMARY PER LAYANAN */}
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                  <h6 style={{ margin: '0 0 20px 0', fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    <i className="fas fa-list-ul" style={{ color: '#10b981', marginRight: 8 }}></i>
                    Ringkasan Jasa Terpopuler
                  </h6>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {laporan && laporan.per_layanan && laporan.per_layanan.length > 0 ? (
                      laporan.per_layanan.map((l, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: '#f8fafc', borderRadius: 12, border: '1px solid #f1f5f9' }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#1e293b', fontSize: '0.85rem' }}>{i + 1}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a' }}>{l.nama_layanan}</div>
                            <div style={{ display: 'flex', gap: 12, marginTop: 2 }}>
                              <span style={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 700 }}>✅ {l.selesai} Selesai</span>
                              <span style={{ fontSize: '0.72rem', color: '#f59e0b', fontWeight: 700 }}>⏳ {l.menunggu} Antre</span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0f172a' }}>{l.total}</div>
                            <div style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>Pesanan</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ textAlign: 'center', padding: '30px 0', color: '#94a3b8' }}>Tidak ada data.</div>
                    )}
                  </div>
                </div>

              </div>

              {/* MECHANIC PERFORMANCE INDEX */}
              <div className="table-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
                <h6 style={{ margin: '0 0 16px 0', fontSize: '0.85rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  <i className="fas fa-star" style={{ color: '#eab308', marginRight: 6 }}></i>
                  Index Performa Mekanik (KPI)
                </h6>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 800, color: '#64748b' }}>
                        <th style={{ padding: 12 }}>Nama Montir</th>
                        <th style={{ padding: 12 }}>Total Layanan Ditangani</th>
                        <th style={{ padding: 12 }}>Servis Selesai</th>
                        <th style={{ padding: 12 }}>Servis Batal/Pending</th>
                        <th style={{ padding: 12 }}>Performance Index</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pengguna.filter(p => p.role === 'montir').map(m => {
                        const handled = antrian.filter(a => a.montir_id === m.id);
                        const done = handled.filter(a => a.status === 'selesai');
                        const canceled = handled.filter(a => a.status === 'dibatalkan' || a.status === 'menunggu_sparepart');
                        
                        const rate = handled.length > 0 ? Math.round((done.length / handled.length) * 100) : 100;
                        
                        return (
                          <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', fontSize: '0.8rem' }}>
                            <td style={{ padding: 12, fontWeight: 700, color: '#0f172a' }}>{m.nama}</td>
                            <td style={{ padding: 12, fontWeight: 600 }}>{handled.length} Kali</td>
                            <td style={{ padding: 12, color: '#16a34a', fontWeight: 700 }}>{done.length} Sukses</td>
                            <td style={{ padding: 12, color: '#ef4444', fontWeight: 700 }}>{canceled.length} Pending/Batal</td>
                            <td style={{ padding: 12 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <strong style={{ color: rate >= 80 ? '#16a34a' : '#d97706' }}>{rate}%</strong>
                                <div style={{ width: 100, height: 6, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                                  <div style={{ width: `${rate}%`, height: '100%', background: rate >= 80 ? '#10b981' : '#f59e0b', borderRadius: 4 }}></div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 10: REAL DATABASE AUDIT LOG TIMELINE                       */}
          {/* ============================================================== */}
          {tab === 'audit' && (
            <div className="fade-in table-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)' }}>
              <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: 16, marginBottom: 20 }}>
                <h5 style={{ margin: '0 0 4px 0', fontWeight: 800 }}><i className="fas fa-history" style={{ color: '#4f46e5', marginRight: 8 }}></i> Audit Trail Operasional</h5>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748b' }}>Log pencatatan aktivitas real-time transaksi database, perubahan status kendaraan, and actor penugasan.</p>
              </div>

              {auditLogs.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  <i className="fas fa-shield-alt" style={{ fontSize: '2rem', color: '#cbd5e1', marginBottom: 12, display: 'block' }}></i>
                  Belum ada log aktivitas tercatat di database hari ini.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingLeft: 12, borderLeft: '2px solid #e2e8f0' }}>
                  {auditLogs.map(log => (
                    <div key={log.id} style={{ position: 'relative', paddingLeft: 12 }}>
                      <div style={{ position: 'absolute', left: -18, top: 4, width: 10, height: 10, borderRadius: '50%', background: '#4f46e5', border: '2px solid #fff' }}></div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b' }}>
                        Tiket <span style={{ color: '#ea580c' }}>{log.nomor_antrian}</span> ({log.kendaraan}) - Status diubah dari <span style={{ textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', background: '#f1f5f9', borderRadius: 4 }}>{log.status_sebelumnya}</span> ke <span style={{ textTransform: 'uppercase', fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', background: '#dcfce7', color: '#15803d', borderRadius: 4 }}>{log.status_baru}</span>
                      </div>
                      <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: 4 }}>
                        Oleh: <strong style={{ color: '#334155' }}>{log.actor_nama || 'System'}</strong> ({log.actor_email || 'auto-trigger'})
                      </div>
                      {log.catatan && <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: '#b91c1c', fontStyle: 'italic' }}>Catatan: {log.catatan}</p>}
                      <small style={{ fontSize: '0.68rem', color: '#94a3b8', display: 'block', marginTop: 2 }}>{new Date(log.created_at).toLocaleString('id-ID')}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* TAB 11: PENGATURAN SYSTEM                                      */}
          {/* ============================================================== */}
          {tab === 'pengaturan' && (
            <div className="fade-in table-card" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.01)', maxWidth: 600 }}>
              <h5 style={{ margin: '0 0 16px 0', fontWeight: 800, borderBottom: '1px solid #f1f5f9', paddingBottom: 12 }}>Konfigurasi Operational Control</h5>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>Auto Sync Interval</label>
                  <select 
                    value={syncInterval}
                    onChange={(e) => setSyncInterval(parseInt(e.target.value))}
                    style={{ padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.82rem', width: '100%', background: '#fff', fontWeight: 700 }}
                  >
                    <option value={10000}>Setiap 10 Detik (Rekomendasi Polling)</option>
                    <option value={30000}>Setiap 30 Detik</option>
                    <option value={60000}>Setiap 1 Menit</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>Notifikasi Suara Panggilan</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input 
                      type="checkbox" 
                      checked={enableTTS}
                      onChange={(e) => setEnableTTS(e.target.checked)}
                      id="sound" 
                      style={{ width: 18, height: 18, cursor: 'pointer' }} 
                    />
                    <label htmlFor="sound" style={{ fontSize: '0.8rem', color: '#334155', fontWeight: 700, cursor: 'pointer' }}>Aktifkan text-to-speech otomatis saat memanggil nomor antrean</label>
                  </div>
                </div>

                <div style={{ marginTop: 12 }}>
                  <button 
                    onClick={() => {
                      localStorage.setItem('admin_sync_interval', syncInterval.toString());
                      localStorage.setItem('admin_enable_tts', enableTTS.toString());
                      showToast('Konfigurasi sistem berhasil disimpan!', 'success');
                    }}
                    style={{ border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', padding: '10px 20px', borderRadius: 10, fontSize: '0.85rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(234,88,12,0.25)' }}
                  >
                    Simpan Pengaturan
                  </button>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* ============================================================== */}
      {/* ⚠️ NEW: INSTANT QUICK ASSIGN MONTIR MODAL                      */}
      {/* ============================================================== */}
      {showAssignModal && assignTargetQueue && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, width: 440, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <h5 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', color: '#0f172a' }}>Tugaskan & Panggil Antrean</h5>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.78rem', color: '#64748b' }}>Pilih montir yang akan bertanggung jawab menangani tiket antrean ini.</p>
            </div>

            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 12, fontSize: '0.8rem', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>No. Antrean:</span>
                <strong style={{ color: '#ea580c' }}>{assignTargetQueue.nomor_antrian}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#64748b' }}>Pelanggan:</span>
                <strong style={{ color: '#334155' }}>{assignTargetQueue.nama_pelanggan || 'Guest'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Kendaraan:</span>
                <strong style={{ color: '#334155' }}>{assignTargetQueue.kendaraan}</strong>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 6 }}>PILIH MONTIR (YANG TERSEDIA)</label>
              <select
                value={selectedAssignMontirId}
                onChange={(e) => setSelectedAssignMontirId(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: 10, fontSize: '0.85rem', background: '#fff' }}
              >
                <option value="">-- Pilih Montir --</option>
                {pengguna.filter(p => p.role === 'montir' && p.is_aktif === 1).map(m => {
                  const activeServe = antrian.filter(a => a.montir_id === m.id && (a.status === 'sedang_dilayani' || a.status === 'dipanggil')).length;
                  return (
                    <option key={m.id} value={m.id}>
                      {m.nama} {activeServe > 0 ? `(Sibuk - Sedang melayani ${activeServe} antrean)` : '(Siap Kerja - Kosong)'}
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                onClick={() => { setShowAssignModal(false); setAssignTargetQueue(null); }}
                style={{ flex: 1, border: '1px solid #cbd5e1', background: '#fff', color: '#475569', padding: '10px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer' }}
              >
                Batal
              </button>
              <button
                onClick={() => aksiAntrianPanggil(assignTargetQueue.id, selectedAssignMontirId)}
                style={{ flex: 1, border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', padding: '10px', borderRadius: 10, fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', boxShadow: '0 4px 12px rgba(234,88,12,0.2)' }}
              >
                Simpan & Panggil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION REUSABLE MODAL */}
      <ConfirmModal
        isOpen={confirmConfig.isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        detail={confirmConfig.detail}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        onConfirm={confirmConfig.onConfirm}
        onCancel={closeConfirm}
        type={confirmConfig.type}
        isProcessing={confirmConfig.isProcessing}
      />

      {/* ============================================================== */}
      {/* ⚠️ LAYANAN MODAL CRUD                                          */}
      {/* ============================================================== */}
      {showLayananModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <form onSubmit={saveLayanan} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, width: 480, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h5 style={{ margin: 0, fontWeight: 800 }}>{layananForm.id ? 'Edit Jasa Servis' : 'Tambah Jasa Servis Baru'}</h5>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Kategori Unit Kendaraan</label>
                <select required value={layananForm.kategori_id} onChange={(e) => setLayananForm({...layananForm, kategori_id: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem', background: '#fff' }}>
                  <option value="">-- Pilih Kategori --</option>
                  {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama_kategori}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Nama Jasa Layanan</label>
                <input required type="text" value={layananForm.nama_layanan} onChange={(e) => setLayananForm({...layananForm, nama_layanan: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Deskripsi Kerusakan/Pekerjaan</label>
                <textarea rows="2" value={layananForm.deskripsi} onChange={(e) => setLayananForm({...layananForm, deskripsi: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem', resize: 'none' }}></textarea>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Estimasi Durasi (Menit)</label>
                  <input required type="number" value={layananForm.estimasi_menit} onChange={(e) => setLayananForm({...layananForm, estimasi_menit: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Tarif Harga Jasa (Rp)</label>
                  <input required type="number" value={layananForm.harga} onChange={(e) => setLayananForm({...layananForm, harga: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Status Jasa</label>
                <select value={layananForm.is_aktif} onChange={(e) => setLayananForm({...layananForm, is_aktif: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem', background: '#fff' }}>
                  <option value={1}>Aktif Menerima Order</option>
                  <option value={0}>Nonaktifkan Sementara</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" onClick={() => setShowLayananModal(false)} style={{ flex: 1, border: '1px solid #cbd5e1', background: '#fff', padding: 8, borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Batal</button>
              <button type="submit" style={{ flex: 1, border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', padding: 8, borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}>Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* ⚠️ KATEGORI MODAL CRUD                                         */}
      {/* ============================================================== */}
      {showKategoriModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <form onSubmit={saveKategori} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h5 style={{ margin: 0, fontWeight: 800 }}>{kategoriForm.id ? 'Edit Kategori Kendaraan' : 'Tambah Kategori Kendaraan'}</h5>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Nama Kategori</label>
                <input required type="text" placeholder="Contoh: Motor Matic, Mobil Sedan" value={kategoriForm.nama_kategori} onChange={(e) => setKategoriForm({...kategoriForm, nama_kategori: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Deskripsi Singkat</label>
                <textarea rows="2" value={kategoriForm.deskripsi} onChange={(e) => setKategoriForm({...kategoriForm, deskripsi: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem', resize: 'none' }}></textarea>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Icon FontAwesome</label>
                <select value={kategoriForm.icon} onChange={(e) => setKategoriForm({...kategoriForm, icon: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem', background: '#fff' }}>
                  <option value="motorcycle">Motor (motorcycle)</option>
                  <option value="car">Mobil (car)</option>
                  <option value="truck">Truk (truck)</option>
                  <option value="bicycle">Sepeda (bicycle)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" onClick={() => setShowKategoriModal(false)} style={{ flex: 1, border: '1px solid #cbd5e1', background: '#fff', padding: 8, borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Batal</button>
              <button type="submit" style={{ flex: 1, border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', padding: 8, borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}>Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* ⚠️ JADWAL MODAL CRUD                                           */}
      {/* ============================================================== */}
      {showJadwalModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <form onSubmit={saveJadwal} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, width: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h5 style={{ margin: 0, fontWeight: 800 }}>{jadwalForm.id ? 'Edit Slot Kapasitas' : 'Tambah Slot Kapasitas Baru'}</h5>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Hari Operasional</label>
                <select value={jadwalForm.hari} onChange={(e) => setJadwalForm({...jadwalForm, hari: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem', background: '#fff' }}>
                  {HARI.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Jam Buka</label>
                  <input required type="time" value={jadwalForm.jam_buka} onChange={(e) => setJadwalForm({...jadwalForm, jam_buka: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Jam Tutup</label>
                  <input required type="time" value={jadwalForm.jam_tutup} onChange={(e) => setJadwalForm({...jadwalForm, jam_tutup: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem' }} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Kuota Per-Slot Waktu</label>
                <input required type="number" value={jadwalForm.kuota_per_slot} onChange={(e) => setJadwalForm({...jadwalForm, kuota_per_slot: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Status Operasional Hari</label>
                <select value={jadwalForm.is_libur} onChange={(e) => setJadwalForm({...jadwalForm, is_libur: parseInt(e.target.value)})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem', background: '#fff' }}>
                  <option value={0}>Buka & Menerima Servis</option>
                  <option value={1}>Tutup / Libur Nasional</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" onClick={() => setShowJadwalModal(false)} style={{ flex: 1, border: '1px solid #cbd5e1', background: '#fff', padding: 8, borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Batal</button>
              <button type="submit" style={{ flex: 1, border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', padding: 8, borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}>Simpan</button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* ⚠️ PENGGUNA (ACCOUNT) MODAL CRUD                               */}
      {/* ============================================================== */}
      {showPenggunaModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <form onSubmit={savePengguna} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, padding: 28, width: 420, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h5 style={{ margin: 0, fontWeight: 800 }}>{penggunaForm.id ? 'Edit Akun Pengguna' : 'Buat Akun Pengguna Baru'}</h5>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Nama Lengkap</label>
                <input required type="text" value={penggunaForm.nama} onChange={(e) => setPenggunaForm({...penggunaForm, nama: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Email Akun</label>
                <input required type="email" value={penggunaForm.email} onChange={(e) => setPenggunaForm({...penggunaForm, email: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Password {penggunaForm.id && '(Kosongkan jika tidak diubah)'}</label>
                <input required={!penggunaForm.id} type="password" value={penggunaForm.password} onChange={(e) => setPenggunaForm({...penggunaForm, password: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>No. Handphone (Aktif)</label>
                <input required type="text" value={penggunaForm.no_hp} onChange={(e) => setPenggunaForm({...penggunaForm, no_hp: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem' }} />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', marginBottom: 4 }}>Tingkat Hak Akses</label>
                <select value={penggunaForm.role} onChange={(e) => setPenggunaForm({...penggunaForm, role: e.target.value})} style={{ width: '100%', padding: '8px 12px', border: '1px solid #cbd5e1', borderRadius: 8, fontSize: '0.8rem', background: '#fff' }}>
                  <option value="pelanggan">Pelanggan Umum</option>
                  <option value="montir">Teknisi / Montir</option>
                  <option value="admin">Administrator Sistem</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" onClick={() => setShowPenggunaModal(false)} style={{ flex: 1, border: '1px solid #cbd5e1', background: '#fff', padding: 8, borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700 }}>Batal</button>
              <button type="submit" style={{ flex: 1, border: 'none', background: 'linear-gradient(135deg,#f97316,#ea580c)', color: '#fff', padding: 8, borderRadius: 8, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 800 }}>Simpan</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
