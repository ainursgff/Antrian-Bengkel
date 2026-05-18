import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/montir_provider.dart';
import '../../../models/antrian_model.dart';

class MontirRiwayatScreen extends StatefulWidget {
  const MontirRiwayatScreen({super.key});

  @override
  State<MontirRiwayatScreen> createState() => _MontirRiwayatScreenState();
}

class _MontirRiwayatScreenState extends State<MontirRiwayatScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<MontirProvider>(context, listen: false).loadAntrian();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      
      appBar: AppBar(title: Text('Riwayat Pekerjaan')),
      body: Consumer<MontirProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.antrian.isEmpty) {
            return const AppLoading(message: 'Memuat riwayat...');
          }

          final selesai = provider.antrianSelesai;

          if (selesai.isEmpty) {
            return const AppEmptyState(
              icon: Icons.history_rounded,
              title: 'Belum Ada Riwayat',
              subtitle: 'Pekerjaan yang sudah selesai akan muncul di sini.',
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadAntrian(),
            color: AppColors.primary,
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: selesai.length,
              itemBuilder: (context, i) => _buildTile(context, selesai[i]),
            ),
          );
        },
      ),
    );
  }

  Widget _buildTile(BuildContext context, AntrianModel a) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.statusSelesai.withValues(alpha: 0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppColors.statusSelesai.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(a.nomorAntrian, style: TextStyle(fontWeight: FontWeight.w900, color: AppColors.statusSelesai)),
          ),
          SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(a.namaPelanggan ?? '-', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                Text(a.namaLayanan ?? '-', style: Theme.of(context).textTheme.bodySmall),
                if (a.kendaraan != null && a.kendaraan!.isNotEmpty)
                  Text(a.kendaraan!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurfaceVariant)),
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Icon(Icons.check_circle, color: AppColors.statusSelesai, size: 20),
              SizedBox(height: 4),
              Text(
                a.totalHarga != null ? Helpers.formatRupiah(a.totalHarga) : '-',
                style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.success),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
