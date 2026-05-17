import 'package:flutter/material.dart';
import '../../../core/utils/helpers.dart';
import '../../../models/antrian_model.dart';

class AntrianCard extends StatelessWidget {
  final AntrianModel antrian;
  final VoidCallback? onTap;
  final bool showDetail;

  const AntrianCard({
    super.key,
    required this.antrian,
    this.onTap,
    this.showDetail = false,
  });

  @override
  Widget build(BuildContext context) {
    final statusColor = Helpers.getStatusColor(antrian.status);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: antrian.isActive ? statusColor.withValues(alpha: 0.3) : Theme.of(context).dividerColor,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 10,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            children: [
              // Header: Nomor & Status
              Row(
                children: [
                  // Nomor Antrian Badge
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      antrian.nomorAntrian,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w900,
                        color: statusColor,
                      ),
                    ),
                  ),
                  SizedBox(width: 12),
                  // Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          antrian.namaLayanan ?? 'Layanan',
                          style: Theme.of(context).textTheme.titleMedium,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        SizedBox(height: 2),
                        Text(
                          Helpers.formatDate(antrian.tanggal),
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  // Status chip
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Helpers.getStatusIcon(antrian.status), size: 14, color: statusColor),
                        SizedBox(width: 4),
                        Text(
                          Helpers.getStatusLabel(antrian.status),
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: statusColor,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              // Detail section
              if (showDetail) ...[
                SizedBox(height: 12),
                const Divider(),
                SizedBox(height: 8),
                _buildDetailRow(context, Icons.schedule, 'Estimasi', '${antrian.estimasiMenit ?? 0} menit'),
                if (antrian.slotWaktu != null)
                  _buildDetailRow(context, Icons.access_time_filled, 'Slot Waktu', Helpers.formatTime(antrian.slotWaktu)),
                if (antrian.totalHarga != null)
                  _buildDetailRow(context, Icons.payments_outlined, 'Total', Helpers.formatRupiah(antrian.totalHarga)),
                if (antrian.kendaraan != null && antrian.kendaraan!.isNotEmpty)
                  _buildDetailRow(context, Icons.directions_car, 'Kendaraan', antrian.kendaraan!),
                if (antrian.catatan != null && antrian.catatan!.isNotEmpty)
                  _buildDetailRow(context, Icons.notes, 'Catatan', antrian.catatan!),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
          SizedBox(width: 8),
          Text(
            '$label: ',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(fontWeight: FontWeight.w600),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurface),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
