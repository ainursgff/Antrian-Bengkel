import 'package:flutter/foundation.dart' show kIsWeb, kReleaseMode;

enum Environment { dev, staging, production }

class EnvConfig {
  EnvConfig._();

  static Environment _current = Environment.dev;

  static Environment get current => _current;

  static void init(Environment env) {
    _current = env;
  }

  static bool get isProduction => _current == Environment.production;
  static bool get isStaging => _current == Environment.staging;
  static bool get isDev => _current == Environment.dev;

  // Auto-detect: in release mode default to production
  static String get baseUrl {
    if (kReleaseMode) return _productionBaseUrl;

    switch (_current) {
      case Environment.production:
        return _productionBaseUrl;
      case Environment.staging:
        return _stagingBaseUrl;
      case Environment.dev:
        return _devBaseUrl;
    }
  }

  // Development — auto-detect platform
  static String get _devBaseUrl =>
      kIsWeb ? 'http://localhost:5001/api' : 'http://10.0.2.2:5001/api';

  // Staging (change to your staging server IP)
  static String get _stagingBaseUrl =>
      'http://192.168.1.100:5001/api';

  // Production (change to your production URL)
  static String get _productionBaseUrl =>
      'https://api.antrianbengkel.com/api';

  static bool get enableLogging => !kReleaseMode;
  static int get apiTimeoutSeconds => isProduction ? 30 : 15;
  static int get maxRetries => isProduction ? 3 : 2;
  static int get pollingIntervalSeconds => isProduction ? 30 : 15;
}
