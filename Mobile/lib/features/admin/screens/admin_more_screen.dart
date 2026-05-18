import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/theme_provider.dart';
import 'jadwal_mgmt_screen.dart';
import 'user_mgmt_screen.dart';
import 'layanan_mgmt_screen.dart';
import 'kategori_mgmt_screen.dart';

class AdminMoreScreen extends StatelessWidget {
  const AdminMoreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final auth = Provider.of<AuthProvider>(context);
    final user = auth.user ?? {};

    return Scaffold(
      appBar: AppBar(title: const Text('Pengaturan')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Admin profile card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Theme.of(context).dividerColor),
              ),
              child: Row(
                children: [
                  Container(
                    width: 56,
                    height: 56,
                    decoration: BoxDecoration(color: AppColors.primary, borderRadius: BorderRadius.circular(16)),
                    child: Center(
                      child: Text(
                        (user['nama'] ?? 'A').toString().substring(0, 1).toUpperCase(),
                        style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(user['nama'] ?? 'Admin', style: Theme.of(context).textTheme.titleLarge),
                        Text(user['email'] ?? '', style: Theme.of(context).textTheme.bodySmall),
                        const SizedBox(height: 4),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(color: AppColors.error.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                          child: const Text('Admin', style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: AppColors.error)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Menu items
            _buildMenuItem(context, Icons.people_rounded, 'Kelola Pengguna', 'CRUD admin, petugas, pelanggan', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const UserMgmtScreen()));
            }),
            _buildMenuItem(context, Icons.directions_car_rounded, 'Kategori Kendaraan', 'CRUD kategori & ikon kendaraan', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const KategoriMgmtScreen()));
            }),
            _buildMenuItem(context, Icons.build_rounded, 'Kelola Layanan', 'CRUD layanan servis bengkel', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const LayananMgmtScreen()));
            }),
            _buildMenuItem(context, Icons.calendar_month_rounded, 'Jadwal Operasional', 'Atur jam buka, tutup, libur', () {
              Navigator.push(context, MaterialPageRoute(builder: (_) => const JadwalMgmtScreen()));
            }),

            // Theme toggle
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
                  Text('Tampilan', style: Theme.of(context).textTheme.titleLarge),
                  SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(Provider.of<ThemeProvider>(context).isDark ? Icons.dark_mode_rounded : Icons.light_mode_rounded, size: 20, color: Theme.of(context).colorScheme.onSurfaceVariant),
                      SizedBox(width: 12),
                      Expanded(child: Text('Mode Gelap', style: Theme.of(context).textTheme.bodyLarge)),
                      Switch.adaptive(
                        value: Provider.of<ThemeProvider>(context).isDark,
                        activeThumbColor: AppColors.primary,
                        onChanged: (_) => Provider.of<ThemeProvider>(context, listen: false).toggleTheme(),
                      ),
                    ],
                  ),
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
                          onPressed: () {
                            Navigator.pop(ctx);
                            auth.logout();
                            context.go('/login');
                          },
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

  Widget _buildMenuItem(BuildContext context, IconData icon, String title, String subtitle, VoidCallback onTap) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Container(
          width: 44, height: 44,
          decoration: BoxDecoration(color: AppColors.primaryLight, borderRadius: BorderRadius.circular(12)),
          child: Icon(icon, color: AppColors.primary, size: 22),
        ),
        title: Text(title, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
        subtitle: Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
        trailing: Icon(Icons.chevron_right_rounded, color: Theme.of(context).colorScheme.onSurfaceVariant),
        onTap: onTap,
      ),
    );
  }
}
