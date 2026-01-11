
import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';

// Screens
import 'screens/auth_screen.dart';
import 'screens/home_scaffold.dart';


void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await Supabase.initialize(
    url: 'https://apikapurnhxrtbqpahwl.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwaWthcHVybmh4cnRicXBhaHdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3NjQ5NTMsImV4cCI6MjA4MDM0MDk1M30.c0ktiZ91nxtxZ3AzPl3DPl5397siWZyVeialCy_z2-g',
  );

  runApp(const IronLogApp());
}

class IronLogApp extends StatelessWidget {
  const IronLogApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'IronLog Fitness',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF7C3AED), // Violet-600 logic
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      darkTheme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF7C3AED),
          brightness: Brightness.dark,
        ),
        scaffoldBackgroundColor: const Color(0xFF0F172A), // Slate-900
        useMaterial3: true,
      ),
      themeMode: ThemeMode.system,
      home: const AuthGate(),
    );
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<AuthState>(
      stream: Supabase.instance.client.auth.onAuthStateChange,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }

        final session = snapshot.data?.session;
        if (session != null) {
          return const HomeScaffold();
        } else {
          return const AuthScreen();
        }
      },
    );
  }
}

