import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/utils/helpers.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/admin_provider.dart';
import '../../../models/user_model.dart';

class UserMgmtScreen extends StatefulWidget {
  const UserMgmtScreen({super.key});

  @override
  State<UserMgmtScreen> createState() => _UserMgmtScreenState();
}

class _UserMgmtScreenState extends State<UserMgmtScreen> {
  String _filterRole = 'semua';
  String _search = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AdminProvider>(context, listen: false).loadUsers();
    });
  }

  List<UserModel> _filtered(List<UserModel> all) {
    var list = all;
    if (_filterRole != 'semua') list = list.where((u) => u.role == _filterRole).toList();
    if (_search.isNotEmpty) {
      final q = _search.toLowerCase();
      list = list.where((u) => u.nama.toLowerCase().contains(q) || u.email.toLowerCase().contains(q)).toList();
    }
    return list;
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      
      appBar: AppBar(title: Text('Kelola Pengguna')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showForm(context),
        backgroundColor: AppColors.primary,
        child: Icon(Icons.person_add, color: Colors.white),
      ),
      body: Consumer<AdminProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.users.isEmpty) {
            return const AppLoading(message: 'Memuat pengguna...');
          }

          final filtered = _filtered(provider.users);

          return Column(
            children: [
              // Search bar
              Padding(
                padding: const EdgeInsets.fromLTRB(20, 12, 20, 0),
                child: TextField(
                  onChanged: (v) => setState(() => _search = v),
                  decoration: InputDecoration(
                    hintText: 'Cari nama atau email...',
                    prefixIcon: Icon(Icons.search),
                    suffixIcon: _search.isNotEmpty
                        ? IconButton(icon: Icon(Icons.close), onPressed: () => setState(() => _search = ''))
                        : null,
                  ),
                ),
              ),
              // Filter chips
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  children: [
                    _buildChip('semua', 'Semua'),
                    _buildChip('admin', 'Admin'),
                    _buildChip('montir', 'Petugas'),
                    _buildChip('pelanggan', 'Pelanggan'),
                  ],
                ),
              ),
              // Count
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text('${filtered.length} pengguna', style: Theme.of(context).textTheme.bodySmall),
                ),
              ),
              SizedBox(height: 8),
              // User list
              Expanded(
                child: filtered.isEmpty
                    ? const AppEmptyState(icon: Icons.people_outline, title: 'Tidak Ada', subtitle: 'Tidak ada pengguna ditemukan.')
                    : RefreshIndicator(
                        onRefresh: () => provider.loadUsers(),
                        color: AppColors.primary,
                        child: ListView.builder(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          itemCount: filtered.length,
                          itemBuilder: (context, i) => _buildUserTile(context, filtered[i], provider),
                        ),
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildChip(String value, String label) {
    final isSelected = _filterRole == value;
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: FilterChip(
        selected: isSelected,
        label: Text(label),
        labelStyle: TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: isSelected ? Colors.white : Theme.of(context).colorScheme.onSurface),
        backgroundColor: Theme.of(context).colorScheme.surfaceContainerHighest,
        selectedColor: AppColors.primary,
        checkmarkColor: Colors.white,
        onSelected: (_) => setState(() => _filterRole = value),
      ),
    );
  }

  Color _roleColor(String role) {
    switch (role) {
      case 'admin': return AppColors.error;
      case 'montir': return AppColors.info;
      default: return AppColors.success;
    }
  }

  Widget _buildUserTile(BuildContext context, UserModel u, AdminProvider provider) {
    final rc = _roleColor(u.role);
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Theme.of(context).dividerColor),
      ),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: CircleAvatar(
          backgroundColor: rc.withValues(alpha: 0.1),
          child: Text(u.nama.isNotEmpty ? u.nama[0].toUpperCase() : '?', style: TextStyle(color: rc, fontWeight: FontWeight.w800)),
        ),
        title: Text(u.nama, style: TextStyle(fontWeight: FontWeight.w700, fontSize: 14)),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(u.email, style: Theme.of(context).textTheme.bodySmall),
            SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(color: rc.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
              child: Text(Helpers.getRoleLabel(u.role), style: TextStyle(fontSize: 10, fontWeight: FontWeight.w700, color: rc)),
            ),
          ],
        ),
        trailing: PopupMenuButton(
          icon: Icon(Icons.more_vert),
          itemBuilder: (_) => [
            const PopupMenuItem(value: 'edit', child: Text('Edit')),
            const PopupMenuItem(value: 'delete', child: Text('Hapus')),
          ],
          onSelected: (v) {
            if (v == 'edit') _showForm(context, user: u);
            if (v == 'delete') _confirmDelete(context, u, provider);
          },
        ),
      ),
    );
  }

  void _showForm(BuildContext context, {UserModel? user}) {
    final isEdit = user != null;
    final namaCtrl = TextEditingController(text: user?.nama ?? '');
    final emailCtrl = TextEditingController(text: user?.email ?? '');
    final noHpCtrl = TextEditingController(text: user?.noHp ?? '');
    final passCtrl = TextEditingController();
    String role = user?.role ?? 'pelanggan';

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
                    Text(isEdit ? 'Edit Pengguna' : 'Tambah Pengguna', style: Theme.of(ctx).textTheme.headlineSmall),
                    SizedBox(height: 20),
                    AppTextField(controller: namaCtrl, label: 'Nama', prefixIcon: Icons.person_outline, textCapitalization: TextCapitalization.words),
                    SizedBox(height: 14),
                    AppTextField(controller: emailCtrl, label: 'Email', prefixIcon: Icons.email_outlined, keyboardType: TextInputType.emailAddress),
                    SizedBox(height: 14),
                    AppTextField(controller: noHpCtrl, label: 'No. HP', prefixIcon: Icons.phone_outlined, keyboardType: TextInputType.phone),
                    SizedBox(height: 14),
                    AppTextField(controller: passCtrl, label: isEdit ? 'Password (kosongkan jika tidak diubah)' : 'Password', prefixIcon: Icons.lock_outline, obscureText: true),
                    SizedBox(height: 14),
                    DropdownButtonFormField<String>(
                      initialValue: role,
                      decoration: const InputDecoration(labelText: 'Role', prefixIcon: Icon(Icons.badge_outlined)),
                      items: const [
                        DropdownMenuItem(value: 'pelanggan', child: Text('Pelanggan')),
                        DropdownMenuItem(value: 'montir', child: Text('Petugas')),
                        DropdownMenuItem(value: 'admin', child: Text('Admin')),
                      ],
                      onChanged: (v) => setSheetState(() => role = v ?? 'pelanggan'),
                    ),
                    SizedBox(height: 20),
                    Consumer<AdminProvider>(
                      builder: (_, prov, _) {
                        return AppButton(
                          text: isEdit ? 'Simpan' : 'Tambah',
                          isLoading: prov.isSubmitting,
                          onPressed: () async {
                            if (namaCtrl.text.trim().isEmpty || emailCtrl.text.trim().isEmpty) {
                              Helpers.showSnackbar(ctx, 'Nama dan email wajib diisi', isError: true);
                              return;
                            }
                            final data = <String, dynamic>{
                              'nama': namaCtrl.text.trim(),
                              'email': emailCtrl.text.trim(),
                              'no_hp': noHpCtrl.text.trim(),
                              'role': role,
                            };
                            if (passCtrl.text.isNotEmpty) data['password'] = passCtrl.text;
                            final r = isEdit ? await prov.updateUser(user.id, data) : await prov.createUser(data);
                            if (ctx.mounted) {
                              Navigator.pop(ctx);
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

  void _confirmDelete(BuildContext context, UserModel u, AdminProvider provider) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('Hapus Pengguna'),
        content: Text('Hapus "${u.nama}" (${u.email})?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: Text('Batal')),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(ctx);
              final r = await provider.deleteUser(u.id);
              if (context.mounted) {
                r['success'] == true ? Helpers.showSuccess(context, 'Pengguna dihapus') : Helpers.showSnackbar(context, r['error'] ?? 'Gagal', isError: true);
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: Text('Hapus'),
          ),
        ],
      ),
    );
  }
}
