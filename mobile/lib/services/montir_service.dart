import 'package:dio/dio.dart';
import '../core/network/dio_client.dart';
import '../models/antrian_model.dart';

class MontirService {
  final Dio _dio = DioClient().dio;

  // GET /api/antrian — antrian assigned to montir (filtered by backend)
  Future<List<AntrianModel>> fetchAntrianMontir({String? tanggal}) async {
    try {
      final res = await _dio.get('/antrian', queryParameters: tanggal != null ? {'tanggal': tanggal} : null);
      if (res.statusCode == 200 && res.data is List) {
        return (res.data as List).map((e) => AntrianModel.fromJson(e as Map<String, dynamic>)).toList();
      }
      return [];
    } catch (_) { return []; }
  }

  // PUT /api/antrian/:id/dilayani
  Future<Map<String, dynamic>> setDilayani(int id) async {
    try {
      final res = await _dio.put('/antrian/$id/dilayani');
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  // PUT /api/antrian/:id/selesai
  Future<Map<String, dynamic>> setSelesai(int id) async {
    try {
      final res = await _dio.put('/antrian/$id/selesai');
      return res.data as Map<String, dynamic>;
    } on DioException catch (e) {
      return {'success': false, 'error': _extractError(e)};
    }
  }

  String _extractError(DioException e) {
    if (e.response?.data is Map) {
      return (e.response!.data as Map)['error']?.toString() ?? 'Terjadi kesalahan';
    }
    return 'Tidak dapat terhubung ke server';
  }
}
