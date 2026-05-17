import 'package:flutter/material.dart';
import '../models/antrian_model.dart';
import '../services/montir_service.dart';

class MontirProvider with ChangeNotifier {
  final MontirService _service = MontirService();

  List<AntrianModel> _antrian = [];
  bool _isLoading = false;
  bool _isSubmitting = false;
  String? _error;

  List<AntrianModel> get antrian => _antrian;
  bool get isLoading => _isLoading;
  bool get isSubmitting => _isSubmitting;
  String? get error => _error;

  List<AntrianModel> get antrianAktif =>
      _antrian.where((a) => a.status == 'dipanggil' || a.status == 'sedang_dilayani').toList();

  List<AntrianModel> get antrianSelesai =>
      _antrian.where((a) => a.status == 'selesai').toList();

  List<AntrianModel> get antrianMenunggu =>
      _antrian.where((a) => a.status == 'menunggu').toList();

  int get totalDikerjakan => _antrian.where((a) => a.status == 'selesai').length;
  int get totalAktif => antrianAktif.length;

  Future<void> loadAntrian({String? tanggal}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _antrian = await _service.fetchAntrianMontir(tanggal: tanggal);
    } catch (e) {
      _error = 'Gagal memuat data antrian';
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<Map<String, dynamic>> setDilayani(int id) async {
    _isSubmitting = true;
    notifyListeners();
    final r = await _service.setDilayani(id);
    if (r['success'] == true) await loadAntrian();
    _isSubmitting = false;
    notifyListeners();
    return r;
  }

  Future<Map<String, dynamic>> setSelesai(int id) async {
    _isSubmitting = true;
    notifyListeners();
    final r = await _service.setSelesai(id);
    if (r['success'] == true) await loadAntrian();
    _isSubmitting = false;
    notifyListeners();
    return r;
  }
}
