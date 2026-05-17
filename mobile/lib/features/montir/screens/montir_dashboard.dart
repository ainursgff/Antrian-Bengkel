import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../providers/auth_provider.dart';

class MontirDashboardScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final user = authProvider.user ?? {};

    return Scaffold(
      appBar: AppBar(
        title: Text('Montir Dashboard'),
        actions: [
          IconButton(
            icon: Icon(Icons.logout),
            onPressed: () => authProvider.logout(),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.build, size: 80, color: Colors.orange),
            SizedBox(height: 16),
            Text('Selamat datang, Montir ${user['nama']}!'),
            SizedBox(height: 16),
            Text('Daftar kendaraan yang ditugaskan akan segera hadir.'),
          ],
        ),
      ),
    );
  }
}
