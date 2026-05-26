import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import '../core/network/dio_client.dart';
import '../models/antrian_model.dart';
import '../models/layanan_model.dart';
import '../models/notifikasi_model.dart';
import '../models/jadwal_model.dart';
import '../models/kategori_kendaraan_model.dart';

class AntrianService {
  final Dio _dio = DioClient().dio;

  // GET /api/antrian — riwayat antrian pelanggan
  Future<List<AntrianModel>> fetchRiwayat() async {
    try {
      final response = await _dio.get('/antrian');
      if (response.statusCode == 200 && response.data is List) {
        return (response.data as List)
            .map((json) => AntrianModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetchRiwayat: \$e');
      return [];
    }
  }

  // GET /api/antrian/aktif — antrian aktif pelanggan hari ini
  Future<AntrianModel?> fetchAntrianAktif() async {
    try {
      final response = await _dio.get('/antrian/aktif');
      if (response.statusCode == 200 && response.data != null && response.data is Map) {
        return AntrianModel.fromJson(response.data as Map<String, dynamic>);
      }
      return null;
    } catch (e) {
      debugPrint('Error fetchAntrianAktif: \$e');
      return null;
    }
  }

  // POST /api/antrian — ambil antrian baru
  Future<Map<String, dynamic>> ambilAntrian({
    required List<int> layananIds,
    String? kendaraan,
    String? catatan,
  }) async {
    try {
      final response = await _dio.post('/antrian', data: {
        'layanan_id': layananIds.join(','),
        'kendaraan': kendaraan ?? '',
        'catatan': catatan ?? '',
      });
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response?.data is Map) {
        return {
          'success': false,
          'error': (e.response!.data as Map)['error'] ?? 'Gagal mengambil antrian',
        };
      }
      return {'success': false, 'error': 'Tidak dapat terhubung ke server'};
    }
  }

  // PUT /api/antrian/:id/batalkan
  Future<Map<String, dynamic>> batalkanAntrian(int id) async {
    try {
      final response = await _dio.put('/antrian/$id/batalkan');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response?.data is Map) {
        return {
          'success': false,
          'error': (e.response!.data as Map)['error'] ?? 'Gagal membatalkan',
        };
      }
      return {'success': false, 'error': 'Tidak dapat terhubung ke server'};
    }
  }

  // PUT /api/antrian/:id/verifikasi
  Future<Map<String, dynamic>> verifikasiAntrian(int id) async {
    try {
      final response = await _dio.put('/antrian/$id/verifikasi');
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response?.data is Map) {
        return {
          'success': false,
          'error': (e.response!.data as Map)['error'] ?? 'Gagal memverifikasi',
        };
      }
      return {'success': false, 'error': 'Tidak dapat terhubung ke server'};
    }
  }

  // PUT /api/antrian/:id/revisi
  Future<Map<String, dynamic>> revisiAntrian(int id, String catatanRevisi) async {
    try {
      final response = await _dio.put('/antrian/$id/revisi', data: {
        'catatan_revisi': catatanRevisi,
      });
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response?.data is Map) {
        return {
          'success': false,
          'error': (e.response!.data as Map)['error'] ?? 'Gagal mengajukan revisi',
        };
      }
      return {'success': false, 'error': 'Tidak dapat terhubung ke server'};
    }
  }

  // GET /api/layanan — daftar layanan aktif
  Future<List<LayananModel>> fetchLayanan() async {
    try {
      final response = await _dio.get('/layanan');
      if (response.statusCode == 200 && response.data is List) {
        return (response.data as List)
            .map((json) => LayananModel.fromJson(json as Map<String, dynamic>))
            .where((l) => l.aktif)
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetchLayanan: \$e');
      return [];
    }
  }

  // GET /api/kategori-kendaraan
  Future<List<KategoriKendaraanModel>> fetchKategoriKendaraan() async {
    try {
      final response = await _dio.get('/kategori-kendaraan');
      if (response.statusCode == 200 && response.data is List) {
        return (response.data as List)
            .map((json) => KategoriKendaraanModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetchKategoriKendaraan: $e');
      return [];
    }
  }

  // GET /api/jadwal
  Future<List<JadwalModel>> fetchJadwal() async {
    try {
      final response = await _dio.get('/jadwal');
      if (response.statusCode == 200 && response.data is List) {
        return (response.data as List)
            .map((json) => JadwalModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetchJadwal: $e');
      return [];
    }
  }

  // GET /api/notifikasi
  Future<List<NotifikasiModel>> fetchNotifikasi() async {
    try {
      final response = await _dio.get('/notifikasi');
      if (response.statusCode == 200 && response.data is List) {
        return (response.data as List)
            .map((json) => NotifikasiModel.fromJson(json as Map<String, dynamic>))
            .toList();
      }
      return [];
    } catch (e) {
      debugPrint('Error fetchNotifikasi: \$e');
      return [];
    }
  }

  // PUT /api/notifikasi/read-all
  Future<void> markAllNotifikasiRead() async {
    try {
      await _dio.put('/notifikasi/read-all');
    } catch (_) {
      // Silent fail
    }
  }
}
