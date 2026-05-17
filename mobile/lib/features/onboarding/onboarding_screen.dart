import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import '../../core/constants/app_colors.dart';
import '../../core/widgets/app_button.dart';
import '../../services/auth_storage.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<_OnboardingItem> _items = [
    _OnboardingItem(
      icon: Icons.confirmation_num_rounded,
      title: 'Ambil Antrian Digital',
      description: 'Tidak perlu mengantri secara fisik. Ambil nomor antrian bengkel langsung dari smartphone Anda kapan saja.',
      color: AppColors.primary,
    ),
    _OnboardingItem(
      icon: Icons.track_changes_rounded,
      title: 'Pantau Status Real-Time',
      description: 'Lihat posisi antrian Anda saat ini, estimasi waktu tunggu, dan terima notifikasi saat giliran Anda tiba.',
      color: AppColors.info,
    ),
    _OnboardingItem(
      icon: Icons.build_circle_rounded,
      title: 'Multi Layanan Bengkel',
      description: 'Pilih berbagai layanan sekaligus — ganti oli, tune up, servis rem, dan lainnya dalam satu kali antrian.',
      color: AppColors.success,
    ),
  ];

  void _nextPage() {
    if (_currentPage < _items.length - 1) {
      _pageController.nextPage(duration: 400.ms, curve: Curves.easeInOut);
    } else {
      _finishOnboarding();
    }
  }

  void _finishOnboarding() async {
    await AuthStorage.setOnboardingDone();
    if (mounted) context.go('/login');
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: Column(
          children: [
            // Skip button
            Align(
              alignment: Alignment.topRight,
              child: TextButton(
                onPressed: _finishOnboarding,
                child: Text(
                  'Lewati',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        color: AppColors.textMuted,
                      ),
                ),
              ),
            ),

            // Page content
            Expanded(
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() => _currentPage = index);
                },
                itemCount: _items.length,
                itemBuilder: (context, index) {
                  final item = _items[index];
                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 32),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 140,
                          height: 140,
                          decoration: BoxDecoration(
                            color: item.color.withOpacity(0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(item.icon, size: 72, color: item.color),
                        )
                            .animate(key: ValueKey(index))
                            .scale(
                              begin: const Offset(0.6, 0.6),
                              end: const Offset(1.0, 1.0),
                              duration: 500.ms,
                              curve: Curves.easeOutBack,
                            )
                            .fadeIn(duration: 400.ms),
                        const SizedBox(height: 48),
                        Text(
                          item.title,
                          style: Theme.of(context).textTheme.headlineMedium,
                          textAlign: TextAlign.center,
                        )
                            .animate(key: ValueKey('title_$index'))
                            .fadeIn(delay: 200.ms, duration: 400.ms)
                            .slideY(begin: 0.2, end: 0),
                        const SizedBox(height: 16),
                        Text(
                          item.description,
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                height: 1.6,
                              ),
                          textAlign: TextAlign.center,
                        )
                            .animate(key: ValueKey('desc_$index'))
                            .fadeIn(delay: 400.ms, duration: 400.ms),
                      ],
                    ),
                  );
                },
              ),
            ),

            // Indicators + Button
            Padding(
              padding: const EdgeInsets.fromLTRB(32, 0, 32, 32),
              child: Column(
                children: [
                  // Dot indicators
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(_items.length, (index) {
                      final isActive = index == _currentPage;
                      return AnimatedContainer(
                        duration: 300.ms,
                        margin: const EdgeInsets.symmetric(horizontal: 4),
                        width: isActive ? 32 : 8,
                        height: 8,
                        decoration: BoxDecoration(
                          color: isActive ? AppColors.primary : AppColors.border,
                          borderRadius: BorderRadius.circular(4),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 32),
                  AppButton(
                    text: _currentPage == _items.length - 1 ? 'Mulai Sekarang' : 'Selanjutnya',
                    icon: _currentPage == _items.length - 1 ? Icons.rocket_launch_rounded : Icons.arrow_forward_rounded,
                    onPressed: _nextPage,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OnboardingItem {
  final IconData icon;
  final String title;
  final String description;
  final Color color;

  _OnboardingItem({
    required this.icon,
    required this.title,
    required this.description,
    required this.color,
  });
}
