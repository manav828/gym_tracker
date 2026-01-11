import { TrackingType } from '../types';

export interface ExerciseDetail {
    name: string;
    target: string;
    defaultTrackingType?: TrackingType;
}

export const COMMON_EXERCISES: Record<string, ExerciseDetail[]> = {
    'Chest': [
        { name: 'Bench Press', target: 'Middle Chest (Overall Mass)' },
        { name: 'Incline Barbell Press', target: 'Upper Chest' },
        { name: 'Decline Barbell Press', target: 'Lower Chest' },
        { name: 'Dumbbell Bench Press', target: 'Middle Chest (Stabilization)' },
        { name: 'Incline Dumbbell Press', target: 'Upper Chest' },
        { name: 'Decline Dumbbell Press', target: 'Lower Chest' },
        { name: 'Chest Fly (Dumbbell)', target: 'Inner/Outer Chest (Stretch)' },
        { name: 'Cable Crossover (High to Low)', target: 'Lower Chest' },
        { name: 'Cable Crossover (Low to High)', target: 'Upper Chest' },
        { name: 'Pec Deck Machine', target: 'Inner Chest (Isolation)' },
        { name: 'Machine Chest Press', target: 'Middle Chest (Stability)' },
        { name: 'Smith Machine Bench Press', target: 'Middle Chest (Control)' },
        { name: 'Smith Machine Incline Press', target: 'Upper Chest (Control)' },
        { name: 'Svend Press', target: 'Inner Chest (Squeeze)' },
        { name: 'Floor Press (Dumbbell)', target: 'Triceps/Middle Chest' },
        { name: 'Floor Press (Barbell)', target: 'Triceps/Middle Chest' },
        { name: 'Push Ups', target: 'General Chest & Core', defaultTrackingType: 'reps_only' },
        { name: 'Diamond Push Ups', target: 'Inner Chest/Triceps', defaultTrackingType: 'reps_only' },
        { name: 'Wide Grip Push Ups', target: 'Outer Chest', defaultTrackingType: 'reps_only' },
        { name: 'Decline Push Ups', target: 'Upper Chest', defaultTrackingType: 'reps_only' },
        { name: 'Incline Push Ups', target: 'Lower Chest', defaultTrackingType: 'reps_only' },
        { name: 'Weighted Push Ups', target: 'General Chest' },
        { name: 'Dips (Chest Focus)', target: 'Lower Chest', defaultTrackingType: 'reps_only' },
        { name: 'Landmine Press', target: 'Upper/Inner Chest' },
        { name: 'Pullover (Dumbbell)', target: 'Upper Chest/Lats (Stretch)' }
    ],
    'Back': [
        { name: 'Pull Ups', target: 'Lats (Width)', defaultTrackingType: 'reps_only' },
        { name: 'Weighted Pull Ups', target: 'Lats (Strength)' },
        { name: 'Chin Ups', target: 'Lats & Biceps', defaultTrackingType: 'reps_only' },
        { name: 'Lat Pulldown (Wide)', target: 'Upper Lats (Width)' },
        { name: 'Lat Pulldown (Reverse Grip)', target: 'Lower Lats' },
        { name: 'Lat Pulldown (Neutral Grip)', target: 'Mid Lats' },
        { name: 'Lat Pulldown (Single Arm)', target: 'Lats (Unilateral)' },
        { name: 'Barbell Row', target: 'Mid Back (Thickness)' },
        { name: 'Barbell Row (Underhand)', target: 'Lower Lats' },
        { name: 'Pendlay Row', target: 'Upper Back/Lats (Power)' },
        { name: 'Yates Row', target: 'Upper Back' },
        { name: 'Dumbbell Row', target: 'Lats (Unilateral)' },
        { name: 'Meadows Row', target: 'Lats (Stretch)' },
        { name: 'Kroc Row', target: 'Upper Back (High Reps)' },
        { name: 'Seated Cable Row', target: 'Mid Back/Rhomboids' },
        { name: 'Seated Cable Row (Wide Grip)', target: 'Upper Back/Rear Delts' },
        { name: 'Deadlift', target: 'Entire Posterior Chain' },
        { name: 'Sumo Deadlift', target: 'Post Chain/Hips' },
        { name: 'Rack Pulls', target: 'Upper Back/Traps' },
        { name: 'T-Bar Row', target: 'Mid Back thickness' },
        { name: 'Chest Supported Row', target: 'Mid Back (Isolation)' },
        { name: 'Face Pulls', target: 'Rear Delts & Rotator Cuff' },
        { name: 'Straight Arm Pulldown', target: 'Lats (Isolation)' },
        { name: 'Cable Pullover', target: 'Lats (Stretch Focus)' },
        { name: 'Shrugs (Barbell)', target: 'Upper Traps' },
        { name: 'Shrugs (Dumbbell)', target: 'Upper Traps' },
        { name: 'Hyperextensions', target: 'Lower Back', defaultTrackingType: 'reps_only' },
        { name: 'Good Mornings', target: 'Lower Back/Hamstrings' }
    ],
    'Legs': [
        { name: 'Squat (Back)', target: 'Quads & Glutes (Overall)' },
        { name: 'Squat (Front)', target: 'Quads (Anterior)' },
        { name: 'Leg Press (Standard)', target: 'Quads/Glutes (Heavy Load)' },
        { name: 'Leg Press (High Foot Placement)', target: 'Glutes/Hamstrings' },
        { name: 'Leg Press (Low Foot Placement)', target: 'Quads' },
        { name: 'Hack Squat', target: 'Quads (Isolation focus)' },
        { name: 'Sissy Squat', target: 'Quads (Peak Contraction)', defaultTrackingType: 'reps_only' },
        { name: 'Goblet Squat', target: 'Quads/Core' },
        { name: 'Romanian Deadlift (Barbell)', target: 'Hamstrings & Glutes' },
        { name: 'Romanian Deadlift (Dumbbell)', target: 'Hamstrings & Glutes' },
        { name: 'Stiff Leg Deadlift', target: 'Hamstrings (Stretch)' },
        { name: 'Walking Lunges', target: 'Glutes & Quads (Unilateral)' },
        { name: 'Reverse Lunges', target: 'Glutes/Hamstrings' },
        { name: 'Bulgarian Split Squat', target: 'Glutes & Quads (Balance)' },
        { name: 'Step Ups', target: 'Glutes/Quads (Unilateral)' },
        { name: 'Leg Extension', target: 'Quads (Isolation)' },
        { name: 'Leg Curl (Seated)', target: 'Hamstrings' },
        { name: 'Leg Curl (Lying)', target: 'Hamstrings' },
        { name: 'Leg Curl (Standing)', target: 'Hamstrings (Unilateral)' },
        { name: 'Glute Ham Raise', target: 'Hamstrings/Glutes', defaultTrackingType: 'reps_only' },
        { name: 'Calf Raises (Standing)', target: 'Calves (Gastrocnemius)' },
        { name: 'Calf Raises (Seated)', target: 'Calves (Soleus)' },
        { name: 'Calf Raises (Leg Press)', target: 'Calves' },
        { name: 'Hip Thrust (Barbell)', target: 'Glutes (Max Contraction)' },
        { name: 'Hip Thrust (Machine)', target: 'Glutes' },
        { name: 'Glute Kickback (Cable)', target: 'Glutes (Isolation)' },
        { name: 'Abductor Machine', target: 'Outer Glutes/Hips' },
        { name: 'Adductor Machine', target: 'Inner Thighs' }
    ],
    'Shoulders': [
        { name: 'Overhead Press (Barbell)', target: 'Front Delts (Power)' },
        { name: 'Overhead Press (Dumbbell)', target: 'Front Delts (Stability)' },
        { name: 'Military Press', target: 'Front Delts (Strict)' },
        { name: 'Push Press', target: 'Front Delts (Power/Explosive)' },
        { name: 'Arnold Press', target: 'All Delt Heads' },
        { name: 'Seated Dumbbell Press', target: 'Front/Side Delts' },
        { name: 'Machine Shoulder Press', target: 'Front Delts (Safety)' },
        { name: 'Lateral Raises (Dumbbell)', target: 'Side Delts (Width)' },
        { name: 'Lateral Raises (Cable)', target: 'Side Delts (Constant Tension)' },
        { name: 'Lateral Raises (Machine)', target: 'Side Delts (Isolation)' },
        { name: 'Front Raises (Dumbbell)', target: 'Front Delts' },
        { name: 'Front Raises (Cable)', target: 'Front Delts' },
        { name: 'Front Raises (Plate)', target: 'Front Delts' },
        { name: 'Rear Delt Fly (Dumbbell)', target: 'Rear Delts' },
        { name: 'Rear Delt Fly (Machine)', target: 'Rear Delts' },
        { name: 'Face Pulls', target: 'Rear Delts/Rotators' },
        { name: 'Upright Row (Barbell)', target: 'Side Delts & Traps' },
        { name: 'Upright Row (Cable)', target: 'Side Delts & Traps' },
        { name: 'Shrugs (Smith Machine)', target: 'Upper Traps' }
    ],
    'Biceps': [
        { name: 'Barbell Curl', target: 'Biceps (Overall Mass)' },
        { name: 'Dumbbell Curl', target: 'Biceps (Supination)' },
        { name: 'Hammer Curl', target: 'Brachialis (Width/Forearm)' },
        { name: 'Preacher Curl (Barbell)', target: 'Short Head (Peak)' },
        { name: 'Preacher Curl (Machine)', target: 'Short Head (Isolation)' },
        { name: 'Concentration Curl', target: 'Biceps (Isolation)' },
        { name: 'Incline Dumbbell Curl', target: 'Long Head (Stretch)' },
        { name: 'Spider Curl', target: 'Short Head (Peak)' },
        { name: 'Cable Curl', target: 'Biceps (Constant Tension)' },
        { name: 'Bayesian Curl', target: 'Long Head (Stretch)' },
        { name: 'Reverse Curl', target: 'Forearms/Brachialis' },
        { name: 'Zottman Curl', target: 'Biceps/Forearms' },
        { name: 'EZ Bar Curl', target: 'Biceps (Wrist Comfort)' },
        { name: '21s (Bicep Curls)', target: 'Biceps (Pump/Endurance)' }
    ],
    'Triceps': [
        { name: 'Tricep Pushdown (Rope)', target: 'Lateral Head' },
        { name: 'Tricep Pushdown (Bar)', target: 'Long Head' },
        { name: 'Tricep Pushdown (V-Bar)', target: 'Triceps (General)' },
        { name: 'Skullcrushers (Barbell)', target: 'Medial/Long Head' },
        { name: 'Skullcrushers (Dumbbell)', target: 'Medial/Long Head' },
        { name: 'Overhead Ext (Dumbbell)', target: 'Long Head (Stretch)' },
        { name: 'Overhead Ext (Cable)', target: 'Long Head (Stretch)' },
        { name: 'Close Grip Bench', target: 'Triceps (Mass)' },
        { name: 'Dips', target: 'Triceps (Overall)', defaultTrackingType: 'reps_only' },
        { name: 'Assisted Dips', target: 'Triceps/Chest', defaultTrackingType: 'reps_only' },
        { name: 'Bench Dips', target: 'Triceps', defaultTrackingType: 'reps_only' },
        { name: 'Kickbacks (Dumbbell)', target: 'Triceps (Contraction)' },
        { name: 'Kickbacks (Cable)', target: 'Triceps (Contraction)' },
        { name: 'JM Press', target: 'Triceps/Chest' }
    ],
    'Core': [
        { name: 'Plank', target: 'Core Stability', defaultTrackingType: 'duration' },
        { name: 'Side Plank', target: 'Obliques', defaultTrackingType: 'duration' },
        { name: 'Crunches', target: 'Upper Abs', defaultTrackingType: 'reps_only' },
        { name: 'Cable Crunches', target: 'Upper Abs (Weighted)' },
        { name: 'Leg Raises (Lying)', target: 'Lower Abs', defaultTrackingType: 'reps_only' },
        { name: 'Hanging Leg Raises', target: 'Lower Abs (Decompressed)', defaultTrackingType: 'reps_only' },
        { name: 'Captain\'s Chair Leg Raise', target: 'Lower Abs', defaultTrackingType: 'reps_only' },
        { name: 'Toes to Bar', target: 'Lower Abs/Core', defaultTrackingType: 'reps_only' },
        { name: 'Russian Twists', target: 'Obliques', defaultTrackingType: 'reps_only' },
        { name: 'Ab Wheel Rollout', target: 'Deep Core/Lats', defaultTrackingType: 'reps_only' },
        { name: 'Mountain Climbers', target: 'Core & Cardio', defaultTrackingType: 'duration' },
        { name: 'Bicycle Crunches', target: 'Obliques/Abs', defaultTrackingType: 'reps_only' },
        { name: 'Cable Woodchopper', target: 'Obliques (Rotational)' },
        { name: 'Pallof Press', target: 'Anti-Rotation Core' },
        { name: 'Landmine 180s', target: 'Obliques (Power)' },
        { name: 'Dead Bug', target: 'Core Stability', defaultTrackingType: 'reps_only' },
        { name: 'Hollow Body Hold', target: 'Core Stability', defaultTrackingType: 'duration' }
    ],
    'Cardio': [
        { name: 'Treadmill Run', target: 'Endurance', defaultTrackingType: 'distance_duration' },
        { name: 'Treadmill Walk (Incline)', target: 'Low Impact Fat Burn', defaultTrackingType: 'distance_duration' },
        { name: 'Cycling', target: 'Leg Endurance', defaultTrackingType: 'distance_duration' },
        { name: 'Elliptical', target: 'Low Impact', defaultTrackingType: 'distance_duration' },
        { name: 'Rowing Machine', target: 'Full Body Endurance', defaultTrackingType: 'distance_duration' },
        { name: 'Jump Rope', target: 'Coordination & Calves', defaultTrackingType: 'duration' },
        { name: 'HIIT Sprints', target: 'Fat Loss (Anaerobic)', defaultTrackingType: 'duration' },
        { name: 'Burpees', target: 'Full Body Conditioning', defaultTrackingType: 'reps_only' },
        { name: 'Box Jumps', target: 'Explosiveness', defaultTrackingType: 'reps_only' },
        { name: 'Battle Ropes', target: 'Shoulder/Cardio', defaultTrackingType: 'duration' },
        { name: 'Stair Climber', target: 'Glutes/Cardio', defaultTrackingType: 'duration' },
        { name: 'Swimming', target: 'Full Body', defaultTrackingType: 'duration' }
    ]
};

export const getMuscleGroupForExercise = (exerciseName: string): string | undefined => {
    for (const [muscle, exercises] of Object.entries(COMMON_EXERCISES)) {
        if (exercises.some(ex => ex.name === exerciseName)) {
            return muscle;
        }
    }
    return undefined;
};

export const getExerciseTarget = (exerciseName: string): string | undefined => {
    for (const exercises of Object.values(COMMON_EXERCISES)) {
        const exercise = exercises.find(ex => ex.name === exerciseName);
        if (exercise) {
            return exercise.target;
        }
    }
    return undefined;
};
