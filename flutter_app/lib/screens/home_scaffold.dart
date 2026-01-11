
// lib/screens/home_scaffold.dart

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import '../widgets/shared_widgets.dart';

// Screens (Placeholders for now)
import 'dashboard/home_tab.dart';

class HomeScaffold extends StatefulWidget {
  const HomeScaffold({super.key});

  @override
  State<HomeScaffold> createState() => _HomeScaffoldState();
}

class _HomeScaffoldState extends State<HomeScaffold> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeTab(),
    const Center(child: Text("Workouts (ToDo)")),
    const Center(child: Text("History (ToDo)")),
    const Center(child: Text("AI Coach (ToDo)")),
    const SettingsTab(),
  ];

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: _screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) => setState(() => _currentIndex = index),
        backgroundColor: isDark ? AppColors.darkCard : Colors.white,
        indicatorColor: isDark ? AppColors.primary600.withOpacity(0.2) : AppColors.primary600.withOpacity(0.1),
        destinations: const [
          NavigationDestination(
            icon: Icon(LucideIcons.home),
            label: 'Home',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.dumbbell),
            label: 'Workouts',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.calendar),
            label: 'History',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.barChart3),
            label: 'Coach',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.settings),
            label: 'Settings',
          ),
        ],
      ),
    );
  }
}

class SettingsTab extends StatelessWidget {
  const SettingsTab({super.key});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: CustomButton(
        text: "Sign Out",
        variant: ButtonVariant.danger,
        icon: LucideIcons.logOut,
        onPressed: () async {
          await Supabase.instance.client.auth.signOut();
        },
      ),
    );
  }
}
