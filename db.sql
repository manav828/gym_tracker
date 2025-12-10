-- 1. Routines Table (Stores your workout plans)
create table if not exists routines (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  day_label text, -- e.g., "Monday" or "Push Day"
  exercises_json jsonb not null -- Stores the list of exercises
);

-- 2. Sessions Table (Stores completed workouts)
create table if not exists sessions (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  routine_id text,
  routine_name text,
  start_time bigint,
  end_time bigint,
  duration_seconds int,
  total_volume int,
  date text, -- YYYY-MM-DD
  exercises_json jsonb not null -- Stores sets, reps, weight, and bodyweight
);

-- 3. Measurements Table (Stores body weight history)
create table if not exists measurements (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  date text not null,
  weight numeric not null,
  notes text
);

-- 4. User Profile Table (Stores goals, height, and macro targets)
create table if not exists user_profile (
  id uuid default gen_random_uuid() primary key,
  updated_at timestamptz default now(),
  goal text, -- e.g., hypertrophy, strength
  height numeric,
  target_weight numeric,
  calorie_goal numeric default 2500,
  protein_goal numeric default 150,
  carbs_goal numeric default 250,
  fats_goal numeric default 70,
  water_goal numeric default 3000
);

-- 5. Food Logs Table (Stores daily meals)
create table if not exists food_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  date text not null, -- YYYY-MM-DD
  meal_type text not null, -- Breakfast, Lunch, Dinner, Snack
  food_name text not null,
  calories numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fats numeric not null,
  quantity numeric default 1,
  unit text default 'serving'
);

-- 6. Water Logs Table (Stores hydration)
create table if not exists water_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  date text not null,
  amount_ml numeric not null
);

-- 7. Custom Foods Table (Stores user-created foods)
create table if not exists custom_foods (
  id uuid default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  name text not null,
  calories numeric not null,
  protein numeric not null,
  carbs numeric not null,
  fats numeric not null,
  serving_size text
);

-- 8. IMPORTANT: Disable Security Policies (RLS)
-- This ensures the app works immediately without setting up user login/authentication logic.
alter table routines disable row level security;
alter table sessions disable row level security;
alter table measurements disable row level security;
alter table user_profile disable row level security;
alter table food_logs disable row level security;
alter table water_logs disable row level security;
alter table custom_foods disable row level security;