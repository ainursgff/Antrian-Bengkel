import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/montir_provider.dart';

class MontirProfilScreen extends StatelessWidget {
  const MontirProfilScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final montir = Provider.of<MontirProvider>(context);
    final user = auth.user ?? {};

    return Scaffold(
      
      appBar: AppBar(title: Text('Profil Petugas')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Profile card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Column(
                children: [
                  Container(
                    width: 72, height: 72,
                    decoration: BoxDecoration(color: AppColors.info, borderRadius: BorderRadius.circular(20)),
                    child: Center(
                      child: Text(
                        (user['nama'] ?? 'M').toString().substring(0, 1).toUpperCase(),
                        style: TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                  SizedBox(height: 16),
                  Text(user['nama'] ?? 'Petugas', style: Theme.of(context).textTheme.headlineSmall),
                  SizedBox(height: 4),
                  Text(user['email'] ?? '', style: Theme.of(context).textTheme.bodyMedium),
                  SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                    decoration: BoxDecoration(color: AppColors.info.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                    child: Text('Petugas / Montir', style: TextStyle(color: AppColors.info, fontWeight: FontWeight.w700, fontSize: 12)),
                  ),
                ],
              ),
            ),

            SizedBox(height: 24),

            // Work stats
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Statistik Hari Ini', style: Theme.of(context).textTheme.titleLarge),
                  SizedBox(height: 16),
                  _statRow(context, Icons.engineering, 'Tugas Aktif', '${montir.totalAktif}', AppColors.info),
                  _statRow(context, Icons.check_circle, 'Selesai', '${montir.totalDikerjakan}', AppColors.success),
                  _statRow(context, Icons.list_alt, 'Total Antrian', '${montir.antrian.length}', AppColors.primary),
                ],
              ),
            ),

            SizedBox(height: 24),

            // Account info
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Informasi Akun', style: Theme.of(context).textTheme.titleLarge),
                  SizedBox(height: 16),
                  _infoRow(context, Icons.person, 'Nama', user['nama'] ?? '-'),
                  _infoRow(context, Icons.email, 'Email', user['email'] ?? '-'),
                  _infoRow(context, Icons.phone, 'No. HP', user['no_hp'] ?? '-'),
                ],
              ),
            ),

            SizedBox(height: 24),

            // Logout
            SizedBox(
              width: double.infinity,
              height: 52,
              child: OutlinedButton.icon(
                onPressed: () {
                  showDialog(
                    context: context,
                    builder: (ctx) => AlertDialog(
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      title: Text('Logout'),
                      content: Text('Apakah Anda yakin ingin keluar?'),
                      actions: [
                        TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Batal')),
                        ElevatedButton(
                          onPressed: () { Navigator.pop(ctx); auth.logout(); context.go('/login'); },
                          style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
                          child: Text('Logout'),
                        ),
                      ],
                    ),
                  );
                },
                style: OutlinedButton.styleFrom(foregroundColor: AppColors.error, side: BorderSide(color: AppColors.error)),
                icon: Icon(Icons.logout_rounded),
                label: Text('Keluar dari Akun'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _statRow(BuildContext context, IconData icon, String label, String value, Color color) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: color),
          SizedBox(width: 12),
          Text(label, style: Theme.of(context).textTheme.bodyMedium),
          const Spacer(),
          Text(value, style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, color: color)),
        ],
      ),
    );
  }

  Widget _infoRow(BuildContext context, IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: Theme.of(context).colorScheme.onSurfaceVariant),
          SizedBox(width: 12),
          SizedBox(width: 70, child: Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600))),
          Expanded(child: Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.onSurface))),
        ],
      ),
    );
  }
}
