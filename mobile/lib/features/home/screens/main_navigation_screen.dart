import 'package:flutter/material.dart';
import '../../antrian/screens/customer_dashboard_screen.dart';

class MainNavigationScreen extends StatefulWidget {
  @override
  _MainNavigationScreenState createState() => _MainNavigationScreenState();
}

class _MainNavigationScreenState extends State<MainNavigationScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    CustomerDashboardScreen(),
    const Center(child: Text('Riwayat Antrian')), // Placeholder Riwayat
    const Center(child: Text('Notifikasi')),      // Placeholder Notifikasi
    const Center(child: Text('Profil')),          // Placeholder Profil
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        backgroundColor: Colors.white,
        elevation: 8,
        indicatorColor: const Color(0xFFFFF7ED),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.home_outlined),
            selectedIcon: Icon(Icons.home, color: Color(0xFFF97316)),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(Icons.history_outlined),
            selectedIcon: Icon(Icons.history, color: Color(0xFFF97316)),
            label: 'Riwayat',
          ),
          NavigationDestination(
            icon: Badge(child: Icon(Icons.notifications_outlined)),
            selectedIcon: Badge(child: Icon(Icons.notifications, color: Color(0xFFF97316))),
            label: 'Notif',
          ),
          NavigationDestination(
            icon: Icon(Icons.person_outline),
            selectedIcon: Icon(Icons.person, color: Color(0xFFF97316)),
            label: 'Profil',
          ),
        ],
      ),
    );
  }
}
