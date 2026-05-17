import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../constants/app_colors.dart';
import '../constants/app_constants.dart';

class Helpers {
  Helpers._();

  // Format currency IDR
  static String formatRupiah(dynamic amount) {
    final number = int.tryParse(amount.toString()) ?? 0;
    final formatter = NumberFormat.currency(locale: 'id_ID', symbol: 'Rp ', decimalDigits: 0);
    return formatter.format(number);
  }

  // Format date
  static String formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '-';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('dd MMM yyyy', 'id_ID').format(date);
    } catch (_) {
      return dateStr;
    }
  }

  // Format time
  static String formatTime(String? timeStr) {
    if (timeStr == null || timeStr.isEmpty) return '-';
    try {
      final parts = timeStr.split(':');
      return '${parts[0]}:${parts[1]}';
    } catch (_) {
      return timeStr;
    }
  }

  // Get status color
  static Color getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'menunggu':
        return AppColors.statusMenunggu;
      case 'dipanggil':
        return AppColors.statusDipanggil;
      case 'sedang_dilayani':
        return AppColors.statusDilayani;
      case 'selesai':
        return AppColors.statusSelesai;
      case 'dibatalkan':
        return AppColors.statusDibatalkan;
      default:
        return AppColors.textMuted;
    }
  }

  // Get status label (human readable)
  static String getStatusLabel(String status) {
    switch (status.toLowerCase()) {
      case 'menunggu':
        return 'Menunggu';
      case 'dipanggil':
        return 'Dipanggil';
      case 'sedang_dilayani':
        return 'Sedang Dilayani';
      case 'selesai':
        return 'Selesai';
      case 'dibatalkan':
        return 'Dibatalkan';
      default:
        return status;
    }
  }

  // Get status icon
  static IconData getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'menunggu':
        return Icons.hourglass_top_rounded;
      case 'dipanggil':
        return Icons.campaign_rounded;
      case 'sedang_dilayani':
        return Icons.build_rounded;
      case 'selesai':
        return Icons.check_circle_rounded;
      case 'dibatalkan':
        return Icons.cancel_rounded;
      default:
        return Icons.info_rounded;
    }
  }

  // Show snackbar
  static void showSnackbar(BuildContext context, String message, {bool isError = false}) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: isError ? AppColors.error : AppColors.secondary,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  // Show success snackbar
  static void showSuccess(BuildContext context, String message) {
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.check_circle, color: Colors.white, size: 20),
            const SizedBox(width: 8),
            Expanded(child: Text(message)),
          ],
        ),
        backgroundColor: AppColors.success,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  // Get role display name
  static String getRoleLabel(String? role) {
    switch (role) {
      case AppConstants.roleAdmin:
        return 'Admin';
      case AppConstants.roleMontir:
        return 'Petugas';
      case AppConstants.rolePelanggan:
        return 'Pelanggan';
      default:
        return 'Pengguna';
    }
  }
}
