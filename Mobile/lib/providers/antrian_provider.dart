import 'package:flutter/material.dart';
import '../models/antrian_model.dart';
import '../models/layanan_model.dart';
import '../models/notifikasi_model.dart';
import '../models/kategori_kendaraan_model.dart';
import '../services/antrian_service.dart';

class AntrianProvider with ChangeNotifier {
  final AntrianService _service = AntrianService();

  // State
  AntrianModel? _antrianAktif;
  List<AntrianModel> _riwayat = [];
  List<LayananModel> _layanan = [];
  List<KategoriKendaraanModel> _kategoriList = [];
  List<NotifikasiModel> _notifikasi = [];
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _errorMessage;

  // Getters
  AntrianModel? get antrianAktif => _antrianAktif;
  List<AntrianModel> get riwayat => _riwayat;
  List<LayananModel> get layanan => _layanan;
  List<KategoriKendaraanModel> get kategoriList => _kategoriList;
  List<NotifikasiModel> get notifikasi => _notifikasi;
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get errorMessage => _errorMessage;
  int get unreadNotifCount => _notifikasi.where((n) => !n.isRead).length;

  // Load all data for dashboard
  Future<void> loadDashboard() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _service.fetchAntrianAktif(),
        _service.fetchLayanan(),
        _service.fetchNotifikasi(),
        _service.fetchKategoriKendaraan(),
      ]);
      _antrianAktif = results[0] as AntrianModel?;
      _layanan = results[1] as List<LayananModel>;
      _notifikasi = results[2] as List<NotifikasiModel>;
      _kategoriList = results[3] as List<KategoriKendaraanModel>;
    } catch (e) {
      _errorMessage = 'Gagal memuat data. Coba tarik ke bawah untuk refresh.';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Refresh antrian aktif only
  Future<void> refreshAntrianAktif() async {
    _antrianAktif = await _service.fetchAntrianAktif();
    notifyListeners();
  }

  // Load riwayat
  Future<void> loadRiwayat() async {
    _isLoading = true;
    notifyListeners();

    _riwayat = await _service.fetchRiwayat();

    _isLoading = false;
    notifyListeners();
  }

  // Load layanan & kategori for ambil antrian screen
  Future<void> loadLayanan() async {
    if (_layanan.isNotEmpty && _kategoriList.isNotEmpty) return;
    _isLoading = true;
    notifyListeners();
    
    final results = await Future.wait([
      _service.fetchLayanan(),
      _service.fetchKategoriKendaraan()
    ]);
    _layanan = results[0] as List<LayananModel>;
    _kategoriList = results[1] as List<KategoriKendaraanModel>;
    
    _isLoading = false;
    notifyListeners();
  }

  // Submit antrian
  Future<Map<String, dynamic>> submitAntrian({
    required List<int> layananIds,
    String? kendaraan,
    String? catatan,
  }) async {
    _isSubmitting = true;
    notifyListeners();

    final result = await _service.ambilAntrian(
      layananIds: layananIds,
      kendaraan: kendaraan,
      catatan: catatan,
    );

    if (result['success'] == true) {
      await refreshAntrianAktif();
    }

    _isSubmitting = false;
    notifyListeners();
    return result;
  }

  // Cancel antrian
  Future<Map<String, dynamic>> cancelAntrian(int id) async {
    _isSubmitting = true;
    notifyListeners();

    final result = await _service.batalkanAntrian(id);

    if (result['success'] == true) {
      _antrianAktif = null;
      await loadRiwayat();
    }

    _isSubmitting = false;
    notifyListeners();
    return result;
  }

  // Load notifikasi
  Future<void> loadNotifikasi() async {
    _notifikasi = await _service.fetchNotifikasi();
    notifyListeners();
  }

  // Mark all notif read
  Future<void> markAllRead() async {
    await _service.markAllNotifikasiRead();
    _notifikasi = _notifikasi.map((n) => NotifikasiModel(
      id: n.id,
      antrianId: n.antrianId,
      pesan: n.pesan,
      tipe: n.tipe,
      isRead: true,
      sentAt: n.sentAt,
      nomorAntrian: n.nomorAntrian,
    )).toList();
    notifyListeners();
  }
}
