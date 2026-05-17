import 'package:dio/dio.dart';
import '../core/network/dio_client.dart';
import '../models/antrian_model.dart';
import '../models/layanan_model.dart';
import '../models/jadwal_model.dart';
import '../models/user_model.dart';
import '../models/laporan_model.dart';

class AdminService {
  final Dio _dio = DioClient().dio;

  // =================== LAPORAN ===================
  Future<LaporanModel?> fetchLaporan() async {
    try {
      final res = await _dio.get('/laporan');
      if (res.statusCode == 200 && res.data is Map) {
        return LaporanModel.fromJson(res.data as Map<String, dynamic>);
      }
      return null;
    } catch (_) { return null; }
  }

  // =================== ANTRIAN ===================
  Future<List<AntrianModel>> fetchAntrianAdmin({String? tanggal}) async {
    try {
      final res = await _dio.get('/antrian', queryParameters: tanggal != null ? {'tanggal': tanggal} : null);
      if (res.statusCode == 200 && res.data is List) {
        return (res.data as List).map((e) => AntrianModel.fromJson(e as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) { return []; }
  }

  Future<Map<String, dynamic>> panggilAntrian(int id, {int? montirId}) async {
    try {
      final res = await _dio.put('/antrian/$id/panggil', data: montirId != null ? {'montir_id': montirId} : null);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  Future<Map<String, dynamic>> setDilayani(int id) async {
    try {
      final res = await _dio.put('/antrian/$id/dilayani');
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  Future<Map<String, dynamic>> setSelesai(int id) async {
    try {
      final res = await _dio.put('/antrian/$id/selesai');
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  Future<Map<String, dynamic>> batalkanAntrian(int id) async {
    try {
      final res = await _dio.put('/antrian/$id/batalkan');
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  // =================== LAYANAN ===================
  Future<List<LayananModel>> fetchLayanan() async {
    try {
      final res = await _dio.get('/layanan');
      if (res.statusCode == 200 && res.data is List) {
        return (res.data as List).map((e) => LayananModel.fromJson(e as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) { return []; }
  }

  Future<Map<String, dynamic>> createLayanan(Map<String, dynamic> data) async {
    try {
      final res = await _dio.post('/layanan', data: data);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  Future<Map<String, dynamic>> updateLayanan(int id, Map<String, dynamic> data) async {
    try {
      final res = await _dio.put('/layanan/$id', data: data);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  Future<Map<String, dynamic>> deleteLayanan(int id) async {
    try {
      final res = await _dio.delete('/layanan/$id');
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  // =================== JADWAL ===================
  Future<List<JadwalModel>> fetchJadwal() async {
    try {
      final res = await _dio.get('/jadwal');
      if (res.statusCode == 200 && res.data is List) {
        return (res.data as List).map((e) => JadwalModel.fromJson(e as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) { return []; }
  }

  Future<Map<String, dynamic>> updateJadwal(int id, Map<String, dynamic> data) async {
    try {
      final res = await _dio.put('/jadwal/$id', data: data);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  // =================== USERS ===================
  Future<List<UserModel>> fetchUsers() async {
    try {
      final res = await _dio.get('/auth/users');
      if (res.statusCode == 200 && res.data is Map && res.data['data'] is List) {
        return (res.data['data'] as List).map((e) => UserModel.fromJson(e as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) { return []; }
  }

  Future<List<UserModel>> fetchMontir() async {
    try {
      final res = await _dio.get('/auth/montir');
      if (res.statusCode == 200 && res.data is Map && res.data['data'] is List) {
        return (res.data['data'] as List).map((e) => UserModel.fromJson(e as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) { return []; }
  }

  Future<Map<String, dynamic>> createUser(Map<String, dynamic> data) async {
    try {
      final res = await _dio.post('/auth/users', data: data);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  Future<Map<String, dynamic>> updateUser(int id, Map<String, dynamic> data) async {
    try {
      final res = await _dio.put('/auth/users/$id', data: data);
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  Future<Map<String, dynamic>> deleteUser(int id) async {
    try {
      final res = await _dio.delete('/auth/users/$id');
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  String _extractError(DioException e) {
    if (e.response?.data is Map) {
      final d = e.response!.data as Map;
      return d['error']?.toString() ?? d['message']?.toString() ?? 'Terjadi kesalahan';
    }
    return 'Tidak dapat terhubung ke server';
  }
}
