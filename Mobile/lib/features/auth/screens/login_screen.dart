import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_constants.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/utils/helpers.dart';
import '../../../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.login(
      _emailController.text.trim(),
      _passwordController.text,
    );

    if (!mounted) return;

    if (success) {
      final role = authProvider.role;
      if (role == AppConstants.roleAdmin) {
        context.go('/admin');
      } else if (role == AppConstants.roleMontir) {
        context.go('/montir');
      } else {
        context.go('/customer');
      }
    } else {
      Helpers.showSnackbar(
        context,
        authProvider.errorMessage ?? 'Login gagal',
        isError: true,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.primaryLight,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.build_rounded,
                      size: 56,
                      color: AppColors.primary,
                    ),
                  )
                      .animate()
                      .scale(
                        begin: const Offset(0.5, 0.5),
                        end: const Offset(1.0, 1.0),
                        duration: 500.ms,
                        curve: Curves.easeOutBack,
                      )
                      .fadeIn(duration: 400.ms),

                  SizedBox(height: 24),

                  Text(
                    AppConstants.appName,
                    style: Theme.of(context).textTheme.headlineLarge,
                  ).animate().fadeIn(delay: 200.ms, duration: 400.ms),

                  SizedBox(height: 8),

                  Text(
                    'Masuk ke akun Anda untuk melanjutkan',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ).animate().fadeIn(delay: 300.ms, duration: 400.ms),

                  SizedBox(height: 40),

                  // Form Card
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Theme.of(context).colorScheme.surface,
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.04),
                          blurRadius: 24,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        AppTextField(
                          controller: _emailController,
                          label: 'Email',
                          hint: 'Masukkan email Anda',
                          prefixIcon: Icons.email_outlined,
                          keyboardType: TextInputType.emailAddress,
                          validator: (value) {
                            if (value == null || value.trim().isEmpty) {
                              return 'Email wajib diisi';
                            }
                            if (!value.contains('@')) {
                              return 'Format email tidak valid';
                            }
                            return null;
                          },
                        ),
                        SizedBox(height: 16),
                        AppTextField(
                          controller: _passwordController,
                          label: 'Password',
                          hint: 'Masukkan password Anda',
                          prefixIcon: Icons.lock_outline,
                          obscureText: _obscurePassword,
                          suffixIcon: IconButton(
                            icon: Icon(
                              _obscurePassword ? Icons.visibility_off_outlined : Icons.visibility_outlined,
                            ),
                            onPressed: () {
                              setState(() => _obscurePassword = !_obscurePassword);
                            },
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Password wajib diisi';
                            }
                            return null;
                          },
                        ),
                        SizedBox(height: 8),
                        Align(
                          alignment: Alignment.centerRight,
                          child: TextButton(
                            onPressed: () => context.push('/forgot-password'),
                            child: Text(
                              'Lupa Password?',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: AppColors.primary,
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                          ),
                        ),
                        SizedBox(height: 16),
                        Consumer<AuthProvider>(
                          builder: (context, auth, _) {
                            return AppButton(
                              text: 'Masuk',
                              isLoading: auth.isLoading,
                              onPressed: _handleLogin,
                            );
                          },
                        ),
                      ],
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 400.ms, duration: 500.ms)
                      .slideY(begin: 0.15, end: 0, delay: 400.ms, duration: 500.ms),

                  SizedBox(height: 24),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        'Belum punya akun? ',
                        style: Theme.of(context).textTheme.bodyMedium,
                      ),
                      GestureDetector(
                        onTap: () => context.push('/register'),
                        child: Text(
                          'Daftar Sekarang',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                color: AppColors.primary,
                              ),
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 600.ms, duration: 400.ms),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
