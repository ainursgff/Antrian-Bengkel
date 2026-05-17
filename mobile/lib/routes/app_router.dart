import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../core/constants/app_constants.dart';
import '../features/splash/splash_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/auth/screens/forgot_password_screen.dart';
import '../features/home/screens/customer_shell.dart';
import '../features/antrian/screens/ambil_antrian_screen.dart';

class AppRouter {
  final AuthProvider authProvider;
  AppRouter(this.authProvider);

  late final GoRouter router = GoRouter(
    refreshListenable: authProvider,
    initialLocation: '/',
    routes: [
      // Splash
      GoRoute(
        path: '/',
        builder: (context, state) => const SplashScreen(),
      ),
      // Onboarding
      GoRoute(
        path: '/onboarding',
        builder: (context, state) => const OnboardingScreen(),
      ),
      // Auth
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      GoRoute(
        path: '/forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
      ),
      // Customer — with bottom nav
      GoRoute(
        path: '/customer',
        builder: (context, state) => const CustomerShell(),
      ),
      // Ambil Antrian (pushed on top of customer shell)
      GoRoute(
        path: '/ambil-antrian',
        builder: (context, state) => const AmbilAntrianScreen(),
      ),
      // Admin — Phase 3
      GoRoute(
        path: '/admin',
        builder: (context, state) => const _PlaceholderScreen(title: 'Dashboard Admin'),
      ),
      // Montir — Phase 3
      GoRoute(
        path: '/montir',
        builder: (context, state) => const _PlaceholderScreen(title: 'Dashboard Petugas'),
      ),
    ],
    redirect: (context, state) {
      final loggedIn = authProvider.isAuthenticated;
      final role = authProvider.role;
      final loc = state.matchedLocation;

      final publicRoutes = ['/', '/onboarding', '/login', '/register', '/forgot-password'];
      final isPublic = publicRoutes.contains(loc);

      if (!loggedIn && !isPublic) {
        return '/login';
      }

      if (loggedIn && (loc == '/login' || loc == '/register')) {
        if (role == AppConstants.roleAdmin) return '/admin';
        if (role == AppConstants.roleMontir) return '/montir';
        return '/customer';
      }

      return null;
    },
  );
}

class _PlaceholderScreen extends StatelessWidget {
  final String title;
  const _PlaceholderScreen({required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Text(
          '$title\n(Segera Hadir)',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
      ),
    );
  }
}
