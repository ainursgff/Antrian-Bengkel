import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/widgets/app_button.dart';
import '../../../core/widgets/app_text_field.dart';
import '../../../core/utils/helpers.dart';
import '../../../providers/auth_provider.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _emailVerified = false;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _emailController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _verifyEmail() async {
    if (_emailController.text.trim().isEmpty || !_emailController.text.contains('@')) {
      Helpers.showSnackbar(context, 'Masukkan email yang valid', isError: true);
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final result = await authProvider.forgotPassword(_emailController.text.trim());

    if (!mounted) return;

    if (result['success'] == true) {
      setState(() => _emailVerified = true);
      Helpers.showSuccess(context, 'Email terverifikasi! Buat password baru.');
    } else {
      Helpers.showSnackbar(context, result['message'] ?? 'Email tidak ditemukan', isError: true);
    }
  }

  Future<void> _resetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final result = await authProvider.resetPassword(
      _emailController.text.trim(),
      _newPasswordController.text,
    );

    if (!mounted) return;

    if (result['success'] == true) {
      Helpers.showSuccess(context, 'Password berhasil direset!');
      await Future.delayed(const Duration(seconds: 1));
      if (mounted) context.go('/login');
    } else {
      Helpers.showSnackbar(context, result['message'] ?? 'Gagal reset password', isError: true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      
      appBar: AppBar(
        leading: IconButton(
          icon: Icon(Icons.arrow_back_rounded),
          onPressed: () => context.pop(),
        ),
        title: Text('Lupa Password'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Icon
                Center(
                  child: Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: AppColors.warningLight,
                      shape: BoxShape.circle,
                    ),
                    child: Icon(Icons.lock_reset_rounded, size: 48, color: AppColors.warning),
                  ),
                ).animate().scale(begin: const Offset(0.5, 0.5), end: const Offset(1, 1), duration: 500.ms, curve: Curves.easeOutBack),

                SizedBox(height: 24),

                Text(
                  _emailVerified ? 'Buat Password Baru' : 'Verifikasi Email',
                  style: Theme.of(context).textTheme.headlineMedium,
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 8),
                Text(
                  _emailVerified
                      ? 'Masukkan password baru untuk akun Anda.'
                      : 'Masukkan email yang terdaftar untuk mereset password Anda.',
                  style: Theme.of(context).textTheme.bodyMedium,
                ),

                SizedBox(height: 32),

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
                        prefixIcon: Icons.email_outlined,
                        keyboardType: TextInputType.emailAddress,
                        enabled: !_emailVerified,
                      ),

                      if (_emailVerified) ...[
                        SizedBox(height: 16),
                        AppTextField(
                          controller: _newPasswordController,
                          label: 'Password Baru',
                          prefixIcon: Icons.lock_outline,
                          obscureText: _obscureNew,
                          suffixIcon: IconButton(
                            icon: Icon(_obscureNew ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                            onPressed: () => setState(() => _obscureNew = !_obscureNew),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) return 'Password baru wajib diisi';
                            if (value.length < 6) return 'Minimal 6 karakter';
                            return null;
                          },
                        ),
                        SizedBox(height: 16),
                        AppTextField(
                          controller: _confirmPasswordController,
                          label: 'Konfirmasi Password Baru',
                          prefixIcon: Icons.lock_outline,
                          obscureText: _obscureConfirm,
                          suffixIcon: IconButton(
                            icon: Icon(_obscureConfirm ? Icons.visibility_off_outlined : Icons.visibility_outlined),
                            onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
                          ),
                          validator: (value) {
                            if (value != _newPasswordController.text) return 'Password tidak cocok';
                            return null;
                          },
                        ),
                      ],

                      SizedBox(height: 24),

                      Consumer<AuthProvider>(
                        builder: (context, auth, _) {
                          return AppButton(
                            text: _emailVerified ? 'Reset Password' : 'Verifikasi Email',
                            icon: _emailVerified ? Icons.check_rounded : Icons.send_rounded,
                            isLoading: auth.isLoading,
                            onPressed: _emailVerified ? _resetPassword : _verifyEmail,
                          );
                        },
                      ),
                    ],
                  ),
                ).animate().fadeIn(delay: 200.ms, duration: 500.ms),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
