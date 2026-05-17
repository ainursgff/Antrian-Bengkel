import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/home/screens/main_navigation_screen.dart';
import '../features/antrian/screens/ambil_antrian_screen.dart';
import '../features/admin/screens/admin_dashboard.dart';
import '../features/montir/screens/montir_dashboard.dart';

class AppRouter {
  final AuthProvider authProvider;
  AppRouter(this.authProvider);

  late final GoRouter router = GoRouter(
    refreshListenable: authProvider,
    initialLocation: '/login',
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => LoginScreen(),
      ),
      GoRoute(
        path: '/customer',
        builder: (context, state) => MainNavigationScreen(),
      ),
      GoRoute(
        path: '/ambil-antrian',
        builder: (context, state) => AmbilAntrianScreen(),
      ),
      GoRoute(
        path: '/admin',
        builder: (context, state) => AdminDashboardScreen(),
      ),
      GoRoute(
        path: '/montir',
        builder: (context, state) => MontirDashboardScreen(),
      ),
    ],
    redirect: (context, state) {
      final bool loggedIn = authProvider.isAuthenticated;
      final String? role = authProvider.role;
      final bool goingToLogin = state.matchedLocation == '/login';

      if (!loggedIn && !goingToLogin) {
        return '/login';
      }
      
      if (loggedIn && goingToLogin) {
        if (role == 'admin') return '/admin';
        if (role == 'montir') return '/montir';
        return '/customer';
      }
      
      return null;
    },
  );
}
