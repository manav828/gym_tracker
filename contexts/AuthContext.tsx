import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import { ExtendedUserProfile, UserRole } from '../types';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    userRole: UserRole;
    userProfile: ExtendedUserProfile | null;
    hasTrainer: boolean;
    signOut: () => Promise<void>;
    loading: boolean;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [userRole, setUserRole] = useState<UserRole>('user');
    const [userProfile, setUserProfile] = useState<ExtendedUserProfile | null>(null);
    const [hasTrainer, setHasTrainer] = useState(false);
    const [loading, setLoading] = useState(true);

    const fetchProfile = async () => {
        const { data, error } = await supabase
            .from('user_profile')
            .select('*')
            .limit(1)
            .single();

        if (data && !error) {
            const profile: ExtendedUserProfile = {
                goal: data.goal || 'general',
                targetWeight: data.target_weight,
                height: data.height,
                calorieGoal: data.calorie_goal,
                proteinGoal: data.protein_goal,
                carbsGoal: data.carbs_goal,
                fatsGoal: data.fats_goal,
                waterGoal: data.water_goal,
                email: data.email,
                id: data.id,
                userId: data.user_id,
                role: data.role || 'user',
                trainerId: data.trainer_id,
                gymId: data.gym_id,
                isProfilePublic: data.is_profile_public || false,
                displayName: data.display_name,
                avatarUrl: data.avatar_url,
            };
            setUserProfile(profile);
            setUserRole(profile.role);
            setHasTrainer(!!profile.trainerId);
        }
    };

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile();
            }
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile();
            } else {
                setUserProfile(null);
                setUserRole('user');
                setHasTrainer(false);
            }
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setUserProfile(null);
        setUserRole('user');
        setHasTrainer(false);
    };

    const refreshProfile = async () => {
        await fetchProfile();
    };

    const value = {
        session,
        user,
        userRole,
        userProfile,
        hasTrainer,
        signOut,
        loading,
        refreshProfile
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
