
// lib/services/database_service.dart

import 'dart:convert';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/types.dart';

class DatabaseService {
  final SupabaseClient _supabase = Supabase.instance.client;

  // --- Constants ---
  static const String SETTINGS_KEY = 'ironlog_settings';
  static const String ACTIVE_SESSION_KEY = 'ironlog_active_session';
  static const String ABANDONED_SESSION_KEY = 'ironlog_abandoned_session';

  // --- Routines ---
  Future<List<Routine>> getRoutines() async {
    try {
      final routinesResponse = await _supabase
          .from('routines')
          .select('*')
          .order('sort_order', ascending: true)
          .order('created_at', ascending: true);

      final List<dynamic> routinesData = routinesResponse as List<dynamic>;

      // Fetch latest sessions to determine sorting order
      final sessionsResponse = await _supabase
          .from('sessions')
          .select('routine_id, start_time')
          .order('start_time', ascending: false);
      final List<dynamic> sessionsData = sessionsResponse as List<dynamic>;

      return routinesData.map((r) {
        // Find most recent session
        final lastSession = sessionsData.firstWhere(
          (s) => s['routine_id'] == r['id'],
          orElse: () => null,
        );

        List<RoutineExercise> exercises = [];
        if (r['exercises_json'] != null) {
          exercises = (r['exercises_json'] as List)
              .map((e) => RoutineExercise.fromJson(e))
              .toList();
        }

        return Routine(
          id: r['id'],
          name: r['name'],
          dayLabel: r['day_label'],
          exercises: exercises,
          lastPerformed: lastSession != null ? lastSession['start_time'] : 0,
          sortOrder: r['sort_order'],
        );
      }).toList();
    } catch (e) {
      print('Error fetching routines: $e');
      return [];
    }
  }

  // --- Sessions ---
  Future<List<WorkoutSession>> getSessions() async {
    try {
      final response = await _supabase
          .from('sessions')
          .select('*')
          .order('start_time', ascending: false);
      
      final List<dynamic> data = response as List<dynamic>;

      return data.map((s) {
        // Parse exercises_json which might be nested or direct array
        List<CompletedExercise> exercises = [];
        var exJson = s['exercises_json'];
        
        // Handle variations in JSON structure
        var exercisesListRaw = (exJson is Map && exJson.containsKey('exercises')) 
            ? exJson['exercises'] 
            : exJson;
            
        if (exercisesListRaw is List) {
          exercises = exercisesListRaw.map((e) => CompletedExercise.fromJson(e)).toList();
        }

        return WorkoutSession(
          id: s['id'],
          routineId: s['routine_id'],
          routineName: s['routine_name'],
          startTime: s['start_time'],
          endTime: s['end_time'],
          durationSeconds: s['duration_seconds'],
          totalVolume: (s['total_volume'] as num).toDouble(),
          date: s['date'],
          bodyWeight: exJson is Map ? (exJson['bodyWeight'] as num?)?.toDouble() : null,
          exercises: exercises,
        );
      }).toList();
    } catch (e) {
      print('Error fetching sessions: $e');
      return [];
    }
  }

  Future<void> saveSession(WorkoutSession session) async {
    final user = _supabase.auth.currentUser;
    if (user == null) return;

    final exercisesPayload = {
      'exercises': session.exercises.map((e) => e.toJson()).toList(),
      'bodyWeight': session.bodyWeight
    };

    final payload = {
      'id': session.id,
      'user_id': user.id,
      'routine_id': session.routineId,
      'routine_name': session.routineName,
      'start_time': session.startTime,
      'end_time': session.endTime,
      'duration_seconds': session.durationSeconds,
      'total_volume': session.totalVolume,
      'date': session.date,
      'exercises_json': exercisesPayload
    };

    try {
      await _supabase.from('sessions').upsert(payload);
    } catch (e) {
      print('Error saving session: $e');
    }
  }

  // --- Local Storage (Shared Preferences) ---
  Future<void> saveActiveSession(WorkoutSession? session) async {
    final prefs = await SharedPreferences.getInstance();
    if (session == null) {
      await prefs.remove(ACTIVE_SESSION_KEY);
    } else {
      await prefs.setString(ACTIVE_SESSION_KEY, jsonEncode(session.toJson()));
    }
  }

  Future<WorkoutSession?> getActiveSession() async {
    final prefs = await SharedPreferences.getInstance();
    final String? data = prefs.getString(ACTIVE_SESSION_KEY);
    if (data == null) return null;
    try {
      return WorkoutSession.fromJson(jsonDecode(data));
    } catch (e) {
      return null;
    }
  }

  // Add more methods mapping to dataService.ts as needed...
}
