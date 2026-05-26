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
  final TextEditingController _revisiController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AntrianProvider>(context, listen: false).loadDashboard();
    });
  }

  @override
  void dispose() {
    _revisiController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user ?? {};

    return Scaffold(
      body: Consumer<AntrianProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.layanan.isEmpty) {
            return const AppLoading(message: 'Sinkronisasi dashboard...');
          }

          final statusBengkel = _getBengkelStatus(provider);

          return RefreshIndicator(
            onRefresh: () => provider.loadDashboard(),
            color: AppColors.primary,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                // App Bar / Header
                SliverAppBar(
                  expandedHeight: 180,
                  floating: false,
                  pinned: true,
                  automaticallyImplyLeading: false,
                  backgroundColor: AppColors.secondary,
                  stretch: true,
                  flexibleSpace: FlexibleSpaceBar(
                    background: Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                          colors: [const Color(0xFF1E293B), const Color(0xFF0F172A)],
                        ),
                      ),
                      child: SafeArea(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        // Status Badge
                                        Container(
                                          margin: const EdgeInsets.only(bottom: 12),
                                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                          decoration: BoxDecoration(
                                            color: statusBengkel['isOpen'] ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
                                            borderRadius: BorderRadius.circular(50),
                                            border: Border.all(
                                              color: statusBengkel['isOpen'] ? Colors.green.withValues(alpha: 0.2) : Colors.red.withValues(alpha: 0.2),
                                            ),
                                          ),
                                          child: Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              Icon(
                                                Icons.circle,
                                                size: 8,
                                                color: statusBengkel['isOpen'] ? Colors.green : Colors.red,
                                              ),
                                              const SizedBox(width: 6),
                                              Text(
                                                statusBengkel['text'],
                                                style: TextStyle(
                                                  color: statusBengkel['isOpen'] ? Colors.green : Colors.red,
                                                  fontSize: 10,
                                                  fontWeight: FontWeight.w800,
                                                ),
                                              ),
                                            ],
                                          ),
                                        ),
                                        Text(
                                          'Halo, ${user['nama'] ?? 'Pelanggan'} 👋',
                                          style: const TextStyle(
                                            fontSize: 24,
                                            fontWeight: FontWeight.w900,
                                            color: Colors.white,
                                            letterSpacing: -0.5,
                                          ),
                                        ),
                                        const SizedBox(height: 4),
                                        Text(
                                          'Modernisasi kendaraan Anda hari ini.',
                                          style: TextStyle(
                                            fontSize: 13,
                                            color: Colors.white.withValues(alpha: 0.6),
                                            fontWeight: FontWeight.w500,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  Consumer<NotifikasiProvider>(
                                    builder: (context, notifProv, _) {
                                      return IconButton(
                                        onPressed: () => context.push('/notifikasi'),
                                        style: IconButton.styleFrom(
                                          backgroundColor: Colors.white.withValues(alpha: 0.1),
                                          padding: const EdgeInsets.all(12),
                                        ),
                                        icon: Badge(
                                          isLabelVisible: notifProv.unreadCount > 0,
                                          label: Text('${notifProv.unreadCount}'),
                                          child: const Icon(
                                            Icons.notifications_none_rounded,
                                            color: Colors.white,
                                            size: 26,
                                          ),
                                        ),
                                      );
                                    },
                                  ),
                                ],
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

                        const SizedBox(height: 32),

                        // Layanan Heading
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'LAYANAN KAMI',
                                  style: TextStyle(
                                    fontSize: 10,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primary,
                                    letterSpacing: 1.5,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Text(
                                  'Jasa Servis Lengkap',
                                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                                    fontWeight: FontWeight.w900,
                                    letterSpacing: -0.5,
                                  ),
                                ),
                              ],
                            ),
                            TextButton(
                              onPressed: () => context.push('/ambil-antrian'),
                              child: const Text('Lihat Semua', style: TextStyle(fontWeight: FontWeight.w800)),
                            ),
                          ],
                        ).animate().fadeIn(delay: 200.ms, duration: 400.ms),
                        
                        const SizedBox(height: 16),
                        
                        // Layanan Grid/List
                        ...provider.layanan.take(5).map((l) => Container(
                          margin: const EdgeInsets.only(bottom: 12),
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.surface,
                            borderRadius: BorderRadius.circular(20),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.03),
                                blurRadius: 15,
                                offset: const Offset(0, 5),
                              ),
                            ],
                            border: Border.all(color: Theme.of(context).dividerColor.withValues(alpha: 0.5)),
                          ),
                          child: Material(
                            color: Colors.transparent,
                            child: ListTile(
                              contentPadding: const EdgeInsets.all(12),
                              leading: Container(
                                width: 56,
                                height: 56,
                                decoration: BoxDecoration(
                                  color: AppColors.primaryLight,
                                  borderRadius: BorderRadius.circular(16),
                                ),
                                child: Icon(Icons.settings_suggest_rounded, color: AppColors.primary, size: 28),
                              ),
                              title: Text(
                                l.namaLayanan, 
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 15)
                              ),
                              subtitle: Container(
                                margin: const EdgeInsets.only(top: 6),
                                child: Row(
                                  children: [
                                    Icon(Icons.timer_outlined, size: 14, color: AppColors.textSecondary),
                                    const SizedBox(width: 4),
                                    Text('± ${l.estimasiMenit} mnt', style: Theme.of(context).textTheme.bodySmall),
                                  ],
                                ),
                              ),
                              trailing: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                crossAxisAlignment: CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    Helpers.formatRupiah(l.harga),
                                    style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 14, color: AppColors.primary),
                                  ),
                                  const SizedBox(height: 2),
                                  const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: AppColors.textMuted),
                                ],
                              ),
                            ),
                          ),
                        ).animate().fadeIn(delay: 300.ms, duration: 400.ms)),
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

  Map<String, dynamic> _getBengkelStatus(AntrianProvider provider) {
    if (provider.jadwal.isEmpty) return {'isOpen': false, 'text': 'Memuat Jadwal...'};
    
    final now = DateTime.now();
    // In model: const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    // so Sunday is 0. 
    // DateTime.now().weekday: Mon=1, Sun=7.
    final sundayAdjusted = now.weekday == 7 ? 0 : now.weekday;
    
    final todayJadwal = provider.jadwal.firstWhere(
      (j) => j.hari == sundayAdjusted,
      orElse: () => provider.jadwal.first,
    );

    if (todayJadwal.isLibur) return {'isOpen': false, 'text': 'Bengkel Libur Hari Ini'};

    final bukaParts = todayJadwal.jamBuka.split(':');
    final tutupParts = todayJadwal.jamTutup.split(':');
    
    final bukaMinutes = int.parse(bukaParts[0]) * 60 + int.parse(bukaParts[1]);
    final tutupMinutes = int.parse(tutupParts[0]) * 60 + int.parse(tutupParts[1]);
    final currentMinutes = now.hour * 60 + now.minute;

    if (currentMinutes < bukaMinutes) {
      return {'isOpen': false, 'text': 'Bengkel Belum Buka (Buka jam ${todayJadwal.jamBuka.substring(0, 5)})'};
    } else if (currentMinutes >= tutupMinutes) {
      return {'isOpen': false, 'text': 'Bengkel Sudah Tutup (Tutup jam ${todayJadwal.jamTutup.substring(0, 5)})'};
    } else {
      return {'isOpen': true, 'text': 'Bengkel Buka (Tutup jam ${todayJadwal.jamTutup.substring(0, 5)})'};
    }
  }

  Widget _buildActiveQueueSection(BuildContext context, AntrianProvider provider) {
    final antrian = provider.antrianAktif;

    if (antrian == null) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(32),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(AppColors.radiusLg),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.02),
              blurRadius: 30,
              offset: const Offset(0, 10),
            ),
          ],
          border: Border.all(color: Theme.of(context).dividerColor.withValues(alpha: 0.5)),
        ),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(AppColors.radiusXl),
              ),
              child: const Icon(Icons.confirmation_num_outlined, size: 56, color: AppColors.textMuted),
            ),
            const SizedBox(height: 24),
            Text(
              'Ayo Servis Kendaraan!',
              style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w900),
            ),
            const SizedBox(height: 12),
            Text(
              'Ambil antrian online untuk menghemat waktu berharga Anda.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => context.push('/ambil-antrian'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                ),
                icon: const Icon(Icons.add_circle_outline, size: 20),
                label: const Text('Ambil Nomor Antrian Sekarang', style: TextStyle(fontWeight: FontWeight.w800)),
              ),
            ),
          ],
        ),
      ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0, duration: 400.ms);
    }

    final statusColor = Helpers.getStatusColor(antrian.status);

    // Active queue card
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 4,
              height: 18,
              decoration: BoxDecoration(
                color: statusColor,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const SizedBox(width: 8),
            Text(
              'ANTRIAN AKTIF ANDA',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w900,
                color: statusColor,
                letterSpacing: 1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(28),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                statusColor,
                statusColor.withValues(alpha: 0.85),
              ],
            ),
            borderRadius: BorderRadius.circular(AppColors.radiusLg),
            boxShadow: [
              BoxShadow(
                color: statusColor.withValues(alpha: 0.4),
                blurRadius: 25,
                offset: const Offset(0, 12),
              ),
            ],
          ),
          child: Column(
            children: [
              Text(
                'Posisi Antrian',
                style: TextStyle(color: Colors.white.withValues(alpha: 0.7), fontWeight: FontWeight.w700, fontSize: 13),
              ),
              const SizedBox(height: 10),
              Text(
                antrian.nomorAntrian,
                style: const TextStyle(fontSize: 68, fontWeight: FontWeight.w900, color: Colors.white, height: 1, letterSpacing: -2),
              ),
              const SizedBox(height: 24),
              // Status Badge
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.white.withValues(alpha: 0.2)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Helpers.getStatusIcon(antrian.status), color: Colors.white, size: 20),
                    const SizedBox(width: 8),
                    Text(
                      Helpers.getStatusLabel(antrian.status).toUpperCase(),
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 12, letterSpacing: 0.5),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),
              // Info divider
              Container(height: 1, color: Colors.white.withValues(alpha: 0.2), width: double.infinity),
              const SizedBox(height: 20),
              // Info grid
              Row(
                children: [
                  _buildDetailedInfo(Icons.car_repair_rounded, 'Kendaraan', antrian.kendaraan ?? '-'),
                  Container(width: 1, height: 30, color: Colors.white.withValues(alpha: 0.2)),
                  _buildDetailedInfo(Icons.timer_rounded, 'Estimasi', '${antrian.estimasiMenit ?? 0} mnt'),
                  if (antrian.slotWaktu != null) ...[
                    Container(width: 1, height: 30, color: Colors.white.withValues(alpha: 0.2)),
                    _buildDetailedInfo(Icons.access_time_filled_rounded, 'Slot Waktu', Helpers.formatTime(antrian.slotWaktu)),
                  ],
                ],
              ),
              // Buttons
              if (antrian.canCancel) ...[
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: TextButton.icon(
                    onPressed: provider.isSubmitting
                        ? null
                        : () async {
                            final confirm = await Helpers.showConfirmDialog(
                              context,
                              title: 'Batalkan Antrian',
                              content: 'Yakin ingin membatalkan antrian ini? Tindakan ini tidak dapat dibatalkan.',
                              confirmColor: Colors.red,
                              confirmText: 'Ya, Batalkan',
                            );
                            if (confirm) {
                                final result = await provider.cancelAntrian(antrian.id);
                                if (context.mounted) {
                                  if (result['success'] == true) {
                                    Helpers.showSuccess(context, 'Antrian berhasil dibatalkan');
                                  } else {
                                    Helpers.showSnackbar(context, result['error'] ?? 'Gagal membatalkan', isError: true);
                                  }
                                }
                            }
                          },
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.white,
                      backgroundColor: Colors.white.withValues(alpha: 0.1),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                    ),
                    icon: const Icon(Icons.cancel_outlined, size: 18),
                    label: const Text('Batalkan Antrian', style: TextStyle(fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ],
          ),
        ).animate().fadeIn(duration: 400.ms).scale(begin: const Offset(0.95, 0.95), end: const Offset(1, 1), duration: 400.ms),
        
        // Verification & Revision Section (if needed)
        if (antrian.status == 'menunggu_verifikasi_pelanggan') ...[
          const SizedBox(height: 20),
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(AppColors.radiusLg),
              border: Border.all(color: Colors.green.withValues(alpha: 0.3), width: 2),
              boxShadow: [
                BoxShadow(
                  color: Colors.green.withValues(alpha: 0.05),
                  blurRadius: 20,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: Colors.green.withValues(alpha: 0.1),
                        shape: BoxShape.circle,
                      ),
                      child: const Icon(Icons.verified_rounded, color: Colors.green, size: 28),
                    ),
                    const SizedBox(width: 14),
                    const Expanded(
                      child: Text(
                        'Pengerjaan Selesai!',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: Color(0xFF064E3B)),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 14),
                const Text(
                  'Mekanik telah menyelesaikan servis. Silakan konfirmasi jika sudah oke, atau ajukan revisi jika ada kendala.',
                  style: TextStyle(fontSize: 13, color: Color(0xFF065F46), height: 1.5, fontWeight: FontWeight.w500),
                ),
                const SizedBox(height: 20),
                TextField(
                  controller: _revisiController,
                  maxLines: 2,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
                  decoration: InputDecoration(
                    hintText: 'Cth: Rem masih kurang pakem...',
                    hintStyle: const TextStyle(color: Colors.grey, fontWeight: FontWeight.w400),
                    fillColor: Colors.grey.withValues(alpha: 0.05),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: provider.isSubmitting
                            ? null
                            : () async {
                                final confirm = await Helpers.showConfirmDialog(
                                  context,
                                  title: 'Konfirmasi Selesai',
                                  content: 'Dengan ini Anda setuju bahwa servis telah selesai dengan baik.',
                                  confirmColor: Colors.green,
                                  confirmText: 'Setuju & Selesai',
                                );
                                if (confirm) {
                                  final result = await provider.verifyAntrian(antrian.id);
                                  if (context.mounted && result['success'] == true) {
                                    Helpers.showSuccess(context, 'Terima kasih atas kepercayaan Anda!');
                                  }
                                }
                              },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.green,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Setuju & Selesai', style: TextStyle(fontWeight: FontWeight.w900)),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      flex: 1,
                      child: OutlinedButton(
                        onPressed: provider.isSubmitting
                            ? null
                            : () async {
                                final text = _revisiController.text.trim();
                                if (text.isEmpty) {
                                  Helpers.showSnackbar(context, 'Berikan catatan revisi.', isError: true);
                                  return;
                                }
                                final result = await provider.requestRevision(antrian.id, text);
                                if (context.mounted && result['success'] == true) {
                                  _revisiController.clear();
                                  Helpers.showSuccess(context, 'Revisi diajukan.');
                                }
                              },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                          side: const BorderSide(color: Colors.red, width: 2),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Revisi', style: TextStyle(fontWeight: FontWeight.w900)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),
        ],
      ],
    );
  }

  Widget _buildDetailedInfo(IconData icon, String label, String value) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, size: 20, color: Colors.white.withValues(alpha: 0.7)),
          const SizedBox(height: 6),
          Text(
            label.toUpperCase(),
            style: TextStyle(color: Colors.white.withValues(alpha: 0.5), fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 0.5),
          ),
          const SizedBox(height: 2),
          Text(
            value,
            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w800),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }
}
