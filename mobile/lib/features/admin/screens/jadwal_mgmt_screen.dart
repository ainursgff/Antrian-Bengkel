import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/admin_provider.dart';
import '../../../models/jadwal_model.dart';

class JadwalMgmtScreen extends StatefulWidget {
  const JadwalMgmtScreen({super.key});

  @override
  State<JadwalMgmtScreen> createState() => _JadwalMgmtScreenState();
}

class _JadwalMgmtScreenState extends State<JadwalMgmtScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AdminProvider>(context, listen: false).loadJadwal();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      
      appBar: AppBar(title: Text('Jadwal Operasional')),
      body: Consumer<AdminProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.jadwal.isEmpty) {
            return const AppLoading(message: 'Memuat jadwal...');
          }
          if (provider.jadwal.isEmpty) {
            return const AppEmptyState(icon: Icons.calendar_today, title: 'Belum Ada Jadwal', subtitle: 'Jadwal operasional belum diatur.');
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadJadwal(),
            color: AppColors.primary,
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: provider.jadwal.length,
              itemBuilder: (context, i) {
                final j = provider.jadwal[i];
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: j.isLibur ? AppColors.error.withValues(alpha: 0.3) : Theme.of(context).dividerColor),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    leading: Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: j.isLibur ? AppColors.error.withValues(alpha: 0.1) : AppColors.primaryLight,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        j.isLibur ? Icons.event_busy : Icons.calendar_today,
                        color: j.isLibur ? AppColors.error : AppColors.primary, size: 22,
                      ),
                    ),
                    title: Text(j.namaHari, style: TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(
                      j.isLibur ? 'Libur' : '${Helpers.formatTime(j.jamBuka)} - ${Helpers.formatTime(j.jamTutup)} • Kuota: ${j.kuotaPerSlot}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    trailing: IconButton(
                      icon: Icon(Icons.edit_rounded, size: 20),
                      onPressed: () => _showEditForm(context, j),
                    ),
                  ),
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _showEditForm(BuildContext context, JadwalModel j) {
    final bukaCtrl = TextEditingController(text: Helpers.formatTime(j.jamBuka));
    final tutupCtrl = TextEditingController(text: Helpers.formatTime(j.jamTutup));
    final kuotaCtrl = TextEditingController(text: j.kuotaPerSlot.toString());
    bool isLibur = j.isLibur;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setSheetState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(24, 24, 24, MediaQuery.of(ctx).viewInsets.bottom + 24),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(child: Container(width: 48, height: 4, decoration: BoxDecoration(color: Theme.of(context).dividerColor, borderRadius: BorderRadius.circular(2)))),
                    SizedBox(height: 20),
                    Text('Edit Jadwal: ${j.namaHari}', style: Theme.of(ctx).textTheme.headlineSmall),
                    SizedBox(height: 20),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: Text('Hari Libur'),
                      value: isLibur,
                      activeThumbColor: AppColors.error,
                      onChanged: (v) => setSheetState(() => isLibur = v),
                    ),
                    if (!isLibur) ...[
                      SizedBox(height: 10),
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () async {
                                final time = await showTimePicker(context: ctx, initialTime: _parseTime(j.jamBuka));
                                if (time != null) {
                                  setSheetState(() => bukaCtrl.text = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}');
                                }
                              },
                              child: AbsorbPointer(
                                child: TextField(
                                  controller: bukaCtrl,
                                  decoration: const InputDecoration(labelText: 'Jam Buka', prefixIcon: Icon(Icons.schedule)),
                                ),
                              ),
                            ),
                          ),
                          SizedBox(width: 12),
                          Expanded(
                            child: GestureDetector(
                              onTap: () async {
                                final time = await showTimePicker(context: ctx, initialTime: _parseTime(j.jamTutup));
                                if (time != null) {
                                  setSheetState(() => tutupCtrl.text = '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}');
                                }
                              },
                              child: AbsorbPointer(
                                child: TextField(
                                  controller: tutupCtrl,
                                  decoration: const InputDecoration(labelText: 'Jam Tutup', prefixIcon: Icon(Icons.schedule)),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 14),
                      TextField(
                        controller: kuotaCtrl,
                        keyboardType: TextInputType.number,
                        decoration: const InputDecoration(labelText: 'Kuota Montir per Slot', prefixIcon: Icon(Icons.people)),
                      ),
                    ],
                    SizedBox(height: 20),
                    Consumer<AdminProvider>(
                      builder: (_, prov, _) {
                        return AppButton(
                          text: 'Simpan Perubahan',
                          isLoading: prov.isSubmitting,
                          onPressed: () async {
                            final data = {
                              'hari': j.hari,
                              'jam_buka': '${bukaCtrl.text}:00',
                              'jam_tutup': '${tutupCtrl.text}:00',
                              'kuota_per_slot': int.tryParse(kuotaCtrl.text) ?? 5,
                              'is_libur': isLibur ? 1 : 0,
                            };
                            final r = await prov.updateJadwal(j.id, data);
                            if (ctx.mounted) {
                              Navigator.pop(ctx);
                              r['success'] == true
                                  ? Helpers.showSuccess(context, 'Jadwal diperbarui')
                                  : Helpers.showSnackbar(context, r['error'] ?? 'Gagal', isError: true);
                            }
                          },
                        );
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  TimeOfDay _parseTime(String timeStr) {
    final parts = timeStr.split(':');
    return TimeOfDay(hour: int.tryParse(parts[0]) ?? 8, minute: int.tryParse(parts[1]) ?? 0);
  }
}
