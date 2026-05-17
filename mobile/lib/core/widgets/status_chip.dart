import 'package:flutter/material.dart';
import '../utils/helpers.dart';

class StatusChip extends StatelessWidget {
  final String status;
  final bool showIcon;
  final double? fontSize;

  const StatusChip({super.key, required this.status, this.showIcon = true, this.fontSize});

  @override
  Widget build(BuildContext context) {
    final color = Helpers.getStatusColor(status);
    final label = Helpers.getStatusLabel(status);
    final icon = Helpers.getStatusIcon(status);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: color.withValues(alpha: 0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showIcon) ...[
            Icon(icon, size: 14, color: color),
            SizedBox(width: 4),
          ],
          Text(
            label,
            style: TextStyle(
              fontSize: fontSize ?? 11,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
