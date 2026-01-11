
// lib/screens/dashboard/home_tab.dart

import 'package:flutter/material.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:intl/intl.dart';
import '../../widgets/shared_widgets.dart';
import '../../services/database_service.dart';
import '../../models/types.dart';

class HomeTab extends StatefulWidget {
  const HomeTab({super.key});

  @override
  State<HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends State<HomeTab> {
  final DatabaseService _db = DatabaseService();
  
  List<Routine> _routines = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final routines = await _db.getRoutines();
    if (mounted) {
      setState(() {
        _routines = routines;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final today = DateFormat('EEEE, MMMM d').format(DateTime.now());

    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    final nextRoutine = _routines.isNotEmpty ? _routines.first : null;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF09090B) : const Color(0xFFF6F8FC),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'GYMPRO',
                        style: TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w900,
                          fontStyle: FontStyle.italic,
                          color: isDark ? Colors.white : AppColors.gray900,
                        ),
                      ),
                      Text(
                        today.toUpperCase(),
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                          color: isDark ? AppColors.gray500 : AppColors.gray400,
                        ),
                      ),
                    ],
                  ),
                  CircleAvatar(
                    backgroundColor: isDark ? Colors.white.withOpacity(0.1) : Colors.white,
                    child: const Icon(LucideIcons.user, color: AppColors.gray600),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // Hero Card (Next Routine)
              if (nextRoutine != null)
                _buildHeroCard(context, nextRoutine)
              else
                IronLogCard(
                  child: Center(
                    child: Column(
                      children: [
                        Text("No routines found"),
                        const SizedBox(height: 8),
                        CustomButton(text: "Create Routine", onPressed: () {}),
                      ],
                    ),
                  ),
                ),

              const SizedBox(height: 24),

              // Metrics Row
              Row(
                children: [
                  Expanded(
                    child: _buildMetricCard(
                      context,
                      label: "Weight",
                      value: "75.5",
                      unit: "kg",
                      icon: LucideIcons.scale,
                      color: Colors.purple,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: _buildMetricCard(
                      context,
                      label: "BMI",
                      value: "24.2",
                      unit: "",
                      icon: LucideIcons.ruler,
                      color: Colors.teal,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeroCard(BuildContext context, Routine routine) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(32),
        boxShadow: isDark ? [] : [
          BoxShadow(color: Colors.blue.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 10))
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(32),
        child: Stack(
          children: [
            // Background decoration similar to web
            Positioned(
              right: -50,
              top: -50,
              child: Container(
                width: 200,
                height: 200,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.blue.withOpacity(0.1),
                  boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.2), blurRadius: 40)],
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          color: Colors.blue.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(20),
                          border: Border.all(color: Colors.blue.withOpacity(0.2)),
                        ),
                        child: Row(
                          children: [
                            Container(width: 6, height: 6, decoration: const BoxDecoration(color: Colors.blue, shape: BoxShape.circle)),
                            const SizedBox(width: 6),
                            const Text(
                              "TODAY'S WORKOUT",
                              style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.blue),
                            ),
                          ],
                        ),
                      ),
                      if (routine.lastPerformed != null)
                        Text(
                          "LAST: 2 DAYS AGO",
                          style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.gray400),
                        ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  Text(
                    routine.name,
                    style: TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      height: 1.0,
                      color: isDark ? Colors.white : AppColors.gray900,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(LucideIcons.activity, size: 14, color: AppColors.gray500),
                      const SizedBox(width: 4),
                      Text(
                        "${routine.exercises.length} EXERCISES",
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.gray500),
                      ),
                      const SizedBox(width: 16),
                      Icon(LucideIcons.timer, size: 14, color: AppColors.gray500),
                      const SizedBox(width: 4),
                      Text(
                        "~${routine.exercises.length * 5} MIN",
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppColors.gray500),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  SwipeToStart(
                    onSwipe: () {
                      // Navigate to Active Session
                    },
                    text: "SWIPE TO START",
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricCard(BuildContext context, {required String label, required String value, required String unit, required IconData icon, required Color color}) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkCard : Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(icon, size: 20, color: color),
          ),
          const SizedBox(height: 16),
          Text(
            label.toUpperCase(),
            style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppColors.gray400),
          ),
          const SizedBox(height: 4),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(
                value,
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w900, color: isDark ? Colors.white : AppColors.gray900),
              ),
              const SizedBox(width: 2),
              Text(
                unit,
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: AppColors.gray500),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
