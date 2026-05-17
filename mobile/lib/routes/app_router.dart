import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../core/constants/app_constants.dart';
import '../features/splash/splash_screen.dart';
import '../features/onboarding/onboarding_screen.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/register_screen.dart';
import '../features/auth/screens/forgot_password_screen.dart';

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
      // Customer — Phase 2
      GoRoute(
        path: '/customer',
        builder: (context, state) => const _PlaceholderScreen(title: 'Dashboard Pelanggan'),
      ),
      // Admin — Phase 2
      GoRoute(
        path: '/admin',
        builder: (context, state) => const _PlaceholderScreen(title: 'Dashboard Admin'),
      ),
      // Montir — Phase 2
      GoRoute(
        path: '/montir',
        builder: (context, state) => const _PlaceholderScreen(title: 'Dashboard Petugas'),
      ),
    ],
    redirect: (context, state) {
      final loggedIn = authProvider.isAuthenticated;
      final role = authProvider.role;
      final loc = state.matchedLocation;

      // Publicly accessible routes
      final publicRoutes = ['/', '/onboarding', '/login', '/register', '/forgot-password'];
      final isPublic = publicRoutes.contains(loc);

      // If not logged in and trying to access protected route, redirect to login
      if (!loggedIn && !isPublic) {
        return '/login';
      }

      // If logged in and trying to access login/register, redirect to dashboard
      if (loggedIn && (loc == '/login' || loc == '/register')) {
        if (role == AppConstants.roleAdmin) return '/admin';
        if (role == AppConstants.roleMontir) return '/montir';
        return '/customer';
      }

      return null;
    },
  );
}

// Temporary placeholder until Phase 2 screens are built
class _PlaceholderScreen extends StatelessWidget {
  final String title;
  const _PlaceholderScreen({required this.title});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: Center(
        child: Text(
          '$title\n(Phase 2)',
          textAlign: TextAlign.center,
          style: Theme.of(context).textTheme.headlineSmall,
        ),
      ),
    );
  }
}
