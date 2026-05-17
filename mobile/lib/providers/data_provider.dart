import 'package:flutter/material.dart';
import '../models/antrian.dart';
import '../models/layanan.dart';
import '../services/api_service.dart';

class DataProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();

  List<Layanan> _layanan = [];
  Antrian? _antrianAktif;
  List<Antrian> _riwayatAntrian = [];
  bool _isLoading = false;

  List<Layanan> get layanan => _layanan;
  Antrian? get antrianAktif => _antrianAktif;
  List<Antrian> get riwayatAntrian => _riwayatAntrian;
  bool get isLoading => _isLoading;

  Future<void> loadInitialData() async {
    _isLoading = true;
    notifyListeners();

    try {
      _layanan = await _apiService.fetchLayanan();
      await fetchAntrianAktif();
    } catch (e) {
      // Handle error implicitly
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> fetchAntrianAktif() async {
    _antrianAktif = await _apiService.fetchAntrianAktif();
    notifyListeners();
  }

  Future<void> fetchRiwayat() async {
    _riwayatAntrian = await _apiService.fetchRiwayatAntrian();
    notifyListeners();
  }

  Future<Map<String, dynamic>> submitAntrian(List<int> layananIds, String kendaraan, String catatan) async {
    _isLoading = true;
    notifyListeners();

    final result = await _apiService.ambilAntrian(layananIds, kendaraan, catatan);
    
    if (result['success'] == true) {
      await fetchAntrianAktif();
    }
    
    _isLoading = false;
    notifyListeners();
    
    return result;
  }

  Future<bool> cancelAntrian(int id) async {
    _isLoading = true;
    notifyListeners();

    final success = await _apiService.batalkanAntrian(id);
    if (success) {
      _antrianAktif = null;
      await fetchRiwayat();
    }

    _isLoading = false;
    notifyListeners();
    return success;
  }
}
