import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ThemeProvider with ChangeNotifier {
  static const String _key = 'antrian_theme_mode';
  ThemeMode _mode = ThemeMode.system;

  ThemeMode get mode => _mode;
  bool get isDark => _mode == ThemeMode.dark;
  bool get isLight => _mode == ThemeMode.light;
  bool get isSystem => _mode == ThemeMode.system;

  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString(_key);
    switch (saved) {
      case 'dark': _mode = ThemeMode.dark; break;
      case 'light': _mode = ThemeMode.light; break;
      default: _mode = ThemeMode.system;
    }
    notifyListeners();
  }

  Future<void> setTheme(ThemeMode mode) async {
    _mode = mode;
    notifyListeners();
    final prefs = await SharedPreferences.getInstance();
    switch (mode) {
      case ThemeMode.dark: await prefs.setString(_key, 'dark'); break;
      case ThemeMode.light: await prefs.setString(_key, 'light'); break;
      case ThemeMode.system: await prefs.remove(_key); break;
    }
  }

  Future<void> toggleTheme() async {
    await setTheme(_mode == ThemeMode.dark ? ThemeMode.light : ThemeMode.dark);
  }
}
