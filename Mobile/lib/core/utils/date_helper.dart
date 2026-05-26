// FILE: mobile/lib/core/utils/date_helper.dart
import 'package:intl/intl.dart';

/// Centralized Date Helper for BengkelKu Mobile App
/// Strictly manages local date parsing, formatting, and timezone-safe matching.
/// Eliminates timezone leakage, fallback mock dates, or stale cache calculations.
class DateHelper {
  DateHelper._();

  static const List<String> monthsIndonesian = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  /// Parses date string (YYYY-MM-DD or full ISO) safely
  static DateTime? parseSafe(String? dateStr) {
    if (dateStr == null || dateStr.trim().isEmpty) return null;
    try {
      return DateTime.parse(dateStr);
    } catch (_) {
      try {
        // Fallback for custom formatted strings
        return DateFormat('yyyy-MM-dd').parse(dateStr);
      } catch (_) {
        return null;
      }
    }
  }

  /// Centralized formatter for Indonesian Date (e.g. "18 Mei 2026")
  static String formatIndonesian(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    final parsed = parseSafe(dateStr);
    if (parsed == null) return dateStr;

    try {
      final day = parsed.day;
      final monthIdx = parsed.month - 1;
      final year = parsed.year;
      
      if (monthIdx < 0 || monthIdx > 11) return dateStr;
      return '$day ${monthsIndonesian[monthIdx]} $year';
    } catch (_) {
      return dateStr;
    }
  }

  /// Formats date to simple YYYY-MM-DD
  static String formatToYmd(DateTime dateTime) {
    final y = dateTime.year;
    final m = dateTime.month.toString().padLeft(2, '0');
    final d = dateTime.day.toString().padLeft(2, '0');
    return '$y-$m-$d';
  }

  /// Returns today's date in YYYY-MM-DD string format (WIB context)
  static String getTodayString() {
    return formatToYmd(DateTime.now());
  }

  /// Returns tomorrow's date in YYYY-MM-DD string format (WIB context)
  static String getBesokString() {
    final besok = DateTime.now().add(const Duration(days: 1));
    return formatToYmd(besok);
  }

  /// Returns a relative day label (Hari ini, Besok, or Indonesian date)
  static String getRelativeDayLabel(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    final today = getTodayString();
    
    // Parse tomorrow
    final besok = getBesokString();

    if (dateStr.startsWith(today)) {
      return 'Hari ini';
    } else if (dateStr.startsWith(besok)) {
      return 'Besok';
    }
    
    return formatIndonesian(dateStr);
  }

  /// Safe duration helper for display
  static String formatDuration(int minutes) {
    if (minutes < 60) return '$minutes menit';
    final hours = minutes ~/ 60;
    final remaining = minutes % 60;
    return remaining > 0 ? '$hours jam $remaining menit' : '$hours jam';
  }
}
