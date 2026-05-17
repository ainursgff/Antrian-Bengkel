import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/data_provider.dart';

class AmbilAntrianScreen extends StatefulWidget {
  @override
  _AmbilAntrianScreenState createState() => _AmbilAntrianScreenState();
}

class _AmbilAntrianScreenState extends State<AmbilAntrianScreen> {
  final List<int> _selectedLayananIds = [];
  final _kendaraanController = TextEditingController();
  final _catatanController = TextEditingController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<DataProvider>(context, listen: false).loadInitialData();
    });
  }

  void _submit() async {
    if (_selectedLayananIds.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Pilih minimal satu layanan')));
      return;
    }
    if (_kendaraanController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Masukkan plat/jenis kendaraan')));
      return;
    }

    final provider = Provider.of<DataProvider>(context, listen: false);
    final res = await provider.submitAntrian(
      _selectedLayananIds,
      _kendaraanController.text,
      _catatanController.text,
    );

    if (res['success'] == true) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Antrian berhasil diambil!'), backgroundColor: Colors.green),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(res['error'] ?? 'Gagal'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Ambil Antrian Baru')),
      body: Consumer<DataProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.layanan.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Pilih Layanan:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const SizedBox(height: 10),
                ...provider.layanan.map((l) {
                  final isSelected = _selectedLayananIds.contains(l.id);
                  return CheckboxListTile(
                    title: Text(l.namaLayanan, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text('Rp ${l.harga} • ${l.estimasiMenit} menit'),
                    value: isSelected,
                    onChanged: (val) {
                      setState(() {
                        if (val == true) {
                          _selectedLayananIds.add(l.id);
                        } else {
                          _selectedLayananIds.remove(l.id);
                        }
                      });
                    },
                    activeColor: const Color(0xFFF97316),
                  );
                }).toList(),
                const SizedBox(height: 20),
                TextField(
                  controller: _kendaraanController,
                  decoration: const InputDecoration(
                    labelText: 'Kendaraan (Contoh: Honda Vario - B 1234 ABC)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  controller: _catatanController,
                  maxLines: 3,
                  decoration: const InputDecoration(
                    labelText: 'Catatan Keluhan (Opsional)',
                    border: OutlineInputBorder(),
                  ),
                ),
                const SizedBox(height: 30),
                SizedBox(
                  width: double.infinity,
                  height: 50,
                  child: ElevatedButton(
                    onPressed: provider.isLoading ? null : _submit,
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFFF97316)),
                    child: provider.isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : const Text('Ambil Antrian', style: TextStyle(color: Colors.white, fontSize: 16)),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
