
// lib/models/types.dart

class Set {
  String id;
  int reps;
  double weight;
  double? distance; // km
  int? duration; // minutes
  bool completed;
  double? rpe;

  Set({
    required this.id,
    required this.reps,
    required this.weight,
    this.distance,
    this.duration,
    required this.completed,
    this.rpe,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'reps': reps,
    'weight': weight,
    'distance': distance,
    'duration': duration,
    'completed': completed,
    'rpe': rpe,
  };

  factory Set.fromJson(Map<String, dynamic> json) => Set(
    id: json['id'],
    reps: json['reps'] ?? 0,
    weight: (json['weight'] as num).toDouble(),
    distance: (json['distance'] as num?)?.toDouble(),
    duration: json['duration'],
    completed: json['completed'] ?? false,
    rpe: (json['rpe'] as num?)?.toDouble(),
  );
}

class Exercise {
  String id;
  String name;
  String muscleGroup;
  String? videoUrl;
  String? notes;
  int defaultSets;
  int defaultReps;
  String? trackingType; // 'reps_weight', 'reps_only', 'duration', 'distance_duration'

  Exercise({
    required this.id,
    required this.name,
    required this.muscleGroup,
    this.videoUrl,
    this.notes,
    required this.defaultSets,
    required this.defaultReps,
    this.trackingType,
  });

  factory Exercise.fromJson(Map<String, dynamic> json) => Exercise(
    id: json['id'],
    name: json['name'],
    muscleGroup: json['muscleGroup'],
    videoUrl: json['videoUrl'],
    notes: json['notes'],
    defaultSets: json['defaultSets'] ?? 3,
    defaultReps: json['defaultReps'] ?? 10,
    trackingType: json['trackingType'],
  );
}

class RoutineExercise extends Exercise {
  int? targetSets;
  int? targetReps;

  RoutineExercise({
    required super.id,
    required super.name,
    required super.muscleGroup,
    super.videoUrl,
    super.notes,
    required super.defaultSets,
    required super.defaultReps,
    super.trackingType,
    this.targetSets,
    this.targetReps,
  });

  @override
  factory RoutineExercise.fromJson(Map<String, dynamic> json) {
    return RoutineExercise(
      id: json['id'],
      name: json['name'],
      muscleGroup: json['muscleGroup'],
      videoUrl: json['videoUrl'],
      notes: json['notes'],
      defaultSets: json['defaultSets'] ?? 3,
      defaultReps: json['defaultReps'] ?? 10,
      trackingType: json['trackingType'],
      targetSets: json['targetSets'],
      targetReps: json['targetReps'],
    );
  }
}

class Routine {
  String id;
  String name;
  String? dayLabel;
  List<RoutineExercise> exercises;
  int? lastPerformed;
  int? sortOrder;

  Routine({
    required this.id,
    required this.name,
    this.dayLabel,
    required this.exercises,
    this.lastPerformed,
    this.sortOrder,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'name': name,
    'dayLabel': dayLabel,
    'exercises': exercises.map((e) => { // Serialize as JSON object
      'id': e.id,
      'name': e.name,
      'muscleGroup': e.muscleGroup,
      'videoUrl': e.videoUrl,
      'notes': e.notes,
      'defaultSets': e.defaultSets,
      'defaultReps': e.defaultReps,
      'trackingType': e.trackingType,
      'targetSets': e.targetSets,
      'targetReps': e.targetReps,
    }).toList(),
    'lastPerformed': lastPerformed,
    'sortOrder': sortOrder,
  };
}

class CompletedExercise {
  String exerciseId;
  String name;
  List<Set> sets;
  String? notes;
  String? trackingType;

  CompletedExercise({
    required this.exerciseId,
    required this.name,
    required this.sets,
    this.notes,
    this.trackingType,
  });

  Map<String, dynamic> toJson() => {
    'exerciseId': exerciseId,
    'name': name,
    'sets': sets.map((s) => s.toJson()).toList(),
    'notes': notes,
    'trackingType': trackingType,
  };

  factory CompletedExercise.fromJson(Map<String, dynamic> json) => CompletedExercise(
    exerciseId: json['exerciseId'],
    name: json['name'],
    sets: (json['sets'] as List).map((i) => Set.fromJson(i)).toList(),
    notes: json['notes'],
    trackingType: json['trackingType'],
  );
}

class WorkoutSession {
  String id;
  String routineId;
  String routineName;
  int startTime;
  int? endTime;
  int durationSeconds;
  List<CompletedExercise> exercises;
  double totalVolume;
  String date;
  double? bodyWeight;
  int? totalPausedDuration;
  int? lastPausedTime;

  WorkoutSession({
    required this.id,
    required this.routineId,
    required this.routineName,
    required this.startTime,
    this.endTime,
    required this.durationSeconds,
    required this.exercises,
    required this.totalVolume,
    required this.date,
    this.bodyWeight,
    this.totalPausedDuration,
    this.lastPausedTime,
  });

  Map<String, dynamic> toJson() => {
    'id': id,
    'routineId': routineId,
    'routineName': routineName,
    'startTime': startTime,
    'endTime': endTime,
    'durationSeconds': durationSeconds,
    'exercises': exercises.map((e) => e.toJson()).toList(),
    'totalVolume': totalVolume,
    'date': date,
    'bodyWeight': bodyWeight,
    'totalPausedDuration': totalPausedDuration,
    'lastPausedTime': lastPausedTime,
  };

  factory WorkoutSession.fromJson(Map<String, dynamic> json) => WorkoutSession(
    id: json['id'],
    routineId: json['routineId'],
    routineName: json['routineName'],
    startTime: json['startTime'],
    endTime: json['endTime'],
    durationSeconds: json['durationSeconds'],
    exercises: (json['exercises'] as List).map((i) => CompletedExercise.fromJson(i)).toList(),
    totalVolume: (json['totalVolume'] as num).toDouble(),
    date: json['date'],
    bodyWeight: (json['bodyWeight'] as num?)?.toDouble(),
    totalPausedDuration: json['totalPausedDuration'],
    lastPausedTime: json['lastPausedTime'],
  );
}

class UserSettings {
  String theme; // 'light', 'dark', 'system'
  String unit; // 'kg', 'lb'
  int defaultRestTimer;

  UserSettings({
    this.theme = 'system',
    this.unit = 'kg',
    this.defaultRestTimer = 90,
  });

  factory UserSettings.fromJson(Map<String, dynamic> json) => UserSettings(
    theme: json['theme'] ?? 'system',
    unit: json['unit'] ?? 'kg',
    defaultRestTimer: json['defaultRestTimer'] ?? 90,
  );
  
  Map<String, dynamic> toJson() => {
    'theme': theme,
    'unit': unit,
    'defaultRestTimer': defaultRestTimer,
  };
}

class UserProfile {
  String goal;
  double? targetWeight;
  double? height;
  int? calorieGoal;
  int? proteinGoal;
  int? carbsGoal;
  int? fatsGoal;
  int? waterGoal;
  String? email;

  UserProfile({
    this.goal = 'general',
    this.targetWeight,
    this.height,
    this.calorieGoal,
    this.proteinGoal,
    this.carbsGoal,
    this.fatsGoal,
    this.waterGoal,
    this.email,
  });
  
  factory UserProfile.fromJson(Map<String, dynamic> json) => UserProfile(
    goal: json['goal'] ?? 'general',
    targetWeight: (json['targetWeight'] as num?)?.toDouble(),
    height: (json['height'] as num?)?.toDouble(),
    calorieGoal: json['calorieGoal'],
    proteinGoal: json['proteinGoal'],
    carbsGoal: json['carbsGoal'],
    fatsGoal: json['fatsGoal'],
    waterGoal: json['waterGoal'],
    email: json['email'],
  );
}
