import 'package:flutter/material.dart';
import '../../../core/utils/helpers.dart';
import '../../../models/antrian_model.dart';

class DetailAntrianScreen extends StatelessWidget {
  final AntrianModel antrian;

  const DetailAntrianScreen({super.key, required this.antrian});

  @override
  Widget build(BuildContext context) {
    final statusColor = Helpers.getStatusColor(antrian.status);

    return Scaffold(
      
      appBar: AppBar(title: Text('Detail Antrian')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Hero card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(28),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [statusColor, statusColor.withValues(alpha: 0.8)],
                ),
                borderRadius: BorderRadius.circular(24),
              ),
              child: Column(
                children: [
                  Text('Nomor Antrian', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w600)),
                  SizedBox(height: 8),
                  Text(
                    antrian.nomorAntrian,
                    style: TextStyle(fontSize: 56, fontWeight: FontWeight.w900, color: Colors.white, height: 1),
                  ),
                  SizedBox(height: 16),
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
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 24),

            // Detail card
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
                  Text('Informasi Antrian', style: Theme.of(context).textTheme.headlineSmall),
                  SizedBox(height: 16),
                  _buildRow(context, Icons.calendar_today, 'Tanggal', Helpers.formatDate(antrian.tanggal)),
                  _buildRow(context, Icons.access_time, 'Slot Waktu', Helpers.formatTime(antrian.slotWaktu)),
                  _buildRow(context, Icons.build_rounded, 'Layanan', antrian.namaLayanan ?? '-'),
                  _buildRow(context, Icons.schedule, 'Estimasi', '${antrian.estimasiMenit ?? 0} menit'),
                  _buildRow(context, Icons.payments, 'Total Harga', Helpers.formatRupiah(antrian.totalHarga ?? 0)),
                  if (antrian.kendaraan != null && antrian.kendaraan!.isNotEmpty)
                    _buildRow(context, Icons.directions_car, 'Kendaraan', antrian.kendaraan!),
                  if (antrian.catatan != null && antrian.catatan!.isNotEmpty)
                    _buildRow(context, Icons.notes, 'Catatan', antrian.catatan!),
                  if (antrian.rincianHarga != null && antrian.rincianHarga!.isNotEmpty) ...[
                    const Divider(height: 24),
                    Text('Rincian Harga', style: Theme.of(context).textTheme.titleMedium),
                    SizedBox(height: 8),
                    Text(antrian.rincianHarga!, style: Theme.of(context).textTheme.bodyMedium),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRow(BuildContext context, IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Theme.of(context).colorScheme.onSurfaceVariant),
          SizedBox(width: 12),
          SizedBox(
            width: 100,
            child: Text(label, style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600)),
          ),
          Expanded(
            child: Text(value, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: Theme.of(context).colorScheme.onSurface)),
          ),
        ],
      ),
    );
  }
}
