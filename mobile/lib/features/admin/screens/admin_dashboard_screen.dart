import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/admin_provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../models/antrian_model.dart';
import '../widgets/stat_card.dart';

class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AdminProvider>(context, listen: false).loadDashboard();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);

    return Scaffold(
      
      body: Consumer<AdminProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.laporan == null) {
            return const AppLoading(message: 'Memuat dashboard admin...');
          }

          final laporan = provider.laporan;
          final hariIni = laporan?.hariIni;
          final antrianAktif = provider.antrian.where((a) => a.isActive).toList();

          return RefreshIndicator(
            onRefresh: () => provider.loadDashboard(),
            color: AppColors.primary,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverAppBar(
                  expandedHeight: 120,
                  pinned: true,
                  automaticallyImplyLeading: false,
                  backgroundColor: AppColors.secondary,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Color(0xFF1E293B), Color(0xFF0F172A)],
                        ),
                      ),
                      child: SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                          child: Row(
                            children: [
                              Container(
                                width: 44, height: 44,
                                decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(12)),
                                child: Icon(Icons.admin_panel_settings, color: Colors.white, size: 24),
                              ),
                              SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text('Admin Dashboard', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: Colors.white)),
                                    Text('Halo, ${auth.user?['nama'] ?? 'Admin'}', style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
                                  ],
                                ),
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
                        // Stat cards
                        if (hariIni != null) ...[
                          Text('Statistik Hari Ini', style: Theme.of(context).textTheme.headlineSmall),
                          SizedBox(height: 14),
                          GridView.count(
                            crossAxisCount: 2,
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            mainAxisSpacing: 12,
                            crossAxisSpacing: 12,
                            childAspectRatio: 1.5,
                            children: [
                              StatCard(title: 'Total', value: '${hariIni.total}', icon: Icons.confirmation_num, color: AppColors.primary),
                              StatCard(title: 'Menunggu', value: '${hariIni.menunggu}', icon: Icons.hourglass_top, color: AppColors.statusMenunggu),
                              StatCard(title: 'Sedang Dilayani', value: '${hariIni.sedangDilayani + hariIni.dipanggil}', icon: Icons.build, color: AppColors.statusDilayani),
                              StatCard(title: 'Selesai', value: '${hariIni.selesai}', icon: Icons.check_circle, color: AppColors.statusSelesai),
                            ],
                          ),
                        ],

                        SizedBox(height: 28),

                        // Weekly mini chart
                        if (laporan != null && laporan.mingguan.isNotEmpty) ...[
                          Text('Tren 7 Hari Terakhir', style: Theme.of(context).textTheme.headlineSmall),
                          SizedBox(height: 14),
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.surface,
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: Theme.of(context).dividerColor),
                            ),
                            child: Column(
                              children: [
                                SizedBox(
                                  height: 120,
                                  child: Row(
                                    crossAxisAlignment: CrossAxisAlignment.end,
                                    children: laporan.mingguan.map((day) {
                                      final maxVal = laporan.mingguan.map((d) => d.total).reduce((a, b) => a > b ? a : b);
                                      final pct = maxVal > 0 ? day.total / maxVal : 0.0;
                                      return Expanded(
                                        child: Padding(
                                          padding: const EdgeInsets.symmetric(horizontal: 4),
                                          child: Column(
                                            mainAxisAlignment: MainAxisAlignment.end,
                                            children: [
                                              Text('${day.total}', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: Theme.of(context).colorScheme.onSurfaceVariant)),
                                              SizedBox(height: 4),
                                              Container(
                                                height: 80 * pct,
                                                decoration: BoxDecoration(
                                                  color: AppColors.primary.withValues(alpha: 0.2 + 0.8 * pct),
                                                  borderRadius: BorderRadius.circular(6),
                                                ),
                                              ),
                                              SizedBox(height: 6),
                                              Text(
                                                day.tanggal.length >= 10 ? day.tanggal.substring(8, 10) : day.tanggal,
                                                style: TextStyle(fontSize: 10, color: Theme.of(context).colorScheme.onSurfaceVariant),
                                              ),
                                            ],
                                          ),
                                        ),
                                      );
                                    }).toList(),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],

                        SizedBox(height: 28),

                        // Active antrian
                        Text('Antrian Aktif (${antrianAktif.length})', style: Theme.of(context).textTheme.headlineSmall),
                        SizedBox(height: 14),
                        if (antrianAktif.isEmpty)
                          const AppEmptyState(
                            icon: Icons.inbox_rounded,
                            title: 'Tidak Ada Antrian Aktif',
                            subtitle: 'Belum ada pelanggan yang mengantri hari ini.',
                          )
                        else
                          ...antrianAktif.take(5).map((a) => _buildAntrianTile(context, a, provider)),
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

  Widget _buildAntrianTile(BuildContext context, AntrianModel a, AdminProvider provider) {
    final statusColor = Helpers.getStatusColor(a.status);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: statusColor.withValues(alpha: 0.3)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(color: statusColor.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
            child: Text(a.nomorAntrian, style: TextStyle(fontWeight: FontWeight.w900, color: statusColor, fontSize: 16)),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(a.namaPelanggan ?? '-', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                Text(a.namaLayanan ?? '-', style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          _buildActionButton(context, a, provider),
        ],
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, AntrianModel a, AdminProvider provider) {
    switch (a.status) {
      case 'menunggu':
        return _miniBtn(context, 'Panggil', AppColors.info, () async {
          final r = await provider.panggilAntrian(a.id);
          if (context.mounted) {
            r['success'] == true ? Helpers.showSuccess(context, 'Berhasil dipanggil') : Helpers.showSnackbar(context, r['error'] ?? 'Gagal', isError: true);
          }
        });
      case 'dipanggil':
        return _miniBtn(context, 'Layani', AppColors.statusDilayani, () async {
          final r = await provider.setDilayani(a.id);
          if (context.mounted) {
            r['success'] == true ? Helpers.showSuccess(context, 'Sedang dilayani') : Helpers.showSnackbar(context, r['error'] ?? 'Gagal', isError: true);
          }
        });
      case 'sedang_dilayani':
        return _miniBtn(context, 'Selesai', AppColors.success, () async {
          final r = await provider.setSelesai(a.id);
          if (context.mounted) {
            r['success'] == true ? Helpers.showSuccess(context, 'Selesai!') : Helpers.showSnackbar(context, r['error'] ?? 'Gagal', isError: true);
          }
        });
      default:
        return SizedBox.shrink();
    }
  }

  Widget _miniBtn(BuildContext context, String text, Color color, VoidCallback onTap) {
    return SizedBox(
      height: 32,
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: color,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          textStyle: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
        ),
        child: Text(text),
      ),
    );
  }
}
