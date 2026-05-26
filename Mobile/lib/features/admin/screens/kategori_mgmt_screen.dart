import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/admin_provider.dart';
import '../../../models/kategori_kendaraan_model.dart';

class KategoriMgmtScreen extends StatefulWidget {
  const KategoriMgmtScreen({super.key});

  @override
  State<KategoriMgmtScreen> createState() => _KategoriMgmtScreenState();
}

class _KategoriMgmtScreenState extends State<KategoriMgmtScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AdminProvider>(context, listen: false).loadKategori();
    });
  }

  IconData _getIconData(String? iconName) {
    switch (iconName) {
      case 'directions_car':
        return Icons.directions_car_rounded;
      case 'two_wheeler':
        return Icons.two_wheeler_rounded;
      case 'directions_bus':
        return Icons.directions_bus_rounded;
      case 'local_shipping':
        return Icons.local_shipping_rounded;
      case 'airport_shuttle':
        return Icons.airport_shuttle_rounded;
      case 'drive_eta':
        return Icons.drive_eta_rounded;
      case 'motorcycle':
        return Icons.motorcycle_rounded;
      case 'bicycle':
        return Icons.directions_bike_rounded;
      default:
        return Icons.directions_car_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Kategori Kendaraan')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showForm(context),
        backgroundColor: AppColors.primary,
        child: const Icon(Icons.add, color: Colors.white),
      ),
      body: Consumer<AdminProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.kategoriList.isEmpty) {
            return const AppLoading(message: 'Memuat kategori...');
          }
          if (provider.kategoriList.isEmpty) {
            return const AppEmptyState(
              icon: Icons.directions_car_outlined,
              title: 'Belum Ada Kategori',
              subtitle: 'Tambahkan kategori kendaraan baru.',
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadKategori(),
            color: AppColors.primary,
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              itemCount: provider.kategoriList.length,
              itemBuilder: (context, i) {
                final k = provider.kategoriList[i];
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
                        color: k.isActive ? AppColors.primaryLight : Theme.of(context).colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        _getIconData(k.icon),
                        color: k.isActive ? AppColors.primary : Theme.of(context).colorScheme.onSurfaceVariant,
                        size: 22,
                      ),
                    ),
                    title: Text(k.namaKategori, style: const TextStyle(fontWeight: FontWeight.w700)),
                    subtitle: Text(
                      k.deskripsi ?? 'Tidak ada deskripsi',
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Switch(
                          value: k.isActive,
                          activeThumbColor: AppColors.primary,
                          onChanged: (v) async {
                            final data = {
                              'nama_kategori': k.namaKategori,
                              'deskripsi': k.deskripsi,
                              'icon': k.icon,
                              'is_active': v ? 1 : 0,
                            };
                            await provider.updateKategori(k.id, data);
                          },
                        ),
                        PopupMenuButton<String>(
                          icon: const Icon(Icons.more_vert),
                          itemBuilder: (_) => [
                            const PopupMenuItem(value: 'edit', child: Text('Edit')),
                            const PopupMenuItem(value: 'delete', child: Text('Hapus')),
                          ],
                          onSelected: (v) {
                            if (v == 'edit') _showForm(context, kategori: k);
                            if (v == 'delete') _confirmDelete(context, k);
                          },
                        ),
                      ],
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

  void _showForm(BuildContext context, {KategoriKendaraanModel? kategori}) {
    final isEdit = kategori != null;
    final namaCtrl = TextEditingController(text: kategori?.namaKategori ?? '');
    final descCtrl = TextEditingController(text: kategori?.deskripsi ?? '');
    String selectedIcon = kategori?.icon ?? 'directions_car';
    bool isActive = kategori?.isActive ?? true;

    final iconsList = [
      {'value': 'directions_car', 'label': 'Mobil'},
      {'value': 'two_wheeler', 'label': 'Motor'},
      {'value': 'directions_bus', 'label': 'Bus'},
      {'value': 'local_shipping', 'label': 'Truk'},
      {'value': 'airport_shuttle', 'label': 'Pickup'},
      {'value': 'drive_eta', 'label': 'SUV'},
      {'value': 'motorcycle', 'label': 'Motor Klasik'},
      {'value': 'bicycle', 'label': 'Sepeda'},
    ];

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
                      isEdit ? 'Edit Kategori' : 'Tambah Kategori',
                      style: Theme.of(ctx).textTheme.headlineSmall,
                    ),
                    const SizedBox(height: 20),
                    AppTextField(controller: namaCtrl, label: 'Nama Kategori', prefixIcon: Icons.directions_car_outlined),
                    const SizedBox(height: 14),
                    AppTextField(
                      controller: descCtrl,
                      label: 'Deskripsi (Opsional)',
                      prefixIcon: Icons.notes_outlined,
                      maxLines: 2,
                    ),
                    const SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      value: selectedIcon,
                      decoration: InputDecoration(
                        labelText: 'Ikon Kategori',
                        prefixIcon: Icon(_getIconData(selectedIcon)),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                      items: iconsList.map((iconMap) {
                        return DropdownMenuItem<String>(
                          value: iconMap['value'],
                          child: Row(
                            children: [
                              Icon(_getIconData(iconMap['value'])),
                              const SizedBox(width: 8),
                              Text(iconMap['label']!),
                            ],
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        if (val != null) {
                          setSheetState(() {
                            selectedIcon = val;
                          });
                        }
                      },
                    ),
                    const SizedBox(height: 14),
                    SwitchListTile(
                      contentPadding: EdgeInsets.zero,
                      title: const Text('Kategori Aktif'),
                      value: isActive,
                      activeThumbColor: AppColors.primary,
                      onChanged: (v) => setSheetState(() => isActive = v),
                    ),
                    const SizedBox(height: 16),
                    Consumer<AdminProvider>(
                      builder: (_, prov, _) {
                        return AppButton(
                          text: isEdit ? 'Simpan Perubahan' : 'Tambah Kategori',
                          isLoading: prov.isSubmitting,
                          onPressed: () async {
                            if (namaCtrl.text.trim().isEmpty) {
                              Helpers.showSnackbar(ctx, 'Nama kategori wajib diisi', isError: true);
                              return;
                            }
                            final data = {
                              'nama_kategori': namaCtrl.text.trim(),
                              'deskripsi': descCtrl.text.trim(),
                              'icon': selectedIcon,
                              'is_active': isActive ? 1 : 0,
                            };
                            final r = isEdit
                                ? await prov.updateKategori(kategori.id, data)
                                : await prov.createKategori(data);
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

  void _confirmDelete(BuildContext context, KategoriKendaraanModel k) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Text('Hapus Kategori'),
        content: Text('Hapus Kategori "${k.namaKategori}"?\nLayanan yang terhubung akan kehilangan kategorinya.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final prov = Provider.of<AdminProvider>(context, listen: false);
              final r = await prov.deleteKategori(k.id);
              if (context.mounted) {
                r['success'] == true
                    ? Helpers.showSuccess(context, 'Kategori dihapus')
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
