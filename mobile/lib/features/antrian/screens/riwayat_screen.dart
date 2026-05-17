import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/app_loading.dart';
import '../../../providers/antrian_provider.dart';
import '../widgets/antrian_card.dart';
import 'detail_antrian_screen.dart';

class RiwayatScreen extends StatefulWidget {
  const RiwayatScreen({super.key});

  @override
  State<RiwayatScreen> createState() => _RiwayatScreenState();
}

class _RiwayatScreenState extends State<RiwayatScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<AntrianProvider>(context, listen: false).loadRiwayat();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      
      appBar: AppBar(title: Text('Riwayat Antrian')),
      body: Consumer<AntrianProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading && provider.riwayat.isEmpty) {
            return const AppLoading(message: 'Memuat riwayat...');
          }

          if (provider.riwayat.isEmpty) {
            return const AppEmptyState(
              icon: Icons.history_rounded,
              title: 'Belum Ada Riwayat',
              subtitle: 'Riwayat antrian Anda akan muncul di sini setelah Anda mengambil antrian.',
            );
          }

          return RefreshIndicator(
            onRefresh: () => provider.loadRiwayat(),
            color: AppColors.primary,
            child: ListView.builder(
              padding: const EdgeInsets.all(20),
              physics: const AlwaysScrollableScrollPhysics(),
              itemCount: provider.riwayat.length,
              itemBuilder: (context, index) {
                final antrian = provider.riwayat[index];
                return AntrianCard(
                  antrian: antrian,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => DetailAntrianScreen(antrian: antrian),
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}
