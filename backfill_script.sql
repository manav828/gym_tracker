-- ==========================================
-- BACKFILL DATA AND FIX USER PROFILE SCRIPT
-- ==========================================
-- FINAL VERSION: Using User ID: 091d10d5-c614-4978-ab5e-af846dc50989

-- 1. ADD EMAIL COLUMN TO USER_PROFILE
ALTER TABLE user_profile ADD COLUMN IF NOT EXISTS email text;

-- 2. BACKFILL EMAIL FROM AUTH.USERS
UPDATE user_profile
SET email = auth.users.email
FROM auth.users
WHERE user_profile.user_id = auth.users.id
AND user_profile.email IS NULL;

-- 3. ASSIGN DUMMY DATA TO YOUR USER ID: 091d10d5-c614-4978-ab5e-af846dc50989

-- Update Routines
UPDATE routines
SET user_id = '091d10d5-c614-4978-ab5e-af846dc50989'
WHERE user_id IS NULL;

-- Update Sessions
UPDATE sessions
SET user_id = '091d10d5-c614-4978-ab5e-af846dc50989'
WHERE user_id IS NULL;

-- Update Measurements
UPDATE measurements
SET user_id = '091d10d5-c614-4978-ab5e-af846dc50989'
WHERE user_id IS NULL;

-- Update Food Logs
UPDATE food_logs
SET user_id = '091d10d5-c614-4978-ab5e-af846dc50989'
WHERE user_id IS NULL;

-- Update Water Logs
UPDATE water_logs
SET user_id = '091d10d5-c614-4978-ab5e-af846dc50989'
WHERE user_id IS NULL;

-- Update Custom Foods
UPDATE custom_foods
SET user_id = '091d10d5-c614-4978-ab5e-af846dc50989'
WHERE user_id IS NULL;

-- Update/Fix User Profile if it has no user_id
-- If a profile exists with NULL user_id, assign it to this user
-- PROVIDED THAT this user doesn't already have a conflicting profile
UPDATE user_profile
SET user_id = '091d10d5-c614-4978-ab5e-af846dc50989'
WHERE user_id IS NULL
AND NOT EXISTS (
  SELECT 1 FROM user_profile up 
  WHERE up.user_id = '091d10d5-c614-4978-ab5e-af846dc50989'
);

-- OPTIONAL: If the profile was already created (logged in), sync the email immediately
UPDATE user_profile
SET email = auth.users.email
FROM auth.users
WHERE user_profile.user_id = auth.users.id
AND user_profile.user_id = '091d10d5-c614-4978-ab5e-af846dc50989';
