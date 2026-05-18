import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../constants/app_colors.dart';

class AppLoading extends StatelessWidget {
  final String? message;

  const AppLoading({super.key, this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 48,
            height: 48,
            child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3),
          ),
          if (message != null) ...[
            SizedBox(height: 16),
            Text(message!, style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
          ],
        ],
      ),
    );
  }
}

// =================== EMPTY STATE ===================
class AppEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final String? buttonText;
  final VoidCallback? onButtonPressed;

  const AppEmptyState({
    super.key,
    required this.icon,
    required this.title,
    required this.subtitle,
    this.buttonText,
    this.onButtonPressed,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: Theme.of(context).colorScheme.surfaceContainerHighest, shape: BoxShape.circle),
              child: Icon(icon, size: 56, color: Theme.of(context).colorScheme.onSurfaceVariant),
            ),
            SizedBox(height: 24),
            Text(title, style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
            SizedBox(height: 8),
            Text(subtitle, style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
            if (buttonText != null && onButtonPressed != null) ...[
              SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: onButtonPressed,
                icon: Icon(Icons.add_circle_outline, size: 20),
                label: Text(buttonText!),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// =================== ERROR STATE ===================
class AppErrorState extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;

  const AppErrorState({super.key, this.message = 'Terjadi kesalahan', this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: AppColors.errorLight, shape: BoxShape.circle),
              child: Icon(Icons.error_outline_rounded, size: 56, color: AppColors.error),
            ),
            SizedBox(height: 24),
            Text('Oops!', style: Theme.of(context).textTheme.headlineSmall, textAlign: TextAlign.center),
            SizedBox(height: 8),
            Text(message, style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
            if (onRetry != null) ...[
              SizedBox(height: 24),
              ElevatedButton.icon(
                onPressed: onRetry,
                icon: Icon(Icons.refresh_rounded, size: 20),
                label: Text('Coba Lagi'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// =================== SHIMMER SKELETON ===================
class ShimmerBox extends StatelessWidget {
  final double width;
  final double height;
  final double borderRadius;

  const ShimmerBox({super.key, required this.width, required this.height, this.borderRadius = 12});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Shimmer.fromColors(
      baseColor: isDark ? Colors.grey[800]! : Theme.of(context).dividerColor,
      highlightColor: isDark ? Colors.grey[700]! : Theme.of(context).colorScheme.surfaceContainerHighest,
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

// =================== SHIMMER LIST SKELETON ===================
class ShimmerListSkeleton extends StatelessWidget {
  final int itemCount;
  const ShimmerListSkeleton({super.key, this.itemCount = 5});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      physics: const NeverScrollableScrollPhysics(),
      itemCount: itemCount,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: Row(
            children: [
              ShimmerBox(width: 56, height: 56, borderRadius: 14),
              SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    ShimmerBox(width: double.infinity, height: 14, borderRadius: 6),
                    SizedBox(height: 8),
                    ShimmerBox(width: 120, height: 10, borderRadius: 6),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

// =================== SHIMMER CARD SKELETON ===================
class ShimmerCardSkeleton extends StatelessWidget {
  const ShimmerCardSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ShimmerBox(width: double.infinity, height: 120, borderRadius: 20),
          SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: ShimmerBox(width: double.infinity, height: 80, borderRadius: 16)),
              SizedBox(width: 12),
              Expanded(child: ShimmerBox(width: double.infinity, height: 80, borderRadius: 16)),
            ],
          ),
          SizedBox(height: 24),
          ShimmerBox(width: 150, height: 18, borderRadius: 8),
          SizedBox(height: 12),
          ShimmerBox(width: double.infinity, height: 80, borderRadius: 16),
          SizedBox(height: 8),
          ShimmerBox(width: double.infinity, height: 80, borderRadius: 16),
        ],
      ),
    );
  }
}

// =================== LOADING OVERLAY ===================
class LoadingOverlay extends StatelessWidget {
  final bool isLoading;
  final Widget child;
  final String? message;

  const LoadingOverlay({super.key, required this.isLoading, required this.child, this.message});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading)
          Container(
            color: Colors.black.withValues(alpha: 0.3),
            child: Center(
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 24),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surface,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.1), blurRadius: 20)],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(width: 40, height: 40, child: CircularProgressIndicator(color: AppColors.primary, strokeWidth: 3)),
                    if (message != null) ...[
                      SizedBox(height: 16),
                      Text(message!, style: Theme.of(context).textTheme.bodyMedium),
                    ],
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}
