import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../providers/auth_provider.dart';
import '../../../providers/data_provider.dart';

class CustomerDashboardScreen extends StatefulWidget {
  @override
  _CustomerDashboardScreenState createState() => _CustomerDashboardScreenState();
}

class _CustomerDashboardScreenState extends State<CustomerDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<DataProvider>(context, listen: false).loadInitialData();
    });
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user ?? {};

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF7ED),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.settings_suggest, color: Color(0xFFF97316), size: 20),
            ),
            const SizedBox(width: 12),
            const Text(
              'Antrian Bengkel',
              style: TextStyle(
                color: Color(0xFF0F172A),
                fontWeight: FontWeight.w800,
                fontSize: 18,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Color(0xFF64748B)),
            onPressed: () {
              authProvider.logout();
            },
          ),
        ],
      ),
      body: Consumer<DataProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.layanan.isEmpty) {
            return const Center(child: CircularProgressIndicator(color: Color(0xFFF97316)));
          }

          final antrian = provider.antrianAktif;

          return RefreshIndicator(
            onRefresh: () => provider.loadInitialData(),
            color: const Color(0xFFF97316),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Halo, ${user['nama'] ?? 'Pelanggan'} 👋',
                    style: const TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: Color(0xFF0F172A)),
                  ),
                  const SizedBox(height: 8),
                  const Text('Selamat datang di dashboard antrian Anda.', style: TextStyle(fontSize: 14, color: Color(0xFF64748B))),
                  const SizedBox(height: 32),

                  if (antrian == null)
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(32),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFE2E8F0)),
                      ),
                      child: Column(
                        children: [
                          const Icon(Icons.confirmation_num_outlined, size: 64, color: Color(0xFFCBD5E1)),
                          const SizedBox(height: 16),
                          const Text('Belum Ada Antrian', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                          const SizedBox(height: 24),
                          ElevatedButton.icon(
                            onPressed: () {
                              context.push('/ambil-antrian');
                            },
                            icon: const Icon(Icons.add_circle_outline),
                            label: const Text('Ambil Antrian Baru'),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFF97316),
                              foregroundColor: Colors.white,
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(color: const Color(0xFFF97316), width: 2),
                      ),
                      child: Column(
                        children: [
                          const Text('Nomor Antrian Anda', style: TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold)),
                          Text(
                            antrian.nomorAntrian,
                            style: const TextStyle(fontSize: 48, fontWeight: FontWeight.w900, color: Color(0xFFF97316)),
                          ),
                          const SizedBox(height: 16),
                          Chip(label: Text(antrian.status.toUpperCase(), style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)), backgroundColor: antrian.status == 'dipanggil' ? Colors.blue : const Color(0xFFF97316)),
                          const SizedBox(height: 16),
                          if (antrian.status == 'menunggu')
                            TextButton.icon(
                              onPressed: () async {
                                final success = await provider.cancelAntrian(antrian.id);
                                if (success) {
                                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Berhasil dibatalkan')));
                                }
                              },
                              icon: const Icon(Icons.cancel, color: Colors.red),
                              label: const Text('Batalkan Antrian', style: TextStyle(color: Colors.red)),
                            )
                        ],
                      ),
                    ),

                  const SizedBox(height: 32),
                  const Text('Layanan Kami', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 16),
                  
                  ...provider.layanan.map((l) => Card(
                    elevation: 0,
                    color: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE2E8F0))),
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      leading: const Icon(Icons.build_circle, color: Color(0xFFF97316), size: 40),
                      title: Text(l.namaLayanan, style: const TextStyle(fontWeight: FontWeight.bold)),
                      subtitle: Text('Estimasi: ${l.estimasiMenit} menit'),
                      trailing: Text('Rp ${l.harga}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                    ),
                  )).toList(),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
