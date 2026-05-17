import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/antrian_provider.dart';
import '../../../models/layanan_model.dart';

class AmbilAntrianScreen extends StatefulWidget {
  const AmbilAntrianScreen({super.key});

  @override
  State<AmbilAntrianScreen> createState() => _AmbilAntrianScreenState();
}

class _AmbilAntrianScreenState extends State<AmbilAntrianScreen> {
  final _kendaraanController = TextEditingController();
  final _catatanController = TextEditingController();
  final Set<int> _selectedIds = {};

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AntrianProvider>(context, listen: false).loadLayanan();
    });
  }

  @override
  void dispose() {
    _kendaraanController.dispose();
    _catatanController.dispose();
    super.dispose();
  }

  int get _totalEstimasi {
    final provider = Provider.of<AntrianProvider>(context, listen: false);
    return provider.layanan
        .where((l) => _selectedIds.contains(l.id))
        .fold(0, (sum, l) => sum + l.estimasiMenit);
  }

  int get _totalHarga {
    final provider = Provider.of<AntrianProvider>(context, listen: false);
    return provider.layanan
        .where((l) => _selectedIds.contains(l.id))
        .fold(0, (sum, l) => sum + l.harga);
  }

  Future<void> _submit() async {
    if (_selectedIds.isEmpty) {
      Helpers.showSnackbar(context, 'Pilih minimal satu layanan', isError: true);
      return;
    }
    if (_kendaraanController.text.trim().isEmpty) {
      Helpers.showSnackbar(context, 'Masukkan informasi kendaraan', isError: true);
      return;
    }

    final provider = Provider.of<AntrianProvider>(context, listen: false);
    final result = await provider.submitAntrian(
      layananIds: _selectedIds.toList(),
      kendaraan: _kendaraanController.text.trim(),
      catatan: _catatanController.text.trim(),
    );

    if (!mounted) return;

    if (result['success'] == true) {
      _showSuccessSheet(result);
    } else {
      Helpers.showSnackbar(context, result['error'] ?? 'Gagal mengambil antrian', isError: true);
    }
  }

  void _showSuccessSheet(Map<String, dynamic> result) {
    final antrian = result['antrian'];
    showModalBottomSheet(
      context: context,
      isDismissible: false,
      enableDrag: false,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) {
        return Padding(
          padding: const EdgeInsets.all(28),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 48,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.successLight,
                  shape: BoxShape.circle,
                ),
                child: const Icon(Icons.check_circle, color: AppColors.success, size: 56),
              ),
              const SizedBox(height: 20),
              Text('Antrian Berhasil!', style: Theme.of(ctx).textTheme.headlineMedium),
              const SizedBox(height: 8),
              if (antrian != null) ...[
                Text(
                  'Nomor Anda: ${antrian['nomor_antrian']}',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w900,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Tanggal: ${antrian['tanggal']} • Slot: ${antrian['slot_waktu']?.toString().substring(0, 5) ?? '-'}',
                  style: Theme.of(ctx).textTheme.bodyMedium,
                ),
              ],
              const SizedBox(height: 24),
              AppButton(
                text: 'Kembali ke Dashboard',
                icon: Icons.home_rounded,
                onPressed: () {
                  Navigator.of(ctx).pop();
                  context.go('/customer');
                },
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        title: const Text('Ambil Antrian'),
      ),
      body: Consumer<AntrianProvider>(
        builder: (context, provider, _) {
          if (provider.layanan.isEmpty && provider.isLoading) {
            return const AppLoading(message: 'Memuat layanan...');
          }

          if (provider.layanan.isEmpty) {
            return const AppEmptyState(
              icon: Icons.build_outlined,
              title: 'Tidak Ada Layanan',
              subtitle: 'Belum ada layanan yang tersedia saat ini.',
            );
          }

          return Column(
            children: [
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Pilih Layanan', style: Theme.of(context).textTheme.headlineSmall)
                          .animate().fadeIn(duration: 300.ms),
                      const SizedBox(height: 6),
                      Text(
                        'Anda dapat memilih lebih dari satu layanan.',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      const SizedBox(height: 16),

                      // Layanan cards
                      ...provider.layanan.map((l) => _buildLayananTile(l)),

                      const SizedBox(height: 24),

                      // Input Kendaraan
                      AppTextField(
                        controller: _kendaraanController,
                        label: 'Kendaraan',
                        hint: 'Contoh: Honda Vario - B 1234 ABC',
                        prefixIcon: Icons.directions_car_outlined,
                        textCapitalization: TextCapitalization.characters,
                      ),
                      const SizedBox(height: 16),

                      // Catatan
                      AppTextField(
                        controller: _catatanController,
                        label: 'Catatan Keluhan (Opsional)',
                        hint: 'Jelaskan keluhan kendaraan Anda...',
                        prefixIcon: Icons.notes_outlined,
                        maxLines: 3,
                        textCapitalization: TextCapitalization.sentences,
                      ),
                      const SizedBox(height: 100), // space for bottom bar
                    ],
                  ),
                ),
              ),

              // Bottom summary bar
              if (_selectedIds.isNotEmpty)
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    border: const Border(top: BorderSide(color: AppColors.border)),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.05),
                        blurRadius: 10,
                        offset: const Offset(0, -4),
                      ),
                    ],
                  ),
                  child: SafeArea(
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  '${_selectedIds.length} layanan dipilih',
                                  style: Theme.of(context).textTheme.bodySmall,
                                ),
                                Text(
                                  Helpers.formatRupiah(_totalHarga),
                                  style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: AppColors.primary),
                                ),
                              ],
                            ),
                            Text(
                              '~$_totalEstimasi menit',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(color: AppColors.textMuted),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        AppButton(
                          text: 'Ambil Antrian Sekarang',
                          icon: Icons.confirmation_num_rounded,
                          isLoading: provider.isSubmitting,
                          onPressed: _submit,
                        ),
                      ],
                    ),
                  ),
                ).animate().slideY(begin: 1, end: 0, duration: 300.ms, curve: Curves.easeOut),
            ],
          );
        },
      ),
    );
  }

  Widget _buildLayananTile(LayananModel l) {
    final isSelected = _selectedIds.contains(l.id);
    return GestureDetector(
      onTap: () {
        setState(() {
          if (isSelected) {
            _selectedIds.remove(l.id);
          } else {
            _selectedIds.add(l.id);
          }
        });
      },
      child: AnimatedContainer(
        duration: 200.ms,
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primaryLight : AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? AppColors.primary : AppColors.border,
            width: isSelected ? 2 : 1,
          ),
        ),
        child: Row(
          children: [
            // Checkbox icon
            Container(
              width: 28,
              height: 28,
              decoration: BoxDecoration(
                color: isSelected ? AppColors.primary : Colors.transparent,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: isSelected ? AppColors.primary : AppColors.textMuted,
                  width: 2,
                ),
              ),
              child: isSelected
                  ? const Icon(Icons.check, color: Colors.white, size: 18)
                  : null,
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l.namaLayanan,
                    style: TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 14,
                      color: isSelected ? AppColors.primaryDark : AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${l.estimasiMenit} menit',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            Text(
              Helpers.formatRupiah(l.harga),
              style: TextStyle(
                fontWeight: FontWeight.w700,
                fontSize: 14,
                color: isSelected ? AppColors.primary : AppColors.success,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
