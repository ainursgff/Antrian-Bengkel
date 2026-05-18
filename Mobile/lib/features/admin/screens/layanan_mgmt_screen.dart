import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/admin_provider.dart';
import '../../../models/layanan_model.dart';

class LayananMgmtScreen extends StatefulWidget {
  const LayananMgmtScreen({super.key});

  @override
  State<LayananMgmtScreen> createState() => _LayananMgmtScreenState();
}

class _LayananMgmtScreenState extends State<LayananMgmtScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final prov = Provider.of<AdminProvider>(context, listen: false);
      prov.loadLayanan();
      prov.loadKategori();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kelola Layanan')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showForm(context),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Consumer<AdminProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.layanan.isEmpty) {
            return const AppLoading(message: 'Memuat layanan...');
          }
          if (provider.layanan.isEmpty) {
            return const AppEmptyState(
              icon: Icons.build_outlined,
              title: 'Belum Ada Layanan',
              subtitle: 'Tambahkan layanan baru.',
            );
          }

          return RefreshIndicator(
            onRefresh: () async {
              await provider.loadLayanan();
              await provider.loadKategori();
            },
            color: AppColors.primary,
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: provider.layanan.length,
              itemBuilder: (context, i) {
                final l = provider.layanan[i];
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.surface,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Theme.of(context).dividerColor),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    leading: Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: l.aktif ? AppColors.primaryLight : Theme.of(context).colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.build_rounded,
                        color: l.aktif ? AppColors.primary : Theme.of(context).colorScheme.onSurfaceVariant,
                        size: 22,
                      ),
                    ),
                    title: Text(l.namaLayanan, style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(
                      '${l.kategori?.namaKategori ?? 'Tanpa Kategori'} • ${l.estimasiMenit} mnt • ${Helpers.formatRupiah(l.harga)}',
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                    trailing: PopupMenuButton<String>(
                      icon: const Icon(Icons.more_vert),
                      itemBuilder: (_) => [
                        const PopupMenuItem(value: 'edit', child: Text('Edit')),
                        const PopupMenuItem(value: 'delete', child: Text('Hapus')),
                      ],
                      onSelected: (v) {
                        if (v == 'edit') _showForm(context, layanan: l);
                        if (v == 'delete') _confirmDelete(context, l);
                      },
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

  void _showForm(BuildContext context, {LayananModel? layanan}) {
    final isEdit = layanan != null;
    final namaCtrl = TextEditingController(text: layanan?.namaLayanan ?? '');
    final descCtrl = TextEditingController(text: layanan?.deskripsi ?? '');
    final estCtrl = TextEditingController(text: (layanan?.estimasiMenit ?? 30).toString());
    final hargaCtrl = TextEditingController(text: layanan?.harga.toString() ?? '0');
    int? selectedKategoriId = layanan?.kategoriId;
    bool isAktif = layanan?.aktif ?? true;

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
                    Center(
                      child: Container(
                        width: 48,
                        height: 4,
                        decoration: BoxDecoration(
                          color: Theme.of(context).dividerColor,
                          borderRadius: BorderRadius.circular(2),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),
                    Text(
                      isEdit ? 'Edit Layanan' : 'Tambah Layanan',
                      style: Theme.of(ctx).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 20),
                    Consumer<AdminProvider>(
                      builder: (_, prov, _) {
                        return DropdownButtonFormField<int>(
                          value: selectedKategoriId,
                          decoration: InputDecoration(
                            labelText: 'Kategori Kendaraan',
                            prefixIcon: const Icon(Icons.directions_car_outlined),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          ),
                          items: prov.kategoriList.map((k) {
                            return DropdownMenuItem<int>(
                              value: k.id,
                              child: Text(k.namaKategori),
                            );
                          }).toList(),
                          onChanged: (val) {
                            setSheetState(() {
                              selectedKategoriId = val;
                            });
                          },
                        );
                      },
                    ),
                    const SizedBox(height: 14),
                    AppTextField(controller: namaCtrl, label: 'Nama Layanan', prefixIcon: Icons.build_outlined),
                    const SizedBox(height: 14),
                    AppTextField(
                      controller: descCtrl,
                      label: 'Deskripsi (Opsional)',
                      prefixIcon: Icons.notes_outlined,
                      maxLines: 2,
                    ),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: AppTextField(
                            controller: estCtrl,
                            label: 'Estimasi (mnt)',
                            prefixIcon: Icons.schedule,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: AppTextField(
                            controller: hargaCtrl,
                            label: 'Harga (Rp)',
                            prefixIcon: Icons.payments,
                            keyboardType: TextInputType.number,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Layanan Aktif'),
                      value: isAktif,
                      activeThumbColor: AppColors.primary,
                      onChanged: (v) => setSheetState(() => isAktif = v),
                    ),
                    const SizedBox(height: 16),
                    Consumer<AdminProvider>(
                      builder: (_, prov, _) {
                        return AppButton(
                          text: isEdit ? 'Simpan Perubahan' : 'Tambah Layanan',
                          isLoading: prov.isSubmitting,
                          onPressed: () async {
                            if (selectedKategoriId == null) {
                              Helpers.showSnackbar(ctx, 'Kategori kendaraan wajib dipilih', isError: true);
                              return;
                            }
                            if (namaCtrl.text.trim().isEmpty) {
                              Helpers.showSnackbar(ctx, 'Nama layanan wajib diisi', isError: true);
                              return;
                            }
                            final data = {
                              'kategori_id': selectedKategoriId,
                              'nama_layanan': namaCtrl.text.trim(),
                              'deskripsi': descCtrl.text.trim(),
                              'estimasi_menit': int.tryParse(estCtrl.text) ?? 30,
                              'harga': int.tryParse(hargaCtrl.text) ?? 0,
                              'is_aktif': isAktif ? 1 : 0,
                            };
                            final r = isEdit
                                ? await prov.updateLayanan(layanan.id, data)
                                : await prov.createLayanan(data);
                            if (ctx.mounted) {
                              Navigator.of(ctx).pop();
                              r['success'] == true
                                  ? Helpers.showSuccess(context, r['message'] ?? 'Berhasil')
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

  void _confirmDelete(BuildContext context, LayananModel l) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Hapus Layanan'),
        content: Text('Hapus "${l.namaLayanan}"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final prov = Provider.of<AdminProvider>(context, listen: false);
              final r = await prov.deleteLayanan(l.id);
              if (context.mounted) {
                r['success'] == true
                    ? Helpers.showSuccess(context, 'Layanan dihapus')
                    : Helpers.showSnackbar(context, r['error'] ?? 'Gagal', isError: true);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Hapus'),
          ),
        ],
      ),
    );
  }
}
