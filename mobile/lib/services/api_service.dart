import 'package:dio/dio.dart';
import '../core/network/dio_client.dart';
import '../models/antrian.dart';
import '../models/layanan.dart';

class ApiService {
  final DioClient _dioClient = DioClient();

  // Layanan
  Future<List<Layanan>> fetchLayanan() async {
    try {
      final response = await _dioClient.dio.get('/layanan');
      if (response.statusCode == 200) {
        List<dynamic> data = response.data;
        return data.map((json) => Layanan.fromJson(json)).where((l) => l.isAktif == 1).toList();
      }
      return [];
    } catch (e) {
      throw Exception('Gagal mengambil data layanan');
    }
  }

  // Antrian Aktif (Customer)
  Future<Antrian?> fetchAntrianAktif() async {
    try {
      final response = await _dioClient.dio.get('/antrian/aktif');
      if (response.statusCode == 200 && response.data != null && response.data.toString().isNotEmpty) {
        return Antrian.fromJson(response.data);
      }
      return null;
    } catch (e) {
      // Return null instead of throwing exception for empty state handling
      return null;
    }
  }

  // Riwayat Antrian (Customer)
  Future<List<Antrian>> fetchRiwayatAntrian() async {
    try {
      final response = await _dioClient.dio.get('/antrian');
      if (response.statusCode == 200) {
        List<dynamic> data = response.data;
        return data.map((json) => Antrian.fromJson(json)).toList();
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  // Ambil Antrian (Customer)
  Future<Map<String, dynamic>> ambilAntrian(List<int> layananIds, String kendaraan, String catatan) async {
    try {
      final response = await _dioClient.dio.post('/antrian', data: {
        'layanan_id': layananIds.join(','),
        'kendaraan': kendaraan,
        'catatan': catatan,
      });
      return response.data;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        return {'success': false, 'error': e.response?.data['error'] ?? 'Terjadi kesalahan'};
      }
      return {'success': false, 'error': 'Gagal terhubung ke server'};
    }
  }

  // Batalkan Antrian (Customer)
  Future<bool> batalkanAntrian(int id) async {
    try {
      final response = await _dioClient.dio.put('/antrian/$id/batalkan');
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
