
// lib/screens/auth_screen.dart

import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../widgets/shared_widgets.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({super.key});

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen> {
  final _supabase = Supabase.instance.client;
  
  bool _isLogin = true;
  bool _isLoading = false;
  String? _errorMsg;

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  Future<void> _handleAuth() async {
    setState(() {
      _isLoading = true;
      _errorMsg = null;
    });

    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    try {
      if (_isLogin) {
        await _supabase.auth.signInWithPassword(
          email: email,
          password: password,
        );
      } else {
        await _supabase.auth.signUp(
          email: email,
          password: password,
        );
        if (mounted) {
           ScaffoldMessenger.of(context).showSnackBar(
             const SnackBar(content: Text('Account created! You are now logged in.')),
           );
        }
      }
    } on AuthException catch (e) {
      if (mounted) setState(() => _errorMsg = e.message);
    } catch (e) {
      if (mounted) setState(() => _errorMsg = 'An unexpected error occurred');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBg : AppColors.gray50,
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Header
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.primary600,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.primary600.withOpacity(0.3),
                      blurRadius: 20,
                      offset: const Offset(0, 10),
                    )
                  ],
                ),
                child: const Icon(LucideIcons.dumbbell, color: Colors.white, size: 32),
              ),
              const SizedBox(height: 16),
              Text(
                'IronLog',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : AppColors.gray900,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Track your strength, visualize your progress.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: isDark ? AppColors.gray400 : AppColors.gray500,
                ),
              ),
              const SizedBox(height: 32),

              // Card
              IronLogCard(
                child: Column(
                  children: [
                    // Toggle
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.gray800 : AppColors.gray100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _isLogin = true),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: _isLogin ? (isDark ? AppColors.darkCard : Colors.white) : Colors.transparent,
                                  borderRadius: BorderRadius.circular(6),
                                  boxShadow: _isLogin ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)] : [],
                                ),
                                child: Text(
                                  'Log In',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                    color: _isLogin 
                                      ? (isDark ? Colors.white : AppColors.gray900) 
                                      : (isDark ? AppColors.gray400 : AppColors.gray500),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => _isLogin = false),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(vertical: 8),
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: !_isLogin ? (isDark ? AppColors.darkCard : Colors.white) : Colors.transparent,
                                  borderRadius: BorderRadius.circular(6),
                                  boxShadow: !_isLogin ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)] : [],
                                ),
                                child: Text(
                                  'Sign Up',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                    color: !_isLogin 
                                      ? (isDark ? Colors.white : AppColors.gray900) 
                                      : (isDark ? AppColors.gray400 : AppColors.gray500),
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Error
                    if (_errorMsg != null)
                      Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            const Icon(LucideIcons.alertCircle, color: Colors.red, size: 16),
                            const SizedBox(width: 8),
                            Expanded(child: Text(_errorMsg!, style: const TextStyle(color: Colors.red, fontSize: 13))),
                          ],
                        ),
                      ),

                    // Form
                    IronLogInput(
                      label: 'Email',
                      placeholder: 'you@example.com',
                      keyboardType: TextInputType.emailAddress,
                      controller: _emailController,
                    ),
                    const SizedBox(height: 16),
                    IronLogInput(
                      label: 'Password',
                      placeholder: '••••••••',
                      obscureText: true,
                      controller: _passwordController,
                    ),
                    const SizedBox(height: 24),

                    // Button
                    CustomButton(
                      text: _isLogin ? 'Sign In' : 'Create Account',
                      isLoading: _isLoading,
                      fullWidth: true,
                      onPressed: _handleAuth,
                      icon: LucideIcons.arrowRight,
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              Text(
                'By confirming, you access the IronLog gym tracker system.',
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? AppColors.gray600 : AppColors.gray400,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
