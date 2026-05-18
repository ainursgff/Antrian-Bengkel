import 'package:flutter/material.dart';
import '../models/antrian_model.dart';
import '../models/layanan_model.dart';
import '../models/jadwal_model.dart';
import '../models/user_model.dart';
import '../models/laporan_model.dart';
import '../models/kategori_kendaraan_model.dart';
import '../services/admin_service.dart';

class AdminProvider with ChangeNotifier {
  final AdminService _service = AdminService();

  LaporanModel? _laporan;
  List<AntrianModel> _antrian = [];
  List<LayananModel> _layanan = [];
  List<JadwalModel> _jadwal = [];
  List<UserModel> _users = [];
  List<UserModel> _montirList = [];
  List<KategoriKendaraanModel> _kategoriList = [];
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _error;

  LaporanModel? get laporan => _laporan;
  List<AntrianModel> get antrian => _antrian;
  List<LayananModel> get layanan => _layanan;
  List<JadwalModel> get jadwal => _jadwal;
  List<UserModel> get users => _users;
  List<UserModel> get montirList => _montirList;
  List<KategoriKendaraanModel> get kategoriList => _kategoriList;
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get error => _error;

  // ========== DASHBOARD ==========
  Future<void> loadDashboard() async {
    _isLoading = true;
    _error = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        _service.fetchLaporan(),
        _service.fetchAntrianAdmin(),
        _service.fetchMontir(),
      ]);
      _laporan = results[0] as LaporanModel?;
      _antrian = results[1] as List<AntrianModel>;
      _montirList = results[2] as List<UserModel>;
    } catch (e) {
      _error = 'Gagal memuat data dashboard';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // ========== ANTRIAN ==========
  Future<void> loadAntrian({String? tanggal}) async {
    _isLoading = true; notifyListeners();
    _antrian = await _service.fetchAntrianAdmin(tanggal: tanggal);
    _isLoading = false; notifyListeners();
  }

  Future<Map<String, dynamic>> panggilAntrian(int id, {int? montirId}) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.panggilAntrian(id, montirId: montirId);
    if (r['success'] == true) await loadAntrian();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  Future<Map<String, dynamic>> setDilayani(int id) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.setDilayani(id);
    if (r['success'] == true) await loadAntrian();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  Future<Map<String, dynamic>> setSelesai(int id) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.setSelesai(id);
    if (r['success'] == true) await loadAntrian();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  Future<Map<String, dynamic>> batalkanAntrian(int id) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.batalkanAntrian(id);
    if (r['success'] == true) await loadAntrian();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  // ========== LAYANAN ==========
  Future<void> loadLayanan() async {
    _isLoading = true; notifyListeners();
    _layanan = await _service.fetchLayanan();
    _isLoading = false; notifyListeners();
  }

  Future<Map<String, dynamic>> createLayanan(Map<String, dynamic> data) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.createLayanan(data);
    if (r['success'] == true) await loadLayanan();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  Future<Map<String, dynamic>> updateLayanan(int id, Map<String, dynamic> data) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.updateLayanan(id, data);
    if (r['success'] == true) await loadLayanan();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  Future<Map<String, dynamic>> deleteLayanan(int id) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.deleteLayanan(id);
    if (r['success'] == true) await loadLayanan();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  // ========== JADWAL ==========
  Future<void> loadJadwal() async {
    _isLoading = true; notifyListeners();
    _jadwal = await _service.fetchJadwal();
    _isLoading = false; notifyListeners();
  }

  Future<Map<String, dynamic>> updateJadwal(int id, Map<String, dynamic> data) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.updateJadwal(id, data);
    if (r['success'] == true) await loadJadwal();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  Future<Map<String, dynamic>> createJadwal(Map<String, dynamic> data) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.createJadwal(data);
    if (r['success'] == true) await loadJadwal();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  Future<Map<String, dynamic>> deleteJadwal(int id) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.deleteJadwal(id);
    if (r['success'] == true) await loadJadwal();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  // ========== USERS ==========
  Future<void> loadUsers() async {
    _isLoading = true; notifyListeners();
    _users = await _service.fetchUsers();
    _isLoading = false; notifyListeners();
  }

  Future<Map<String, dynamic>> createUser(Map<String, dynamic> data) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.createUser(data);
    if (r['success'] == true) await loadUsers();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  Future<Map<String, dynamic>> updateUser(int id, Map<String, dynamic> data) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.updateUser(id, data);
    if (r['success'] == true) await loadUsers();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  Future<Map<String, dynamic>> deleteUser(int id) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.deleteUser(id);
    if (r['success'] == true) await loadUsers();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  // ========== KATEGORI KENDARAAN ==========
  Future<void> loadKategori() async {
    _isLoading = true; notifyListeners();
    _kategoriList = await _service.fetchKategori();
    _isLoading = false; notifyListeners();
  }

  Future<Map<String, dynamic>> createKategori(Map<String, dynamic> data) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.createKategori(data);
    if (r['success'] == true) await loadKategori();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  Future<Map<String, dynamic>> updateKategori(int id, Map<String, dynamic> data) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.updateKategori(id, data);
    if (r['success'] == true) await loadKategori();
    _isSubmitting = false; notifyListeners();
    return r;
  }

  Future<Map<String, dynamic>> deleteKategori(int id) async {
    _isSubmitting = true; notifyListeners();
    final r = await _service.deleteKategori(id);
    if (r['success'] == true) {
      await loadKategori();
      await loadLayanan();
    }
    _isSubmitting = false; notifyListeners();
    return r;
  }
}
