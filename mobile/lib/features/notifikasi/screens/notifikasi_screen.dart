import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/notifikasi_provider.dart';
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
      final prov = Provider.of<NotifikasiProvider>(context, listen: false);
      prov.load();
      prov.startPolling();
    });
  }

  @override
  void dispose() {
    // polling continues globally via provider; stopPolling only if needed
    super.dispose();
  }

  IconData _getNotifIcon(String tipe) {
    switch (tipe) {
      case 'panggilan': return Icons.campaign_rounded;
      case 'konfirmasi': return Icons.check_circle_rounded;
      case 'pembatalan': return Icons.cancel_rounded;
      case 'pengingat': return Icons.alarm_rounded;
      default: return Icons.notifications_rounded;
    }
  }

  Color _getNotifColor(String tipe) {
    switch (tipe) {
      case 'panggilan': return AppColors.info;
      case 'konfirmasi': return AppColors.success;
      case 'pembatalan': return AppColors.error;
      case 'pengingat': return AppColors.warning;
      default: return Theme.of(context).colorScheme.onSurfaceVariant;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      
      appBar: AppBar(
        title: Text('Notifikasi'),
        actions: [
          Consumer<NotifikasiProvider>(
            builder: (context, prov, _) {
              if (prov.unreadCount > 0) {
                return TextButton(
                  onPressed: () => prov.markAllRead(),
                  child: Text('Tandai Dibaca'),
                );
              }
              return SizedBox.shrink();
            },
          ),
        ],
      ),
      body: Consumer<NotifikasiProvider>(
        builder: (context, prov, _) {
          if (prov.isLoading && prov.notifikasi.isEmpty) {
            return const AppLoading(message: 'Memuat notifikasi...');
          }

          if (prov.notifikasi.isEmpty) {
            return const AppEmptyState(
              icon: Icons.notifications_off_rounded,
              title: 'Tidak Ada Notifikasi',
              subtitle: 'Notifikasi dari bengkel akan muncul di sini.',
            );
          }

          return RefreshIndicator(
            onRefresh: () => prov.load(),
            color: AppColors.primary,
            child: ListView.separated(
              padding: const EdgeInsets.all(20),
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: prov.notifikasi.length,
              separatorBuilder: (_, i) => SizedBox(height: 8),
              itemBuilder: (context, i) {
                final notif = prov.notifikasi[i];
                return _buildNotifTile(context, notif, prov)
                    .animate()
                    .fadeIn(delay: Duration(milliseconds: 50 * i), duration: 300.ms)
                    .slideX(begin: 0.1, end: 0, duration: 300.ms);
              },
            ),
          );
        },
      ),
    );
  }

  Widget _buildNotifTile(BuildContext context, NotifikasiModel notif, NotifikasiProvider prov) {
    final color = _getNotifColor(notif.tipe);

    return GestureDetector(
      onTap: () {
        if (!notif.isRead) prov.markRead(notif.id);
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: notif.isRead ? Theme.of(context).colorScheme.surface : color.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: notif.isRead ? Theme.of(context).dividerColor : color.withValues(alpha: 0.2)),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40, height: 40,
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(12)),
              child: Icon(_getNotifIcon(notif.tipe), color: color, size: 20),
            ),
            SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (notif.nomorAntrian != null)
                    Text(notif.nomorAntrian!, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
                  SizedBox(height: 2),
                  Text(
                    notif.pesan,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Theme.of(context).colorScheme.onSurface,
                      fontWeight: notif.isRead ? FontWeight.w400 : FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: 4),
                  Text(Helpers.formatDate(notif.sentAt), style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
            if (!notif.isRead)
              Container(width: 8, height: 8, decoration: BoxDecoration(color: color, shape: BoxShape.circle)),
          ],
        ),
      ),
    );
  }
}
