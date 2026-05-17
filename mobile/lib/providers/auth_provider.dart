import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/network/dio_client.dart';

class AuthProvider with ChangeNotifier {
  final DioClient _dioClient = DioClient();
  
  bool _isAuthenticated = false;
  String? _token;
  String? _role;
  Map<String, dynamic>? _user;
  
  bool get isAuthenticated => _isAuthenticated;
  String? get role => _role;
  Map<String, dynamic>? get user => _user;
  
  Future<void> checkAuthStatus() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('antrian_token');
    _role = prefs.getString('antrian_role');
    final userStr = prefs.getString('antrian_user');
    
    if (_token != null && userStr != null) {
      _isAuthenticated = true;
      _user = jsonDecode(userStr);
    } else {
      _isAuthenticated = false;
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    try {
      final response = await _dioClient.dio.post('/auth/login', data: {
        'email': email,
        'password': password,
      });

      if (response.statusCode == 200 && response.data['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('antrian_token', response.data['token']);
        await prefs.setString('antrian_role', response.data['user']['role']);
        await prefs.setString('antrian_user', jsonEncode(response.data['user']));
        
        await checkAuthStatus();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<void> logout() async {
    try {
      await _dioClient.dio.post('/auth/logout');
    } catch (e) {
      // Ignore network error on logout
    } finally {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('antrian_token');
      await prefs.remove('antrian_role');
      await prefs.remove('antrian_user');
      
      _isAuthenticated = false;
      _token = null;
      _role = null;
      _user = null;
      
      notifyListeners();
    }
  }
}
