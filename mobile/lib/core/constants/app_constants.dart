class AppConstants {
  AppConstants._();

  static const String appName = 'Antrian Bengkel';
  static const String appTagline = 'Sistem Antrian Digital Premium';

  // API Base URL
  // Android Emulator: 10.0.2.2 | iOS Simulator: localhost | Real Device: your local IP
  static const String baseUrl = 'http://10.0.2.2:5001/api';

  // Storage Keys
  static const String tokenKey = 'antrian_auth_token';
  static const String userKey = 'antrian_user_data';
  static const String roleKey = 'antrian_user_role';
  static const String onboardingKey = 'antrian_onboarding_done';

  // Roles
  static const String rolePelanggan = 'pelanggan';
  static const String roleAdmin = 'admin';
  static const String roleMontir = 'montir';

  // Status Antrian
  static const String statusMenunggu = 'menunggu';
  static const String statusDipanggil = 'dipanggil';
  static const String statusDilayani = 'sedang_dilayani';
  static const String statusSelesai = 'selesai';
  static const String statusDibatalkan = 'dibatalkan';
}
