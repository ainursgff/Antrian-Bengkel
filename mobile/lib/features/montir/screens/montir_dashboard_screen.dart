import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/montir_provider.dart';
import '../../../providers/auth_provider.dart';
import '../../../models/antrian_model.dart';
import '../widgets/task_card.dart';

class MontirDashboardScreen extends StatefulWidget {
  const MontirDashboardScreen({super.key});

  @override
  State<MontirDashboardScreen> createState() => _MontirDashboardScreenState();
}

class _MontirDashboardScreenState extends State<MontirDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<MontirProvider>(context, listen: false).loadAntrian();
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user ?? {};

    return Scaffold(
      
      body: Consumer<MontirProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.antrian.isEmpty) {
            return const AppLoading(message: 'Memuat tugas...');
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadAntrian(),
            color: AppColors.primary,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                // Header
                SliverAppBar(
                  expandedHeight: 130,
                  pinned: true,
                  automaticallyImplyLeading: false,
                  backgroundColor: AppColors.secondary,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(colors: [Color(0xFF1E293B), Color(0xFF0F172A)]),
                      ),
                      child: SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                          child: Row(
                            children: [
                              Container(
                                width: 48, height: 48,
                                decoration: BoxDecoration(color: AppColors.info, borderRadius: BorderRadius.circular(14)),
                                child: Center(
                                  child: Text(
                                    (user['nama'] ?? 'M').toString().substring(0, 1).toUpperCase(),
                                    style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800),
                                  ),
                                ),
                              ),
                              SizedBox(width: 14),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text('Halo, ${user['nama'] ?? 'Petugas'} 🔧', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white)),
                                    Text('Panel Petugas Bengkel', style: TextStyle(fontSize: 13, color: Color(0xFF94A3B8))),
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
                        // Stat summary cards
                        Row(
                          children: [
                            _statMini(context, '${provider.totalAktif}', 'Aktif', AppColors.info, Icons.engineering),
                            SizedBox(width: 12),
                            _statMini(context, '${provider.totalDikerjakan}', 'Selesai', AppColors.success, Icons.check_circle),
                            SizedBox(width: 12),
                            _statMini(context, '${provider.antrian.length}', 'Total', AppColors.primary, Icons.list_alt),
                          ],
                        ).animate().fadeIn(duration: 300.ms),

                        SizedBox(height: 28),

                        // Active tasks
                        if (provider.antrianAktif.isNotEmpty) ...[
                          Text('Tugas Aktif', style: Theme.of(context).textTheme.headlineSmall),
                          SizedBox(height: 14),
                          ...provider.antrianAktif.map((a) {
                            if (a.status == 'dipanggil') {
                              return TaskCard(
                                antrian: a,
                                actionLabel: 'Mulai Kerjakan',
                                actionColor: AppColors.statusDilayani,
                                actionIcon: Icons.play_arrow_rounded,
                                onAction: () => _doAction(context, provider.setDilayani(a.id)),
                              );
                            }
                            return TaskCard(
                              antrian: a,
                              actionLabel: 'Tandai Selesai',
                              actionColor: AppColors.success,
                              actionIcon: Icons.check_circle_rounded,
                              onAction: () => _confirmSelesai(context, a, provider),
                            );
                          }),
                          SizedBox(height: 28),
                        ],

                        // Waiting
                        if (provider.antrianMenunggu.isNotEmpty) ...[
                          Text('Menunggu Dipanggil (${provider.antrianMenunggu.length})', style: Theme.of(context).textTheme.headlineSmall),
                          SizedBox(height: 14),
                          ...provider.antrianMenunggu.map((a) => TaskCard(antrian: a)),
                          SizedBox(height: 28),
                        ],

                        // Empty
                        if (provider.antrian.isEmpty)
                          const AppEmptyState(
                            icon: Icons.engineering_rounded,
                            title: 'Belum Ada Tugas',
                            subtitle: 'Belum ada antrian yang ditugaskan untuk Anda hari ini.',
                          ),
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

  Widget _statMini(BuildContext context, String value, String label, Color color, IconData icon) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Theme.of(context).dividerColor),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900, color: color)),
            Text(label, style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }

  void _doAction(BuildContext ctx, Future<Map<String, dynamic>> future) async {
    final r = await future;
    if (ctx.mounted) {
      r['success'] == true
          ? Helpers.showSuccess(ctx, r['message'] ?? 'Berhasil')
          : Helpers.showSnackbar(ctx, r['error'] ?? 'Gagal', isError: true);
    }
  }

  void _confirmSelesai(BuildContext context, AntrianModel a, MontirProvider provider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Selesaikan Tugas'),
        content: Text('Tandai antrian ${a.nomorAntrian} sebagai selesai?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Batal')),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(ctx);
              _doAction(context, provider.setSelesai(a.id));
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
            child: Text('Ya, Selesai'),
          ),
        ],
      ),
    );
  }
}
