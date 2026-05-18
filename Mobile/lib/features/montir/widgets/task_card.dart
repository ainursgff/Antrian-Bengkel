import 'package:flutter/material.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../models/antrian_model.dart';

class TaskCard extends StatelessWidget {
  final AntrianModel antrian;
  final VoidCallback? onAction;
  final String? actionLabel;
  final Color? actionColor;
  final IconData? actionIcon;

  const TaskCard({
    super.key,
    required this.antrian,
    this.onAction,
    this.actionLabel,
    this.actionColor,
    this.actionIcon,
  });

  @override
  Widget build(BuildContext context) {
    final sc = Helpers.getStatusColor(antrian.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: sc.withValues(alpha: 0.3)),
        boxShadow: [
          BoxShadow(color: Colors.black.withValues(alpha: 0.03), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(color: sc.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                  child: Text(antrian.nomorAntrian, style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: sc)),
                ),
                SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(antrian.namaPelanggan ?? '-', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
                      if (antrian.noHp != null && antrian.noHp!.isNotEmpty)
                        Text(antrian.noHp!, style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(color: sc.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Helpers.getStatusIcon(antrian.status), size: 12, color: sc),
                      SizedBox(width: 4),
                      Text(Helpers.getStatusLabel(antrian.status), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: sc)),
                    ],
                  ),
                ),
              ],
            ),

            SizedBox(height: 12),
            const Divider(height: 1),
            SizedBox(height: 12),

            // Detail rows
            _infoRow(context, Icons.build_rounded, antrian.namaLayanan ?? '-'),
            if (antrian.kendaraan != null && antrian.kendaraan!.isNotEmpty)
              _infoRow(context, Icons.directions_car, antrian.kendaraan!),
            _infoRow(context, Icons.schedule, '${antrian.estimasiMenit ?? 0} menit'),
            if (antrian.slotWaktu != null)
              _infoRow(context, Icons.access_time_filled, 'Slot: ${Helpers.formatTime(antrian.slotWaktu)}'),
            if (antrian.totalHarga != null)
              _infoRow(context, Icons.payments, Helpers.formatRupiah(antrian.totalHarga)),
            if (antrian.catatan != null && antrian.catatan!.isNotEmpty)
              _infoRow(context, Icons.notes, antrian.catatan!),

            // Action button
            if (onAction != null && actionLabel != null) ...[
              SizedBox(height: 14),
              SizedBox(
                width: double.infinity,
                height: 44,
                child: ElevatedButton.icon(
                  onPressed: onAction,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: actionColor ?? AppColors.primary,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  icon: Icon(actionIcon ?? Icons.play_arrow_rounded, size: 20),
                  label: Text(actionLabel!, style: TextStyle(fontWeight: FontWeight.w700)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _infoRow(BuildContext context, IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Theme.of(context).colorScheme.onSurfaceVariant),
          SizedBox(width: 8),
          Expanded(
            child: Text(text, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Theme.of(context).colorScheme.onSurface), maxLines: 2, overflow: TextOverflow.ellipsis),
          ),
        ],
      ),
    );
  }
}
