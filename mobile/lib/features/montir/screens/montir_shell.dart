import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/notifikasi_provider.dart';
import 'montir_dashboard_screen.dart';
import 'montir_riwayat_screen.dart';
import '../../notifikasi/screens/notifikasi_screen.dart';
import 'montir_profil_screen.dart';

class MontirShell extends StatefulWidget {
  const MontirShell({super.key});

  @override
  State<MontirShell> createState() => _MontirShellState();
}

class _MontirShellState extends State<MontirShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    MontirDashboardScreen(),
    MontirRiwayatScreen(),
    NotifikasiScreen(),
    MontirProfilScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<NotifikasiProvider>(context, listen: false).startPolling();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Consumer<NotifikasiProvider>(
        builder: (context, notifProv, _) {
          return NavigationBar(
            selectedIndex: _currentIndex,
            onDestinationSelected: (i) => setState(() => _currentIndex = i),
            destinations: [
              const NavigationDestination(
                icon: Icon(Icons.engineering_outlined),
                selectedIcon: Icon(Icons.engineering),
                label: 'Tugas',
              ),
              const NavigationDestination(
                icon: Icon(Icons.history_outlined),
                selectedIcon: Icon(Icons.history_rounded),
                label: 'Riwayat',
              ),
              NavigationDestination(
                icon: Badge(
                  isLabelVisible: notifProv.unreadCount > 0,
                  label: Text('${notifProv.unreadCount}'),
                  child: Icon(Icons.notifications_outlined),
                ),
                selectedIcon: Badge(
                  isLabelVisible: notifProv.unreadCount > 0,
                  label: Text('${notifProv.unreadCount}'),
                  child: Icon(Icons.notifications_rounded),
                ),
                label: 'Notif',
              ),
              const NavigationDestination(
                icon: Icon(Icons.person_outline),
                selectedIcon: Icon(Icons.person_rounded),
                label: 'Profil',
              ),
            ],
          );
        },
      ),
    );
  }
}
