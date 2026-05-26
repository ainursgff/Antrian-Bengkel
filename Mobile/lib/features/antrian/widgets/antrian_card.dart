import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
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
          borderRadius: BorderRadius.circular(AppColors.radiusMd),
          border: Border.all(
            color: antrian.isActive ? statusColor.withValues(alpha: 0.2) : Theme.of(context).dividerColor.withValues(alpha: 0.5),
            width: antrian.isActive ? 1.5 : 1,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.03),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppColors.radiusMd),
          child: Column(
            children: [
              if (antrian.isActive)
                Container(
                  height: 4,
                  width: double.infinity,
                  color: statusColor,
                ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    // Header: Nomor & Status
                    Row(
                      children: [
                        // Nomor Antrian Badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            antrian.nomorAntrian,
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              color: statusColor,
                              letterSpacing: -0.5,
                            ),
                          ),
                        ),
                        const SizedBox(width: 14),
                        // Info
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                antrian.namaLayanan ?? 'Layanan',
                                style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 16),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Row(
                                children: [
                                  Icon(Icons.calendar_today_rounded, size: 12, color: AppColors.textMuted),
                                  const SizedBox(width: 4),
                                  Text(
                                    Helpers.formatDate(antrian.tanggal),
                                    style: Theme.of(context).textTheme.bodySmall,
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                        // Status chip
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                          decoration: BoxDecoration(
                            color: statusColor.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(50),
                            border: Border.all(color: statusColor.withValues(alpha: 0.2)),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Helpers.getStatusIcon(antrian.status), size: 12, color: statusColor),
                              const SizedBox(width: 4),
                              Text(
                                Helpers.getStatusLabel(antrian.status),
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.w800,
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
                      const SizedBox(height: 16),
                      Container(height: 1, color: Theme.of(context).dividerColor.withValues(alpha: 0.5)),
                      const SizedBox(height: 16),
                      _buildDetailRow(context, Icons.schedule_rounded, 'Estimasi', '${antrian.estimasiMenit ?? 0} menit'),
                      if (antrian.slotWaktu != null)
                        _buildDetailRow(context, Icons.access_time_filled_rounded, 'Slot Waktu', Helpers.formatTime(antrian.slotWaktu)),
                      if (antrian.totalHarga != null)
                        _buildDetailRow(context, Icons.payments_rounded, 'Total', Helpers.formatRupiah(antrian.totalHarga)),
                      if (antrian.kendaraan != null && antrian.kendaraan!.isNotEmpty)
                        _buildDetailRow(context, Icons.directions_car_filled_rounded, 'Kendaraan', antrian.kendaraan!),
                      if (antrian.catatan != null && antrian.catatan!.isNotEmpty)
                        _buildDetailRow(context, Icons.notes_rounded, 'Catatan', antrian.catatan!),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(BuildContext context, IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Theme.of(context).dividerColor.withValues(alpha: 0.3),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Icon(icon, size: 14, color: AppColors.textSecondary),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label.toUpperCase(),
                style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w800, color: AppColors.textMuted, letterSpacing: 0.5),
              ),
              const SizedBox(height: 1),
              Text(
                value,
                style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.textPrimary),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
