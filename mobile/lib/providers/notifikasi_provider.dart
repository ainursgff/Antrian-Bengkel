import 'dart:async';
import 'package:flutter/material.dart';
import '../models/notifikasi_model.dart';
import '../services/antrian_service.dart';

class NotifikasiProvider with ChangeNotifier {
  final AntrianService _service = AntrianService();

  List<NotifikasiModel> _notifikasi = [];
  bool _isLoading = false;
  Timer? _pollTimer;

  List<NotifikasiModel> get notifikasi => _notifikasi;
  bool get isLoading => _isLoading;
  int get unreadCount => _notifikasi.where((n) => !n.isRead).length;

  // Load notifikasi
  Future<void> load() async {
    _isLoading = true;
    notifyListeners();
    _notifikasi = await _service.fetchNotifikasi();
    _isLoading = false;
    notifyListeners();
  }

  // Silent refresh (no loading indicator)
  Future<void> silentRefresh() async {
    final fresh = await _service.fetchNotifikasi();
    if (fresh.length != _notifikasi.length ||
        (fresh.isNotEmpty && _notifikasi.isNotEmpty && fresh.first.id != _notifikasi.first.id)) {
      _notifikasi = fresh;
      notifyListeners();
    }
  }

  // Start polling every 15 seconds
  void startPolling() {
    stopPolling();
    _pollTimer = Timer.periodic(const Duration(seconds: 15), (_) {
      silentRefresh();
    });
  }

  // Stop polling
  void stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
  }

  // Mark single read (optimistic UI update)
  Future<void> markRead(int id) async {
    _notifikasi = _notifikasi.map((n) {
      if (n.id == id) {
        return NotifikasiModel(
          id: n.id, antrianId: n.antrianId, pesan: n.pesan,
          tipe: n.tipe, isRead: true, sentAt: n.sentAt, nomorAntrian: n.nomorAntrian,
        );
      }
      return n;
    }).toList();
    notifyListeners();
  }

  // Mark all read
  Future<void> markAllRead() async {
    await _service.markAllNotifikasiRead();
    _notifikasi = _notifikasi.map((n) => NotifikasiModel(
      id: n.id, antrianId: n.antrianId, pesan: n.pesan,
      tipe: n.tipe, isRead: true, sentAt: n.sentAt, nomorAntrian: n.nomorAntrian,
    )).toList();
    notifyListeners();
  }

  @override
  void dispose() {
    stopPolling();
    super.dispose();
  }
}
