-- Enable RLS and add user_id to all tables

-- 1. Routines
alter table routines add column if not exists user_id uuid references auth.users(id);
alter table routines enable row level security;

create policy "Users can view their own routines" on routines
  for select using (auth.uid() = user_id);

create policy "Users can insert their own routines" on routines
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own routines" on routines
  for update using (auth.uid() = user_id);

create policy "Users can delete their own routines" on routines
  for delete using (auth.uid() = user_id);


-- 2. Sessions
alter table sessions add column if not exists user_id uuid references auth.users(id);
alter table sessions enable row level security;

create policy "Users can view their own sessions" on sessions
  for select using (auth.uid() = user_id);

create policy "Users can insert their own sessions" on sessions
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own sessions" on sessions
  for update using (auth.uid() = user_id);

create policy "Users can delete their own sessions" on sessions
  for delete using (auth.uid() = user_id);


-- 3. Measurements
alter table measurements add column if not exists user_id uuid references auth.users(id);
alter table measurements enable row level security;

create policy "Users can view their own measurements" on measurements
  for select using (auth.uid() = user_id);

create policy "Users can insert their own measurements" on measurements
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own measurements" on measurements
  for update using (auth.uid() = user_id);

create policy "Users can delete their own measurements" on measurements
  for delete using (auth.uid() = user_id);


-- 4. User Profile
alter table user_profile add column if not exists user_id uuid references auth.users(id);
alter table user_profile enable row level security;

create policy "Users can view their own profile" on user_profile
  for select using (auth.uid() = user_id);

create policy "Users can insert their own profile" on user_profile
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own profile" on user_profile
  for update using (auth.uid() = user_id);


-- 5. Food Logs
alter table food_logs add column if not exists user_id uuid references auth.users(id);
alter table food_logs enable row level security;

create policy "Users can view their own food logs" on food_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own food logs" on food_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own food logs" on food_logs
  for update using (auth.uid() = user_id);

create policy "Users can delete their own food logs" on food_logs
  for delete using (auth.uid() = user_id);


-- 6. Water Logs
alter table water_logs add column if not exists user_id uuid references auth.users(id);
alter table water_logs enable row level security;

create policy "Users can view their own water logs" on water_logs
  for select using (auth.uid() = user_id);

create policy "Users can insert their own water logs" on water_logs
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own water logs" on water_logs
  for update using (auth.uid() = user_id);


-- 7. Custom Foods
alter table custom_foods add column if not exists user_id uuid references auth.users(id);
alter table custom_foods enable row level security;

create policy "Users can view their own custom foods" on custom_foods
  for select using (auth.uid() = user_id);

create policy "Users can insert their own custom foods" on custom_foods
  for insert with check (auth.uid() = user_id);
