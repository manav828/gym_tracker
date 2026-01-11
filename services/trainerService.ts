import { supabase } from '../lib/supabaseClient';
import {
    Trainee,
    WorkoutPlan,
    AssignedPlan,
    TrainerInvite,
    TrainerStats,
    ExtendedUserProfile,
    PlanExercise
} from '../types';

// ============================================
// Trainer Service - Phase 1 Implementation
// ============================================

export const TrainerService = {
    // ==========================================
    // Profile & Role Management
    // ==========================================

    /**
     * Get extended user profile with role information
     */
    getExtendedProfile: async (): Promise<ExtendedUserProfile | null> => {
        const { data, error } = await supabase
            .from('user_profile')
            .select('*')
            .limit(1)
            .single();

        if (error || !data) return null;

        return {
            goal: data.goal || 'general',
            targetWeight: data.target_weight,
            height: data.height,
            calorieGoal: data.calorie_goal,
            proteinGoal: data.protein_goal,
            carbsGoal: data.carbs_goal,
            fatsGoal: data.fats_goal,
            waterGoal: data.water_goal,
            email: data.email,
            // Extended fields
            id: data.id,
            userId: data.user_id,
            role: data.role || 'user',
            trainerId: data.trainer_id,
            gymId: data.gym_id,
            isProfilePublic: data.is_profile_public || false,
            displayName: data.display_name,
            avatarUrl: data.avatar_url,
        };
    },

    /**
     * Update user role (to become a trainer)
     */
    updateRole: async (role: 'user' | 'trainer' | 'owner'): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('user_profile')
            .update({ role })
            .eq('user_id', user.id);

        return !error;
    },

    // ==========================================
    // Trainee Management
    // ==========================================

    /**
     * Get all trainees for the current trainer
     */
    getTrainees: async (): Promise<Trainee[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        // Get trainer-trainee relationships with user profile data
        const { data, error } = await supabase
            .from('trainer_trainees')
            .select(`
        id,
        trainer_id,
        trainee_id,
        status,
        notes,
        created_at
      `)
            .eq('trainer_id', user.id)
            .eq('status', 'active');

        if (error || !data) {
            console.error('Error fetching trainees:', error);
            return [];
        }

        // Fetch profile info for each trainee
        const traineeIds = data.map(t => t.trainee_id);
        const { data: profiles } = await supabase
            .from('user_profile')
            .select('user_id, email, display_name, avatar_url')
            .in('user_id', traineeIds);

        // Fetch recent workout stats for each trainee
        const { data: sessions } = await supabase
            .from('sessions')
            .select('user_id, date, total_volume')
            .in('user_id', traineeIds)
            .order('date', { ascending: false });

        // Combine data
        return data.map(rel => {
            const profile = profiles?.find(p => p.user_id === rel.trainee_id);
            const traineeSessions = sessions?.filter(s => s.user_id === rel.trainee_id) || [];

            // Calculate stats
            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const weeklyWorkouts = traineeSessions.filter(s => new Date(s.date) >= oneWeekAgo).length;
            const lastWorkoutDate = traineeSessions[0]?.date;
            const totalVolume = traineeSessions.reduce((acc, s) => acc + (s.total_volume || 0), 0);

            return {
                id: rel.id,
                traineeId: rel.trainee_id,
                trainerId: rel.trainer_id,
                status: rel.status as any,
                notes: rel.notes,
                createdAt: rel.created_at,
                displayName: profile?.display_name || profile?.email?.split('@')[0] || 'Unknown',
                email: profile?.email,
                avatarUrl: profile?.avatar_url,
                lastWorkoutDate,
                weeklyWorkouts,
                totalVolume,
            };
        });
    },

    /**
     * Remove a trainee
     */
    removeTrainee: async (traineeId: string): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { error } = await supabase
            .from('trainer_trainees')
            .update({ status: 'removed' })
            .eq('trainer_id', user.id)
            .eq('trainee_id', traineeId);

        // Also clear trainer_id from trainee's profile
        await supabase
            .from('user_profile')
            .update({ trainer_id: null })
            .eq('user_id', traineeId);

        return !error;
    },

    /**
     * Get trainer stats for dashboard
     */
    getTrainerStats: async (): Promise<TrainerStats> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { totalTrainees: 0, activeTrainees: 0, inactiveTrainees: 0, totalPlansCreated: 0, plansAssignedThisWeek: 0 };
        }

        // Get trainees
        const { data: trainees } = await supabase
            .from('trainer_trainees')
            .select('trainee_id, created_at')
            .eq('trainer_id', user.id)
            .eq('status', 'active');

        const traineeIds = trainees?.map(t => t.trainee_id) || [];
        const totalTrainees = traineeIds.length;

        // Get active trainees (worked out in last 3 days)
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { data: recentSessions } = await supabase
            .from('sessions')
            .select('user_id')
            .in('user_id', traineeIds)
            .gte('date', threeDaysAgo.toISOString().split('T')[0]);

        const activeTraineeIds = [...new Set(recentSessions?.map(s => s.user_id) || [])];
        const activeTrainees = activeTraineeIds.length;
        const inactiveTrainees = totalTrainees - activeTrainees;

        // Get plans
        const { count: totalPlansCreated } = await supabase
            .from('workout_plans')
            .select('*', { count: 'exact', head: true })
            .eq('created_by', user.id);

        // Get plans assigned this week
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

        const { count: plansAssignedThisWeek } = await supabase
            .from('assigned_plans')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_by', user.id)
            .gte('created_at', oneWeekAgo.toISOString());

        return {
            totalTrainees,
            activeTrainees,
            inactiveTrainees,
            totalPlansCreated: totalPlansCreated || 0,
            plansAssignedThisWeek: plansAssignedThisWeek || 0,
        };
    },

    // ==========================================
    // Invite System
    // ==========================================

    /**
     * Generate a new invite code for the trainer
     */
    generateInviteCode: async (description?: string): Promise<TrainerInvite | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Generate a random 8-character code
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const { data, error } = await supabase
            .from('trainer_invites')
            .insert({
                trainer_id: user.id,
                code,
                description,
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                max_uses: 100,
            })
            .select()
            .single();

        if (error) {
            console.error('Error generating invite:', error);
            return null;
        }

        return {
            id: data.id,
            trainerId: data.trainer_id,
            code: data.code,
            description: data.description,
            expiresAt: data.expires_at,
            maxUses: data.max_uses,
            usedCount: data.used_count,
            isActive: data.is_active,
            createdAt: data.created_at,
        };
    },

    /**
     * Get all invite codes for the trainer
     */
    getInviteCodes: async (): Promise<TrainerInvite[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('trainer_invites')
            .select('*')
            .eq('trainer_id', user.id)
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        return data.map(inv => ({
            id: inv.id,
            trainerId: inv.trainer_id,
            code: inv.code,
            description: inv.description,
            expiresAt: inv.expires_at,
            maxUses: inv.max_uses,
            usedCount: inv.used_count,
            isActive: inv.is_active,
            createdAt: inv.created_at,
        }));
    },

    /**
     * Deactivate an invite code
     */
    deactivateInvite: async (inviteId: string): Promise<boolean> => {
        const { error } = await supabase
            .from('trainer_invites')
            .update({ is_active: false })
            .eq('id', inviteId);

        return !error;
    },

    /**
     * Join a trainer using invite code (called by trainee)
     */
    joinTrainer: async (code: string): Promise<{ success: boolean; error?: string; trainerName?: string }> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Not authenticated' };

        // Find the invite
        const { data: invite, error: inviteError } = await supabase
            .from('trainer_invites')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (inviteError || !invite) {
            return { success: false, error: 'Invalid or expired invite code' };
        }

        // Check expiry
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            return { success: false, error: 'This invite code has expired' };
        }

        // Check max uses
        if (invite.used_count >= invite.max_uses) {
            return { success: false, error: 'This invite code has reached its maximum uses' };
        }

        // Check if already a trainee
        const { data: existing } = await supabase
            .from('trainer_trainees')
            .select('id')
            .eq('trainer_id', invite.trainer_id)
            .eq('trainee_id', user.id)
            .single();

        if (existing) {
            return { success: false, error: 'You are already connected to this trainer' };
        }

        // Add relationship
        const { error: relError } = await supabase
            .from('trainer_trainees')
            .insert({
                trainer_id: invite.trainer_id,
                trainee_id: user.id,
                status: 'active',
            });

        if (relError) {
            console.error('Error joining trainer:', relError);
            return { success: false, error: 'Failed to join trainer' };
        }

        // Update user profile
        await supabase
            .from('user_profile')
            .update({ trainer_id: invite.trainer_id })
            .eq('user_id', user.id);

        // Increment used count
        await supabase
            .from('trainer_invites')
            .update({ used_count: invite.used_count + 1 })
            .eq('id', invite.id);

        // Get trainer name
        const { data: trainerProfile } = await supabase
            .from('user_profile')
            .select('display_name, email')
            .eq('user_id', invite.trainer_id)
            .single();

        return {
            success: true,
            trainerName: trainerProfile?.display_name || trainerProfile?.email?.split('@')[0] || 'Your Trainer',
        };
    },

    // ==========================================
    // Workout Plans
    // ==========================================

    /**
     * Create a new workout plan
     */
    createPlan: async (plan: Omit<WorkoutPlan, 'id' | 'createdAt' | 'createdBy'>): Promise<WorkoutPlan | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('workout_plans')
            .insert({
                name: plan.name,
                description: plan.description,
                created_by: user.id,
                gym_id: plan.gymId,
                is_common: plan.isCommon,
                is_public: plan.isPublic,
                difficulty: plan.difficulty,
                duration_weeks: plan.durationWeeks,
                days_per_week: plan.daysPerWeek,
                exercises_json: plan.exercises,
                tags: plan.tags,
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating plan:', error);
            return null;
        }

        return {
            id: data.id,
            name: data.name,
            description: data.description,
            createdBy: data.created_by,
            gymId: data.gym_id,
            isCommon: data.is_common,
            isPublic: data.is_public,
            difficulty: data.difficulty,
            durationWeeks: data.duration_weeks,
            daysPerWeek: data.days_per_week,
            exercises: data.exercises_json,
            tags: data.tags || [],
            createdAt: data.created_at,
        };
    },

    /**
     * Get all plans created by the trainer
     */
    getMyPlans: async (): Promise<WorkoutPlan[]> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return [];

        const { data, error } = await supabase
            .from('workout_plans')
            .select('*')
            .eq('created_by', user.id)
            .order('created_at', { ascending: false });

        if (error || !data) return [];

        return data.map(p => ({
            id: p.id,
            name: p.name,
            description: p.description,
            createdBy: p.created_by,
            gymId: p.gym_id,
            isCommon: p.is_common,
            isPublic: p.is_public,
            difficulty: p.difficulty,
            durationWeeks: p.duration_weeks,
            daysPerWeek: p.days_per_week,
            exercises: p.exercises_json || [],
            tags: p.tags || [],
            createdAt: p.created_at,
            updatedAt: p.updated_at,
        }));
    },

    /**
     * Delete a workout plan
     */
    deletePlan: async (planId: string): Promise<boolean> => {
        const { error } = await supabase
            .from('workout_plans')
            .delete()
            .eq('id', planId);

        return !error;
    },

    /**
     * Assign a plan to a trainee
     */
    assignPlan: async (planId: string, traineeId: string, startDate?: string, notes?: string): Promise<boolean> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        // Deactivate any existing active plans for this trainee
        await supabase
            .from('assigned_plans')
            .update({ is_active: false })
            .eq('user_id', traineeId)
            .eq('is_active', true);

        // Assign new plan
        const { error } = await supabase
            .from('assigned_plans')
            .insert({
                user_id: traineeId,
                plan_id: planId,
                assigned_by: user.id,
                start_date: startDate || new Date().toISOString().split('T')[0],
                is_active: true,
                notes,
            });

        return !error;
    },

    /**
     * Get assigned plan for a user (trainee perspective)
     */
    getMyAssignedPlan: async (): Promise<AssignedPlan | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        const { data, error } = await supabase
            .from('assigned_plans')
            .select(`
        *,
        workout_plans (*)
      `)
            .eq('user_id', user.id)
            .eq('is_active', true)
            .single();

        if (error || !data) return null;

        const plan = data.workout_plans;
        return {
            id: data.id,
            userId: data.user_id,
            planId: data.plan_id,
            assignedBy: data.assigned_by,
            startDate: data.start_date,
            endDate: data.end_date,
            isActive: data.is_active,
            notes: data.notes,
            createdAt: data.created_at,
            plan: plan ? {
                id: plan.id,
                name: plan.name,
                description: plan.description,
                createdBy: plan.created_by,
                gymId: plan.gym_id,
                isCommon: plan.is_common,
                isPublic: plan.is_public,
                difficulty: plan.difficulty,
                durationWeeks: plan.duration_weeks,
                daysPerWeek: plan.days_per_week,
                exercises: plan.exercises_json || [],
                tags: plan.tags || [],
                createdAt: plan.created_at,
            } : undefined,
        };
    },

    /**
     * Get trainer info for a trainee
     */
    getMyTrainer: async (): Promise<{ id: string; name: string; email?: string; avatarUrl?: string } | null> => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return null;

        // Get trainer_id from profile
        const { data: profile } = await supabase
            .from('user_profile')
            .select('trainer_id')
            .eq('user_id', user.id)
            .single();

        if (!profile?.trainer_id) return null;

        // Get trainer profile
        const { data: trainer } = await supabase
            .from('user_profile')
            .select('user_id, display_name, email, avatar_url')
            .eq('user_id', profile.trainer_id)
            .single();

        if (!trainer) return null;

        return {
            id: trainer.user_id,
            name: trainer.display_name || trainer.email?.split('@')[0] || 'Trainer',
            email: trainer.email,
            avatarUrl: trainer.avatar_url,
        };
    },
};
