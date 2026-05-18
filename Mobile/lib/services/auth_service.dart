import 'package:dio/dio.dart';
import '../core/network/dio_client.dart';

class AuthService {
  final Dio _dio = DioClient().dio;

  Future<Map<String, dynamic>> login(String email, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map<String, dynamic>) {
          return {
            'success': false,
            'message': data['message'] ?? data['error'] ?? 'Login gagal',
          };
        }
      }
      return {'success': false, 'message': 'Tidak dapat terhubung ke server'};
    }
  }

  Future<Map<String, dynamic>> register(String nama, String email, String password, String noHp) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'nama': nama,
        'email': email,
        'password': password,
        'no_hp': noHp,
      });
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map<String, dynamic>) {
          return {
            'success': false,
            'message': data['message'] ?? data['error'] ?? 'Registrasi gagal',
          };
        }
      }
      return {'success': false, 'message': 'Tidak dapat terhubung ke server'};
    }
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    try {
      final response = await _dio.post('/auth/forgot-password', data: {
        'email': email,
      });
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map<String, dynamic>) {
          return {
            'success': false,
            'message': data['message'] ?? data['error'] ?? 'Gagal memverifikasi email',
          };
        }
      }
      return {'success': false, 'message': 'Tidak dapat terhubung ke server'};
    }
  }

  Future<Map<String, dynamic>> resetPassword(String email, String newPassword) async {
    try {
      final response = await _dio.post('/auth/reset-password', data: {
        'email': email,
        'password': newPassword,
      });
      return response.data as Map<String, dynamic>;
    } on DioException catch (e) {
      if (e.response != null && e.response?.data != null) {
        final data = e.response!.data;
        if (data is Map<String, dynamic>) {
          return {
            'success': false,
            'message': data['message'] ?? data['error'] ?? 'Gagal reset password',
          };
        }
      }
      return {'success': false, 'message': 'Tidak dapat terhubung ke server'};
    }
  }

  Future<void> logout() async {
    try {
      await _dio.post('/auth/logout');
    } catch (_) {
      // Silent fail — always clear local data regardless
    }
  }
}
