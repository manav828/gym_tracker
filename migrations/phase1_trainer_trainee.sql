-- =====================================================
-- IronLog Phase 1: Trainer-Trainee System Migration
-- =====================================================
-- Run this in your Supabase SQL Editor

-- 1. Extend user_profile table with role and trainer fields
ALTER TABLE user_profile 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS trainer_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS gym_id UUID,
ADD COLUMN IF NOT EXISTS is_profile_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add constraint for valid roles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_role'
    ) THEN
        ALTER TABLE user_profile ADD CONSTRAINT valid_role 
        CHECK (role IN ('user', 'trainer', 'owner'));
    END IF;
END$$;

-- 2. Trainer-Trainee Relationships
CREATE TABLE IF NOT EXISTS trainer_trainees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    trainee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID, -- null for independent trainers
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending', 'removed')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trainer_id, trainee_id)
);

-- 3. Workout Plan Templates
CREATE TABLE IF NOT EXISTS workout_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    gym_id UUID, -- null for independent trainer plans
    is_common BOOLEAN DEFAULT false, -- gym-wide template
    is_public BOOLEAN DEFAULT false, -- shareable publicly
    difficulty TEXT DEFAULT 'intermediate' CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    duration_weeks INTEGER DEFAULT 4,
    days_per_week INTEGER DEFAULT 4,
    exercises_json JSONB NOT NULL DEFAULT '[]',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Assigned Plans (linking users to plans)
CREATE TABLE IF NOT EXISTS assigned_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES workout_plans(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL REFERENCES auth.users(id),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, plan_id, is_active) -- only one active instance of a plan per user
);

-- 5. Trainer Invite Codes
CREATE TABLE IF NOT EXISTS trainer_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    max_uses INTEGER DEFAULT 100,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Trainer Activity Log (for tracking trainer actions)
CREATE TABLE IF NOT EXISTS trainer_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trainer_id UUID NOT NULL REFERENCES auth.users(id),
    trainee_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL, -- 'assigned_plan', 'logged_workout', 'sent_message', etc.
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- Row Level Security Policies
-- =====================================================

-- Enable RLS
ALTER TABLE trainer_trainees ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE assigned_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainer_activity_log ENABLE ROW LEVEL SECURITY;

-- Trainer-Trainee Policies
CREATE POLICY "Trainers can view their trainees" ON trainer_trainees
    FOR SELECT TO authenticated
    USING (trainer_id = auth.uid() OR trainee_id = auth.uid());

CREATE POLICY "Trainers can add trainees" ON trainer_trainees
    FOR INSERT TO authenticated
    WITH CHECK (trainer_id = auth.uid());

CREATE POLICY "Trainers can update their relationships" ON trainer_trainees
    FOR UPDATE TO authenticated
    USING (trainer_id = auth.uid());

CREATE POLICY "Trainers can remove trainees" ON trainer_trainees
    FOR DELETE TO authenticated
    USING (trainer_id = auth.uid());

-- Workout Plans Policies
CREATE POLICY "Users can view own plans and assigned plans" ON workout_plans
    FOR SELECT TO authenticated
    USING (
        created_by = auth.uid() 
        OR is_public = true
        OR id IN (SELECT plan_id FROM assigned_plans WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can create plans" ON workout_plans
    FOR INSERT TO authenticated
    WITH CHECK (created_by = auth.uid());

CREATE POLICY "Owners can update their plans" ON workout_plans
    FOR UPDATE TO authenticated
    USING (created_by = auth.uid());

CREATE POLICY "Owners can delete their plans" ON workout_plans
    FOR DELETE TO authenticated
    USING (created_by = auth.uid());

-- Assigned Plans Policies
CREATE POLICY "Users can view their assigned plans" ON assigned_plans
    FOR SELECT TO authenticated
    USING (user_id = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Trainers can assign plans" ON assigned_plans
    FOR INSERT TO authenticated
    WITH CHECK (assigned_by = auth.uid());

CREATE POLICY "Trainers can update assignments" ON assigned_plans
    FOR UPDATE TO authenticated
    USING (assigned_by = auth.uid());

-- Trainer Invites Policies
CREATE POLICY "Trainers can manage their invites" ON trainer_invites
    FOR ALL TO authenticated
    USING (trainer_id = auth.uid());

CREATE POLICY "Anyone can read active invites by code" ON trainer_invites
    FOR SELECT TO authenticated
    USING (is_active = true);

-- Activity Log Policies
CREATE POLICY "Trainers can view their activity" ON trainer_activity_log
    FOR SELECT TO authenticated
    USING (trainer_id = auth.uid() OR trainee_id = auth.uid());

CREATE POLICY "Trainers can log activity" ON trainer_activity_log
    FOR INSERT TO authenticated
    WITH CHECK (trainer_id = auth.uid());

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function to generate invite code
CREATE OR REPLACE FUNCTION generate_invite_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to join a trainer via invite code
CREATE OR REPLACE FUNCTION join_trainer_by_code(invite_code TEXT)
RETURNS JSON AS $$
DECLARE
    invite_record RECORD;
    trainer_record RECORD;
BEGIN
    -- Find the invite
    SELECT * INTO invite_record FROM trainer_invites 
    WHERE code = invite_code AND is_active = true AND (expires_at IS NULL OR expires_at > NOW());
    
    IF invite_record IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Invalid or expired invite code');
    END IF;
    
    -- Check max uses
    IF invite_record.used_count >= invite_record.max_uses THEN
        RETURN json_build_object('success', false, 'error', 'Invite code has reached maximum uses');
    END IF;
    
    -- Check if already a trainee
    IF EXISTS (SELECT 1 FROM trainer_trainees WHERE trainer_id = invite_record.trainer_id AND trainee_id = auth.uid()) THEN
        RETURN json_build_object('success', false, 'error', 'You are already connected to this trainer');
    END IF;
    
    -- Add as trainee
    INSERT INTO trainer_trainees (trainer_id, trainee_id, status)
    VALUES (invite_record.trainer_id, auth.uid(), 'active');
    
    -- Update user profile with trainer_id
    UPDATE user_profile SET trainer_id = invite_record.trainer_id WHERE user_id = auth.uid();
    
    -- Increment used count
    UPDATE trainer_invites SET used_count = used_count + 1 WHERE id = invite_record.id;
    
    -- Get trainer info
    SELECT display_name, email INTO trainer_record FROM user_profile WHERE user_id = invite_record.trainer_id;
    
    RETURN json_build_object(
        'success', true, 
        'trainer_id', invite_record.trainer_id,
        'trainer_name', COALESCE(trainer_record.display_name, trainer_record.email)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Indexes for Performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_trainer_trainees_trainer ON trainer_trainees(trainer_id);
CREATE INDEX IF NOT EXISTS idx_trainer_trainees_trainee ON trainer_trainees(trainee_id);
CREATE INDEX IF NOT EXISTS idx_workout_plans_creator ON workout_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_assigned_plans_user ON assigned_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_assigned_plans_active ON assigned_plans(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_trainer_invites_code ON trainer_invites(code);

-- Verify tables created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('trainer_trainees', 'workout_plans', 'assigned_plans', 'trainer_invites');
