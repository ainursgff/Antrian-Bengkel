import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/notifikasi_provider.dart';
import '../../antrian/screens/dashboard_screen.dart';
import '../../antrian/screens/riwayat_screen.dart';
import '../../notifikasi/screens/notifikasi_screen.dart';
import '../../profil/screens/profil_screen.dart';

class CustomerShell extends StatefulWidget {
  const CustomerShell({super.key});

  @override
  State<CustomerShell> createState() => _CustomerShellState();
}

class _CustomerShellState extends State<CustomerShell> {
  int _currentIndex = 0;

  final List<Widget> _screens = const [
    DashboardScreen(),
    RiwayatScreen(),
    NotifikasiScreen(),
    ProfilScreen(),
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
            onDestinationSelected: (index) {
              setState(() => _currentIndex = index);
            },
            destinations: [
              const NavigationDestination(
                icon: Icon(Icons.home_outlined),
                selectedIcon: Icon(Icons.home_rounded),
                label: 'Home',
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
