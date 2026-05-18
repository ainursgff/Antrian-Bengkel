import 'package:flutter/material.dart';
import '../core/network/dio_client.dart';
import '../services/auth_service.dart';
import '../services/auth_storage.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();

  bool _isAuthenticated = false;
  bool _isLoading = false;
  String? _role;
  Map<String, dynamic>? _user;
  String? _errorMessage;

  bool get isAuthenticated => _isAuthenticated;
  bool get isLoading => _isLoading;
  String? get role => _role;
  Map<String, dynamic>? get user => _user;
  String? get errorMessage => _errorMessage;

  // Check stored auth state on app start
  Future<void> checkAuthStatus() async {
    final loggedIn = await AuthStorage.isLoggedIn();
    if (loggedIn) {
      _isAuthenticated = true;
      _role = await AuthStorage.getRole();
      _user = await AuthStorage.getUser();
    } else {
      _isAuthenticated = false;
      _role = null;
      _user = null;
    }
    notifyListeners();
  }

  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _authService.login(email, password);

    if (result['success'] == true) {
      await AuthStorage.saveToken(result['token']);
      await AuthStorage.saveRole(result['user']['role']);
      await AuthStorage.saveUser(result['user']);

      _isAuthenticated = true;
      _role = result['user']['role'];
      _user = result['user'];
      _errorMessage = null;
    } else {
      _errorMessage = result['message'] ?? 'Login gagal';
    }

    _isLoading = false;
    notifyListeners();
    return result['success'] == true;
  }

  Future<Map<String, dynamic>> register(String nama, String email, String password, String noHp) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _authService.register(nama, email, password, noHp);

    if (result['success'] != true) {
      _errorMessage = result['message'] ?? 'Registrasi gagal';
    }

    _isLoading = false;
    notifyListeners();
    return result;
  }

  Future<Map<String, dynamic>> forgotPassword(String email) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _authService.forgotPassword(email);

    _isLoading = false;
    notifyListeners();
    return result;
  }

  Future<Map<String, dynamic>> resetPassword(String email, String newPassword) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    final result = await _authService.resetPassword(email, newPassword);

    _isLoading = false;
    notifyListeners();
    return result;
  }

  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    await _authService.logout();
    await AuthStorage.clearAll();
    DioClient.reset();

    _isAuthenticated = false;
    _role = null;
    _user = null;
    _errorMessage = null;
    _isLoading = false;
    notifyListeners();
  }

  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
