import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/admin_provider.dart';
import '../../../models/antrian_model.dart';

class AntrianMgmtScreen extends StatefulWidget {
  const AntrianMgmtScreen({super.key});

  @override
  State<AntrianMgmtScreen> createState() => _AntrianMgmtScreenState();
}

class _AntrianMgmtScreenState extends State<AntrianMgmtScreen> {
  String _filter = 'semua';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AdminProvider>(context, listen: false).loadAntrian();
    });
  }

  List<AntrianModel> _filtered(List<AntrianModel> all) {
    if (_filter == 'semua') return all;
    return all.where((a) => a.status == _filter).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      
      appBar: AppBar(title: Text('Kelola Antrian')),
      body: Consumer<AdminProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.antrian.isEmpty) {
            return const AppLoading(message: 'Memuat antrian...');
          }

          final filtered = _filtered(provider.antrian);

          return Column(
            children: [
              // Filter chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  children: [
                    _buildChip('semua', 'Semua', Theme.of(context).colorScheme.onSurface),
                    _buildChip('menunggu', 'Menunggu', AppColors.statusMenunggu),
                    _buildChip('dipanggil', 'Dipanggil', AppColors.statusDipanggil),
                    _buildChip('sedang_dilayani', 'Dilayani', AppColors.statusDilayani),
                    _buildChip('selesai', 'Selesai', AppColors.statusSelesai),
                    _buildChip('dibatalkan', 'Batal', AppColors.statusDibatalkan),
                  ],
                ),
              ),

              Expanded(
                child: filtered.isEmpty
                    ? const AppEmptyState(icon: Icons.inbox_rounded, title: 'Tidak Ada Data', subtitle: 'Tidak ada antrian dengan filter ini.')
                    : RefreshIndicator(
                        onRefresh: () => provider.loadAntrian(),
                        color: AppColors.primary,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount: filtered.length,
                          itemBuilder: (context, i) => _buildTile(context, filtered[i], provider),
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildChip(String value, String label, Color color) {
    final isSelected = _filter == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Text(label),
        labelStyle: TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: 12,
          color: isSelected ? Colors.white : color,
        ),
        backgroundColor: color.withValues(alpha: 0.1),
        selectedColor: color,
        checkmarkColor: Colors.white,
        onSelected: (_) => setState(() => _filter = value),
      ),
    );
  }

  Widget _buildTile(BuildContext context, AntrianModel a, AdminProvider provider) {
    final sc = Helpers.getStatusColor(a.status);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: sc.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(color: sc.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                child: Text(a.nomorAntrian, style: TextStyle(fontWeight: FontWeight.w900, color: sc)),
              ),
              SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(a.namaPelanggan ?? '-', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                    Text(a.namaLayanan ?? '-', style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: sc.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                child: Text(Helpers.getStatusLabel(a.status), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: sc)),
              ),
            ],
          ),
          if (a.kendaraan != null && a.kendaraan!.isNotEmpty) ...[
            SizedBox(height: 8),
            Row(children: [
              Icon(Icons.directions_car, size: 14, color: Theme.of(context).colorScheme.onSurfaceVariant),
              SizedBox(width: 6),
              Text(a.kendaraan!, style: Theme.of(context).textTheme.bodySmall),
            ]),
          ],
          if (a.isActive) ...[
            SizedBox(height: 10),
            Row(
              children: [
                if (a.status == 'menunggu') ...[
                  _actionBtn('Panggil', AppColors.info, Icons.campaign, () => _doAction(context, provider.panggilAntrian(a.id))),
                  SizedBox(width: 8),
                  _actionBtn('Batal', AppColors.error, Icons.cancel, () => _doAction(context, provider.batalkanAntrian(a.id))),
                ],
                if (a.status == 'dipanggil')
                  _actionBtn('Mulai Layani', AppColors.statusDilayani, Icons.build, () => _doAction(context, provider.setDilayani(a.id))),
                if (a.status == 'sedang_dilayani')
                  _actionBtn('Selesai', AppColors.success, Icons.check_circle, () => _doAction(context, provider.setSelesai(a.id))),
              ],
            ),
          ],
        ],
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

  Widget _actionBtn(String label, Color color, IconData icon, VoidCallback onTap) {
    return Expanded(
      child: SizedBox(
        height: 34,
        child: ElevatedButton.icon(
          onPressed: onTap,
          style: ElevatedButton.styleFrom(backgroundColor: color, padding: const EdgeInsets.symmetric(horizontal: 8)),
          icon: Icon(icon, size: 14),
          label: Text(label, style: TextStyle(fontSize: 11)),
        ),
      ),
    );
  }
}
