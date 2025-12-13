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
        { name: 'Cable Crossover', target: 'Lower/Inner Chest' },
        { name: 'Pec Deck Machine', target: 'Inner Chest (Isolation)' },
        { name: 'Push Ups', target: 'General Chest & Core', defaultTrackingType: 'reps_only' },
        { name: 'Weighted Push Ups', target: 'General Chest' },
        { name: 'Dips (Chest Focus)', target: 'Lower Chest', defaultTrackingType: 'reps_only' },
        { name: 'Landmine Press', target: 'Upper/Inner Chest' }
    ],
    'Back': [
        { name: 'Pull Ups', target: 'Lats (Width)', defaultTrackingType: 'reps_only' },
        { name: 'Chin Ups', target: 'Lats & Biceps', defaultTrackingType: 'reps_only' },
        { name: 'Lat Pulldown (Wide)', target: 'Upper Lats (Width)' },
        { name: 'Lat Pulldown (Close)', target: 'Lower Lats' },
        { name: 'Barbell Row', target: 'Mid Back (Thickness)' },
        { name: 'Pendlay Row', target: 'Upper Back/Lats (Power)' },
        { name: 'Dumbbell Row', target: 'Lats (Unilateral)' },
        { name: 'Seated Cable Row', target: 'Mid Back/Rhomboids' },
        { name: 'Deadlift', target: 'Entire Posterior Chain' },
        { name: 'Rack Pulls', target: 'Upper Back/Traps' },
        { name: 'T-Bar Row', target: 'Mid Back thickness' },
        { name: 'Face Pulls', target: 'Rear Delts & Rotator Cuff' },
        { name: 'Straight Arm Pulldown', target: 'Lats (Isolation)' },
        { name: 'Shrugs', target: 'Upper Traps' }
    ],
    'Legs': [
        { name: 'Squat (Back)', target: 'Quads & Glutes (Overall)' },
        { name: 'Squat (Front)', target: 'Quads (Anterior)' },
        { name: 'Leg Press', target: 'Quads/Glutes (Heavy Load)' },
        { name: 'Hack Squat', target: 'Quads (Isolation focus)' },
        { name: 'Romanian Deadlift', target: 'Hamstrings & Glutes' },
        { name: 'Stiff Leg Deadlift', target: 'Hamstrings (Stretch)' },
        { name: 'Walking Lunges', target: 'Glutes & Quads (Unilateral)' },
        { name: 'Bulgarian Split Squat', target: 'Glutes & Quads (Balance)' },
        { name: 'Leg Extension', target: 'Quads (Isolation)' },
        { name: 'Leg Curl (Seated)', target: 'Hamstrings' },
        { name: 'Leg Curl (Lying)', target: 'Hamstrings' },
        { name: 'Calf Raises (Standing)', target: 'Calves (Gastrocnemius)' },
        { name: 'Calf Raises (Seated)', target: 'Calves (Soleus)' },
        { name: 'Hip Thrust', target: 'Glutes (Max Contraction)' }
    ],
    'Shoulders': [
        { name: 'Overhead Press (Barbell)', target: 'Front Delts (Power)' },
        { name: 'Overhead Press (Dumbbell)', target: 'Front Delts (Stability)' },
        { name: 'Arnold Press', target: 'All Delt Heads' },
        { name: 'Seated Dumbbell Press', target: 'Front/Side Delts' },
        { name: 'Lateral Raises', target: 'Side Delts (Width)' },
        { name: 'Front Raises', target: 'Front Delts' },
        { name: 'Rear Delt Fly', target: 'Rear Delts' },
        { name: 'Upright Row', target: 'Side Delts & Traps' },
        { name: 'Cable Lateral Raise', target: 'Side Delts (Constant Tension)' }
    ],
    'Biceps': [
        { name: 'Barbell Curl', target: 'Biceps (Overall Mass)' },
        { name: 'Dumbbell Curl', target: 'Biceps (Supination)' },
        { name: 'Hammer Curl', target: 'Brachialis (Width/Forearm)' },
        { name: 'Preacher Curl', target: 'Short Head (Peak)' },
        { name: 'Concentration Curl', target: 'Biceps (Isolation)' },
        { name: 'Incline Dumbbell Curl', target: 'Long Head (Stretch)' },
        { name: 'EZ Bar Curl', target: 'Biceps (Wrist Comfort)' }
    ],
    'Triceps': [
        { name: 'Tricep Pushdown (Rope)', target: 'Lateral Head' },
        { name: 'Tricep Pushdown (Bar)', target: 'Long Head' },
        { name: 'Skullcrushers', target: 'Medial/Long Head' },
        { name: 'Overhead Ext (Dumbbell)', target: 'Long Head (Stretch)' },
        { name: 'Overhead Ext (Cable)', target: 'Long Head (Stretch)' },
        { name: 'Close Grip Bench', target: 'Triceps (Mass)' },
        { name: 'Dips', target: 'Triceps (Overall)', defaultTrackingType: 'reps_only' },
        { name: 'Kickbacks', target: 'Triceps (Contraction)' }
    ],
    'Core': [
        { name: 'Plank', target: 'Core Stability', defaultTrackingType: 'duration' },
        { name: 'Side Plank', target: 'Obliques', defaultTrackingType: 'duration' },
        { name: 'Crunches', target: 'Upper Abs', defaultTrackingType: 'reps_only' },
        { name: 'Leg Raises', target: 'Lower Abs', defaultTrackingType: 'reps_only' },
        { name: 'Hanging Leg Raises', target: 'Lower Abs (Decompressed)', defaultTrackingType: 'reps_only' },
        { name: 'Russian Twists', target: 'Obliques', defaultTrackingType: 'reps_only' },
        { name: 'Ab Wheel Rollout', target: 'Deep Core/Lats', defaultTrackingType: 'reps_only' },
        { name: 'Mountain Climbers', target: 'Core & Cardio', defaultTrackingType: 'duration' },
        { name: 'Cable Woodchopper', target: 'Obliques (Rotational)' }
    ],
    'Cardio': [
        { name: 'Treadmill Run', target: 'Endurance', defaultTrackingType: 'distance_duration' },
        { name: 'Cycling', target: 'Leg Endurance', defaultTrackingType: 'distance_duration' },
        { name: 'Elliptical', target: 'Low Impact', defaultTrackingType: 'distance_duration' },
        { name: 'Rowing Machine', target: 'Full Body Endurance', defaultTrackingType: 'distance_duration' },
        { name: 'Jump Rope', target: 'Coordination & Calves', defaultTrackingType: 'duration' },
        { name: 'HIIT Sprints', target: 'Fat Loss (Anaerobic)', defaultTrackingType: 'duration' },
        { name: 'Burpees', target: 'Full Body Conditioning', defaultTrackingType: 'reps_only' }
    ]
};
