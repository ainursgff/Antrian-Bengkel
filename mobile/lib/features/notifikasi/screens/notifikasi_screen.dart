import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/antrian_provider.dart';
import '../../../models/notifikasi_model.dart';

class NotifikasiScreen extends StatefulWidget {
  const NotifikasiScreen({super.key});

  @override
  State<NotifikasiScreen> createState() => _NotifikasiScreenState();
}

class _NotifikasiScreenState extends State<NotifikasiScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AntrianProvider>(context, listen: false).loadNotifikasi();
    });
  }

  IconData _getNotifIcon(String tipe) {
    switch (tipe) {
      case 'panggilan':
        return Icons.campaign_rounded;
      case 'konfirmasi':
        return Icons.check_circle_rounded;
      case 'pembatalan':
        return Icons.cancel_rounded;
      case 'pengingat':
        return Icons.alarm_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _getNotifColor(String tipe) {
    switch (tipe) {
      case 'panggilan':
        return AppColors.info;
      case 'konfirmasi':
        return AppColors.success;
      case 'pembatalan':
        return AppColors.error;
      case 'pengingat':
        return AppColors.warning;
      default:
        return AppColors.textMuted;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Notifikasi'),
        actions: [
          Consumer<AntrianProvider>(
            builder: (context, provider, _) {
              if (provider.unreadNotifCount > 0) {
                return TextButton(
                  onPressed: () => provider.markAllRead(),
                  child: const Text('Tandai Dibaca'),
                );
              }
              return const SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<AntrianProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.notifikasi.isEmpty) {
            return const AppLoading(message: 'Memuat notifikasi...');
          }

          if (provider.notifikasi.isEmpty) {
            return const AppEmptyState(
              icon: Icons.notifications_off_rounded,
              title: 'Tidak Ada Notifikasi',
              subtitle: 'Notifikasi dari bengkel akan muncul di sini.',
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadNotifikasi(),
            color: AppColors.primary,
            child: ListView.separated(
              padding: const EdgeInsets.all(20),
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: provider.notifikasi.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final notif = provider.notifikasi[index];
                return _buildNotifTile(context, notif);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildNotifTile(BuildContext context, NotifikasiModel notif) {
    final color = _getNotifColor(notif.tipe);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: notif.isRead ? AppColors.surface : color.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: notif.isRead ? AppColors.border : color.withValues(alpha: 0.2),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(_getNotifIcon(notif.tipe), color: color, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (notif.nomorAntrian != null)
                  Text(
                    notif.nomorAntrian!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: color,
                    ),
                  ),
                const SizedBox(height: 2),
                Text(
                  notif.pesan,
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: notif.isRead ? FontWeight.w400 : FontWeight.w600,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  Helpers.formatDate(notif.sentAt),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          if (!notif.isRead)
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: color,
                shape: BoxShape.circle,
              ),
            ),
        ],
      ),
    );
  }
}
