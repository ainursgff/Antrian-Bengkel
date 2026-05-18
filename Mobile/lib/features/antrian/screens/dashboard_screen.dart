import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/antrian_provider.dart';
import '../../../providers/notifikasi_provider.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AntrianProvider>(context, listen: false).loadDashboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user ?? {};

    return Scaffold(
      
      body: Consumer<AntrianProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.layanan.isEmpty) {
            return const AppLoading(message: 'Memuat dashboard...');
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadDashboard(),
            color: AppColors.primary,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                // App Bar
                SliverAppBar(
                  expandedHeight: 140,
                  floating: false,
                  pinned: true,
                  automaticallyImplyLeading: false,
                  backgroundColor: AppColors.secondary,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                        ),
                      ),
                      child: SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              // Avatar
                              Container(
                                width: 48,
                                height: 48,
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  borderRadius: BorderRadius.circular(14),
                                ),
                                child: Center(
                                  child: Text(
                                    (user['nama'] ?? 'U').toString().substring(0, 1).toUpperCase(),
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 20,
                                      fontWeight: FontWeight.w800,
                                    ),
                                  ),
                                ),
                              ),
                              SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(
                                      'Halo, ${user['nama'] ?? 'Pelanggan'} 👋',
                                      style: TextStyle(
                                        fontSize: 20,
                                        fontWeight: FontWeight.w800,
                                        color: Colors.white,
                                      ),
                                    ),
                                    SizedBox(height: 4),
                                    Text(
                                      'Selamat datang di Antrian Bengkel',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: Color(0xFF94A3B8),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Consumer<NotifikasiProvider>(
                                builder: (context, notifProv, _) {
                                  return IconButton(
                                    onPressed: () => context.push('/notifikasi'),
                                    icon: Badge(
                                      isLabelVisible: notifProv.unreadCount > 0,
                                      label: Text('${notifProv.unreadCount}'),
                                      child: const Icon(
                                        Icons.notifications_rounded,
                                        color: Colors.white,
                                      ),
                                    ),
                                  );
                                },
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),

                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Active Queue Section
                        _buildActiveQueueSection(context, provider),

                        SizedBox(height: 28),

                        // Layanan Section
                        Text('Layanan Tersedia', style: Theme.of(context).textTheme.headlineSmall)
                            .animate().fadeIn(delay: 200.ms, duration: 400.ms),
                        SizedBox(height: 14),
                        ...provider.layanan.take(5).map((l) => Container(
                          margin: const EdgeInsets.only(bottom: 10),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surface,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Theme.of(context).dividerColor),
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            leading: Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppColors.primaryLight,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Icon(Icons.build_rounded, color: AppColors.primary, size: 22),
                            ),
                            title: Text(l.namaLayanan, style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14)),
                            subtitle: Text('${l.estimasiMenit} menit', style: Theme.of(context).textTheme.bodySmall),
                            trailing: Text(
                              Helpers.formatRupiah(l.harga),
                              style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13, color: AppColors.success),
                            ),
                          ),
                        )),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildActiveQueueSection(BuildContext context, AntrianProvider provider) {
    final antrian = provider.antrianAktif;

    if (antrian == null) {
      // Empty state
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(28),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.confirmation_num_outlined, size: 48, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            SizedBox(height: 20),
            Text('Belum Ada Antrian', style: Theme.of(context).textTheme.headlineSmall),
            SizedBox(height: 8),
            Text(
              'Anda belum memiliki antrian aktif hari ini.\nAmbil antrian untuk memulai.',
              style: Theme.of(context).textTheme.bodyMedium,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: () => context.push('/ambil-antrian'),
              icon: Icon(Icons.add_circle_outline, size: 20),
              label: Text('Ambil Antrian Baru'),
            ),
          ],
        ),
      ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0, duration: 400.ms);
    }

    // Active queue card
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Antrian Aktif', style: Theme.of(context).textTheme.headlineSmall),
        SizedBox(height: 14),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Helpers.getStatusColor(antrian.status),
                Helpers.getStatusColor(antrian.status).withValues(alpha: 0.8),
              ],
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Helpers.getStatusColor(antrian.status).withValues(alpha: 0.3),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            children: [
              Text('Nomor Antrian Anda', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600)),
              SizedBox(height: 8),
              Text(
                antrian.nomorAntrian,
                style: TextStyle(fontSize: 52, fontWeight: FontWeight.w900, color: Colors.white, height: 1),
              ),
              SizedBox(height: 16),
              // Status + Detail
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Helpers.getStatusIcon(antrian.status), color: Colors.white, size: 18),
                    SizedBox(width: 6),
                    Text(
                      Helpers.getStatusLabel(antrian.status),
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 16),
              // Info row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildInfoPill(Icons.build_rounded, antrian.namaLayanan ?? '-'),
                  _buildInfoPill(Icons.schedule, '${antrian.estimasiMenit ?? 0} mnt'),
                  if (antrian.slotWaktu != null)
                    _buildInfoPill(Icons.access_time_filled, Helpers.formatTime(antrian.slotWaktu)),
                ],
              ),
              // Cancel button
              if (antrian.canCancel) ...[
                SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton.icon(
                    onPressed: provider.isSubmitting
                        ? null
                        : () async {
                            final result = await provider.cancelAntrian(antrian.id);
                            if (context.mounted) {
                              if (result['success'] == true) {
                                Helpers.showSuccess(context, 'Antrian berhasil dibatalkan');
                              } else {
                                Helpers.showSnackbar(context, result['error'] ?? 'Gagal membatalkan', isError: true);
                              }
                            }
                          },
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.white,
                      side: BorderSide(color: Colors.white54),
                    ),
                    icon: Icon(Icons.cancel_outlined, size: 18),
                    label: Text('Batalkan Antrian'),
                  ),
                ),
              ],
            ],
          ),
        ).animate().fadeIn(duration: 400.ms).scale(begin: const Offset(0.95, 0.95), end: const Offset(1, 1), duration: 400.ms),
      ],
    );
  }

  Widget _buildInfoPill(IconData icon, String text) {
    return Expanded(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(icon, size: 14, color: Colors.white70),
          SizedBox(width: 4),
          Flexible(
            child: Text(
              text,
              style: TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
