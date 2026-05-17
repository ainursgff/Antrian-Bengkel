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
          
          return Scaffold(
            backgroundColor: Colors.transparent,
            floatingActionButton: provider.jadwal.length >= 7 ? null : FloatingActionButton.extended(
              onPressed: () => _showEditForm(context, null, provider.jadwal),
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              icon: Icon(Icons.add),
              label: Text('Tambah Jadwal'),
            ),
            body: provider.jadwal.isEmpty
                ? const AppEmptyState(icon: Icons.calendar_today, title: 'Belum Ada Jadwal', subtitle: 'Jadwal operasional belum diatur.')
                : RefreshIndicator(
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
                              onPressed: () => _showEditForm(context, j, provider.jadwal),
                            ),
                          ),
                        );
                      },
                    ),
                  ),
          );
        },
      ),
    );
  }

  void _showEditForm(BuildContext context, JadwalModel? j, List<JadwalModel> existingJadwal) {
    final existingHari = existingJadwal.map((e) => e.hari).toSet();
    if (j != null) existingHari.remove(j.hari);

    final availableHari = List.generate(7, (i) => i).where((i) => !existingHari.contains(i)).toList();
    if (availableHari.isEmpty && j == null) return;

    int selectedHari = j?.hari ?? availableHari.first;
    final bukaCtrl = TextEditingController(text: j != null ? Helpers.formatTime(j.jamBuka) : '08:00');
    final tutupCtrl = TextEditingController(text: j != null ? Helpers.formatTime(j.jamTutup) : '17:00');
    final kuotaCtrl = TextEditingController(text: (j?.kuotaPerSlot ?? 5).toString());
    bool isLibur = j?.isLibur ?? false;

    final namaHariList = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

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
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(j == null ? 'Tambah Jadwal' : 'Edit Jadwal', style: Theme.of(ctx).textTheme.headlineSmall),
                        if (j != null)
                          IconButton(
                            icon: Icon(Icons.delete_outline, color: AppColors.error),
                            onPressed: () async {
                              final prov = Provider.of<AdminProvider>(context, listen: false);
                              final r = await prov.deleteJadwal(j.id);
                              if (ctx.mounted) {
                                Navigator.pop(ctx);
                                r['success'] == true
                                    ? Helpers.showSuccess(context, 'Jadwal dihapus')
                                    : Helpers.showSnackbar(context, r['error'] ?? 'Gagal', isError: true);
                              }
                            },
                          ),
                      ],
                    ),
                    SizedBox(height: 20),
                    DropdownButtonFormField<int>(
                      value: selectedHari,
                      decoration: const InputDecoration(labelText: 'Pilih Hari', prefixIcon: Icon(Icons.today)),
                      items: availableHari.map((index) {
                        return DropdownMenuItem(value: index, child: Text(namaHariList[index]));
                      }).toList(),
                      onChanged: (v) {
                        if (v != null) setSheetState(() => selectedHari = v);
                      },
                    ),
                    SizedBox(height: 14),
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
                                final time = await showTimePicker(context: ctx, initialTime: _parseTime(bukaCtrl.text));
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
                                final time = await showTimePicker(context: ctx, initialTime: _parseTime(tutupCtrl.text));
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
                          text: j == null ? 'Simpan Jadwal Baru' : 'Simpan Perubahan',
                          isLoading: prov.isSubmitting,
                          onPressed: () async {
                            final data = {
                              'hari': selectedHari,
                              'jam_buka': '${bukaCtrl.text}:00',
                              'jam_tutup': '${tutupCtrl.text}:00',
                              'kuota_per_slot': int.tryParse(kuotaCtrl.text) ?? 5,
                              'is_libur': isLibur ? 1 : 0,
                            };
                            final r = j == null ? await prov.createJadwal(data) : await prov.updateJadwal(j.id, data);
                            if (ctx.mounted) {
                              Navigator.pop(ctx);
                              r['success'] == true
                                  ? Helpers.showSuccess(context, j == null ? 'Jadwal ditambahkan' : 'Jadwal diperbarui')
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
