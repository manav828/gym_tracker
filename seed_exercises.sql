-- =====================================================
-- IronLog Exercise Database Schema & Seed Data
-- =====================================================
-- Run this in your Supabase SQL Editor

-- 1. Create the exercises table if it doesn't exist
CREATE TABLE IF NOT EXISTS exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    muscle_group TEXT NOT NULL,
    target TEXT,
    default_tracking_type TEXT DEFAULT 'reps_weight', -- 'reps_weight', 'reps_only', 'duration', 'distance_duration'
    video_url TEXT,
    notes TEXT,
    default_sets INTEGER DEFAULT 3,
    default_reps INTEGER DEFAULT 10,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add RLS policies (enable for all authenticated users to read)
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'exercises' AND policyname = 'Allow read for authenticated users'
    ) THEN
        CREATE POLICY "Allow read for authenticated users" ON exercises
            FOR SELECT TO authenticated USING (true);
    END IF;
END$$;

-- 3. Seed with all exercise data (UPSERT to avoid duplicates)
INSERT INTO exercises (name, muscle_group, target, default_tracking_type) VALUES
-- CHEST (26 exercises)
('Bench Press', 'Chest', 'Middle Chest (Overall Mass)', 'reps_weight'),
('Incline Barbell Press', 'Chest', 'Upper Chest', 'reps_weight'),
('Decline Barbell Press', 'Chest', 'Lower Chest', 'reps_weight'),
('Dumbbell Bench Press', 'Chest', 'Middle Chest (Stabilization)', 'reps_weight'),
('Incline Dumbbell Press', 'Chest', 'Upper Chest', 'reps_weight'),
('Decline Dumbbell Press', 'Chest', 'Lower Chest', 'reps_weight'),
('Chest Fly (Dumbbell)', 'Chest', 'Inner/Outer Chest (Stretch)', 'reps_weight'),
('Cable Crossover (High to Low)', 'Chest', 'Lower Chest', 'reps_weight'),
('Cable Crossover (Low to High)', 'Chest', 'Upper Chest', 'reps_weight'),
('Pec Deck Machine', 'Chest', 'Inner Chest (Isolation)', 'reps_weight'),
('Machine Chest Press', 'Chest', 'Middle Chest (Stability)', 'reps_weight'),
('Smith Machine Bench Press', 'Chest', 'Middle Chest (Control)', 'reps_weight'),
('Smith Machine Incline Press', 'Chest', 'Upper Chest (Control)', 'reps_weight'),
('Svend Press', 'Chest', 'Inner Chest (Squeeze)', 'reps_weight'),
('Floor Press (Dumbbell)', 'Chest', 'Triceps/Middle Chest', 'reps_weight'),
('Floor Press (Barbell)', 'Chest', 'Triceps/Middle Chest', 'reps_weight'),
('Push Ups', 'Chest', 'General Chest & Core', 'reps_only'),
('Diamond Push Ups', 'Chest', 'Inner Chest/Triceps', 'reps_only'),
('Wide Grip Push Ups', 'Chest', 'Outer Chest', 'reps_only'),
('Decline Push Ups', 'Chest', 'Upper Chest', 'reps_only'),
('Incline Push Ups', 'Chest', 'Lower Chest', 'reps_only'),
('Weighted Push Ups', 'Chest', 'General Chest', 'reps_weight'),
('Dips (Chest Focus)', 'Chest', 'Lower Chest', 'reps_only'),
('Landmine Press', 'Chest', 'Upper/Inner Chest', 'reps_weight'),
('Pullover (Dumbbell)', 'Chest', 'Upper Chest/Lats (Stretch)', 'reps_weight'),

-- BACK (28 exercises)
('Pull Ups', 'Back', 'Lats (Width)', 'reps_only'),
('Weighted Pull Ups', 'Back', 'Lats (Strength)', 'reps_weight'),
('Chin Ups', 'Back', 'Lats & Biceps', 'reps_only'),
('Lat Pulldown (Wide)', 'Back', 'Upper Lats (Width)', 'reps_weight'),
('Lat Pulldown (Reverse Grip)', 'Back', 'Lower Lats', 'reps_weight'),
('Lat Pulldown (Neutral Grip)', 'Back', 'Mid Lats', 'reps_weight'),
('Lat Pulldown (Single Arm)', 'Back', 'Lats (Unilateral)', 'reps_weight'),
('Barbell Row', 'Back', 'Mid Back (Thickness)', 'reps_weight'),
('Barbell Row (Underhand)', 'Back', 'Lower Lats', 'reps_weight'),
('Pendlay Row', 'Back', 'Upper Back/Lats (Power)', 'reps_weight'),
('Yates Row', 'Back', 'Upper Back', 'reps_weight'),
('Dumbbell Row', 'Back', 'Lats (Unilateral)', 'reps_weight'),
('Meadows Row', 'Back', 'Lats (Stretch)', 'reps_weight'),
('Kroc Row', 'Back', 'Upper Back (High Reps)', 'reps_weight'),
('Seated Cable Row', 'Back', 'Mid Back/Rhomboids', 'reps_weight'),
('Seated Cable Row (Wide Grip)', 'Back', 'Upper Back/Rear Delts', 'reps_weight'),
('Deadlift', 'Back', 'Entire Posterior Chain', 'reps_weight'),
('Sumo Deadlift', 'Back', 'Post Chain/Hips', 'reps_weight'),
('Rack Pulls', 'Back', 'Upper Back/Traps', 'reps_weight'),
('T-Bar Row', 'Back', 'Mid Back thickness', 'reps_weight'),
('Chest Supported Row', 'Back', 'Mid Back (Isolation)', 'reps_weight'),
('Face Pulls', 'Back', 'Rear Delts & Rotator Cuff', 'reps_weight'),
('Straight Arm Pulldown', 'Back', 'Lats (Isolation)', 'reps_weight'),
('Cable Pullover', 'Back', 'Lats (Stretch Focus)', 'reps_weight'),
('Shrugs (Barbell)', 'Back', 'Upper Traps', 'reps_weight'),
('Shrugs (Dumbbell)', 'Back', 'Upper Traps', 'reps_weight'),
('Hyperextensions', 'Back', 'Lower Back', 'reps_only'),
('Good Mornings', 'Back', 'Lower Back/Hamstrings', 'reps_weight'),

-- LEGS (29 exercises)
('Squat (Back)', 'Legs', 'Quads & Glutes (Overall)', 'reps_weight'),
('Squat (Front)', 'Legs', 'Quads (Anterior)', 'reps_weight'),
('Leg Press (Standard)', 'Legs', 'Quads/Glutes (Heavy Load)', 'reps_weight'),
('Leg Press (High Foot Placement)', 'Legs', 'Glutes/Hamstrings', 'reps_weight'),
('Leg Press (Low Foot Placement)', 'Legs', 'Quads', 'reps_weight'),
('Hack Squat', 'Legs', 'Quads (Isolation focus)', 'reps_weight'),
('Sissy Squat', 'Legs', 'Quads (Peak Contraction)', 'reps_only'),
('Goblet Squat', 'Legs', 'Quads/Core', 'reps_weight'),
('Romanian Deadlift (Barbell)', 'Legs', 'Hamstrings & Glutes', 'reps_weight'),
('Romanian Deadlift (Dumbbell)', 'Legs', 'Hamstrings & Glutes', 'reps_weight'),
('Stiff Leg Deadlift', 'Legs', 'Hamstrings (Stretch)', 'reps_weight'),
('Walking Lunges', 'Legs', 'Glutes & Quads (Unilateral)', 'reps_weight'),
('Reverse Lunges', 'Legs', 'Glutes/Hamstrings', 'reps_weight'),
('Bulgarian Split Squat', 'Legs', 'Glutes & Quads (Balance)', 'reps_weight'),
('Step Ups', 'Legs', 'Glutes/Quads (Unilateral)', 'reps_weight'),
('Leg Extension', 'Legs', 'Quads (Isolation)', 'reps_weight'),
('Leg Curl (Seated)', 'Legs', 'Hamstrings', 'reps_weight'),
('Leg Curl (Lying)', 'Legs', 'Hamstrings', 'reps_weight'),
('Leg Curl (Standing)', 'Legs', 'Hamstrings (Unilateral)', 'reps_weight'),
('Glute Ham Raise', 'Legs', 'Hamstrings/Glutes', 'reps_only'),
('Calf Raises (Standing)', 'Legs', 'Calves (Gastrocnemius)', 'reps_weight'),
('Calf Raises (Seated)', 'Legs', 'Calves (Soleus)', 'reps_weight'),
('Calf Raises (Leg Press)', 'Legs', 'Calves', 'reps_weight'),
('Hip Thrust (Barbell)', 'Legs', 'Glutes (Max Contraction)', 'reps_weight'),
('Hip Thrust (Machine)', 'Legs', 'Glutes', 'reps_weight'),
('Glute Kickback (Cable)', 'Legs', 'Glutes (Isolation)', 'reps_weight'),
('Abductor Machine', 'Legs', 'Outer Glutes/Hips', 'reps_weight'),
('Adductor Machine', 'Legs', 'Inner Thighs', 'reps_weight'),

-- SHOULDERS (19 exercises)
('Overhead Press (Barbell)', 'Shoulders', 'Front Delts (Power)', 'reps_weight'),
('Overhead Press (Dumbbell)', 'Shoulders', 'Front Delts (Stability)', 'reps_weight'),
('Military Press', 'Shoulders', 'Front Delts (Strict)', 'reps_weight'),
('Push Press', 'Shoulders', 'Front Delts (Power/Explosive)', 'reps_weight'),
('Arnold Press', 'Shoulders', 'All Delt Heads', 'reps_weight'),
('Seated Dumbbell Press', 'Shoulders', 'Front/Side Delts', 'reps_weight'),
('Machine Shoulder Press', 'Shoulders', 'Front Delts (Safety)', 'reps_weight'),
('Lateral Raises (Dumbbell)', 'Shoulders', 'Side Delts (Width)', 'reps_weight'),
('Lateral Raises (Cable)', 'Shoulders', 'Side Delts (Constant Tension)', 'reps_weight'),
('Lateral Raises (Machine)', 'Shoulders', 'Side Delts (Isolation)', 'reps_weight'),
('Front Raises (Dumbbell)', 'Shoulders', 'Front Delts', 'reps_weight'),
('Front Raises (Cable)', 'Shoulders', 'Front Delts', 'reps_weight'),
('Front Raises (Plate)', 'Shoulders', 'Front Delts', 'reps_weight'),
('Rear Delt Fly (Dumbbell)', 'Shoulders', 'Rear Delts', 'reps_weight'),
('Rear Delt Fly (Machine)', 'Shoulders', 'Rear Delts', 'reps_weight'),
('Upright Row (Barbell)', 'Shoulders', 'Side Delts & Traps', 'reps_weight'),
('Upright Row (Cable)', 'Shoulders', 'Side Delts & Traps', 'reps_weight'),
('Shrugs (Smith Machine)', 'Shoulders', 'Upper Traps', 'reps_weight'),

-- BICEPS (14 exercises)
('Barbell Curl', 'Biceps', 'Biceps (Overall Mass)', 'reps_weight'),
('Dumbbell Curl', 'Biceps', 'Biceps (Supination)', 'reps_weight'),
('Hammer Curl', 'Biceps', 'Brachialis (Width/Forearm)', 'reps_weight'),
('Preacher Curl (Barbell)', 'Biceps', 'Short Head (Peak)', 'reps_weight'),
('Preacher Curl (Machine)', 'Biceps', 'Short Head (Isolation)', 'reps_weight'),
('Concentration Curl', 'Biceps', 'Biceps (Isolation)', 'reps_weight'),
('Incline Dumbbell Curl', 'Biceps', 'Long Head (Stretch)', 'reps_weight'),
('Spider Curl', 'Biceps', 'Short Head (Peak)', 'reps_weight'),
('Cable Curl', 'Biceps', 'Biceps (Constant Tension)', 'reps_weight'),
('Bayesian Curl', 'Biceps', 'Long Head (Stretch)', 'reps_weight'),
('Reverse Curl', 'Biceps', 'Forearms/Brachialis', 'reps_weight'),
('Zottman Curl', 'Biceps', 'Biceps/Forearms', 'reps_weight'),
('EZ Bar Curl', 'Biceps', 'Biceps (Wrist Comfort)', 'reps_weight'),
('21s (Bicep Curls)', 'Biceps', 'Biceps (Pump/Endurance)', 'reps_weight'),

-- TRICEPS (15 exercises)
('Tricep Pushdown (Rope)', 'Triceps', 'Lateral Head', 'reps_weight'),
('Tricep Pushdown (Bar)', 'Triceps', 'Long Head', 'reps_weight'),
('Tricep Pushdown (V-Bar)', 'Triceps', 'Triceps (General)', 'reps_weight'),
('Skullcrushers (Barbell)', 'Triceps', 'Medial/Long Head', 'reps_weight'),
('Skullcrushers (Dumbbell)', 'Triceps', 'Medial/Long Head', 'reps_weight'),
('Overhead Ext (Dumbbell)', 'Triceps', 'Long Head (Stretch)', 'reps_weight'),
('Overhead Ext (Cable)', 'Triceps', 'Long Head (Stretch)', 'reps_weight'),
('Close Grip Bench', 'Triceps', 'Triceps (Mass)', 'reps_weight'),
('Dips', 'Triceps', 'Triceps (Overall)', 'reps_only'),
('Assisted Dips', 'Triceps', 'Triceps/Chest', 'reps_only'),
('Bench Dips', 'Triceps', 'Triceps', 'reps_only'),
('Kickbacks (Dumbbell)', 'Triceps', 'Triceps (Contraction)', 'reps_weight'),
('Kickbacks (Cable)', 'Triceps', 'Triceps (Contraction)', 'reps_weight'),
('JM Press', 'Triceps', 'Triceps/Chest', 'reps_weight'),

-- CORE (18 exercises)
('Plank', 'Core', 'Core Stability', 'duration'),
('Side Plank', 'Core', 'Obliques', 'duration'),
('Crunches', 'Core', 'Upper Abs', 'reps_only'),
('Cable Crunches', 'Core', 'Upper Abs (Weighted)', 'reps_weight'),
('Leg Raises (Lying)', 'Core', 'Lower Abs', 'reps_only'),
('Hanging Leg Raises', 'Core', 'Lower Abs (Decompressed)', 'reps_only'),
('Captain''s Chair Leg Raise', 'Core', 'Lower Abs', 'reps_only'),
('Toes to Bar', 'Core', 'Lower Abs/Core', 'reps_only'),
('Russian Twists', 'Core', 'Obliques', 'reps_only'),
('Ab Wheel Rollout', 'Core', 'Deep Core/Lats', 'reps_only'),
('Mountain Climbers', 'Core', 'Core & Cardio', 'duration'),
('Bicycle Crunches', 'Core', 'Obliques/Abs', 'reps_only'),
('Cable Woodchopper', 'Core', 'Obliques (Rotational)', 'reps_weight'),
('Pallof Press', 'Core', 'Anti-Rotation Core', 'reps_weight'),
('Landmine 180s', 'Core', 'Obliques (Power)', 'reps_weight'),
('Dead Bug', 'Core', 'Core Stability', 'reps_only'),
('Hollow Body Hold', 'Core', 'Core Stability', 'duration'),

-- CARDIO (12 exercises)
('Treadmill Run', 'Cardio', 'Endurance', 'distance_duration'),
('Treadmill Walk (Incline)', 'Cardio', 'Low Impact Fat Burn', 'distance_duration'),
('Cycling', 'Cardio', 'Leg Endurance', 'distance_duration'),
('Elliptical', 'Cardio', 'Low Impact', 'distance_duration'),
('Rowing Machine', 'Cardio', 'Full Body Endurance', 'distance_duration'),
('Jump Rope', 'Cardio', 'Coordination & Calves', 'duration'),
('HIIT Sprints', 'Cardio', 'Fat Loss (Anaerobic)', 'duration'),
('Burpees', 'Cardio', 'Full Body Conditioning', 'reps_only'),
('Box Jumps', 'Cardio', 'Explosiveness', 'reps_only'),
('Battle Ropes', 'Cardio', 'Shoulder/Cardio', 'duration'),
('Stair Climber', 'Cardio', 'Glutes/Cardio', 'duration'),
('Swimming', 'Cardio', 'Full Body', 'duration')

ON CONFLICT (name) DO UPDATE SET
    muscle_group = EXCLUDED.muscle_group,
    target = EXCLUDED.target,
    default_tracking_type = EXCLUDED.default_tracking_type;

-- Verify the count
SELECT muscle_group, COUNT(*) as exercise_count 
FROM exercises 
GROUP BY muscle_group 
ORDER BY muscle_group;
