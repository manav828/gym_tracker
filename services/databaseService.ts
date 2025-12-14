import { supabase } from '../lib/supabaseClient';
import { Routine, WorkoutSession, UserSettings, UserProfile, BodyWeightLog, FoodLog, WaterLog, FoodItem } from '../types';

const KEYS = {
  SETTINGS: 'ironlog_settings',
  ACTIVE_SESSION: 'ironlog_active_session'
};

const defaultSettings: UserSettings = {
  theme: 'system',
  unit: 'kg',
  defaultRestTimer: 90
};

export const DatabaseService = {
  // --- Routines ---
  getRoutines: async (): Promise<Routine[]> => {
    const { data: routinesData, error: routinesError } = await supabase
      .from('routines')
      .select('*')
      .order('created_at', { ascending: true });

    if (routinesError) {
      console.error('Error fetching routines:', routinesError);
      return [];
    }

    // Fetch latest session for each routine to sort by "Next Up"
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('routine_id, start_time')
      .order('start_time', { ascending: false });

    return routinesData.map((r: any) => {
      // Find the most recent session for this routine
      const lastSession = sessionsData?.find((s: any) => s.routine_id === r.id);
      return {
        id: r.id,
        name: r.name,
        dayLabel: r.day_label,
        exercises: r.exercises_json,
        lastPerformed: lastSession ? lastSession.start_time : 0 // 0 means never performed (priority)
      };
    });
  },

  saveRoutine: async (routine: Routine) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user");

    const payload = {
      id: routine.id,
      user_id: user.id,
      name: routine.name,
      exercises_json: routine.exercises
    };

    const { error } = await supabase.from('routines').upsert(payload);
    if (error) console.error('Error saving routine:', error);
    return { error };
  },

  deleteRoutine: async (id: string) => {
    const { error } = await supabase.from('routines').delete().eq('id', id);
    if (error) console.error('Error deleting routine:', error);
    return { error };
  },

  // --- Sessions ---
  getSessions: async (): Promise<WorkoutSession[]> => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error fetching sessions:', error);
      return [];
    }

    return data.map((s: any) => ({
      id: s.id,
      routineId: s.routine_id,
      routineName: s.routine_name,
      startTime: s.start_time,
      endTime: s.end_time,
      durationSeconds: s.duration_seconds,
      totalVolume: s.total_volume,
      date: s.date,
      bodyWeight: s.exercises_json.bodyWeight,
      exercises: s.exercises_json.exercises || s.exercises_json
    }));
  },

  saveSession: async (session: WorkoutSession) => {
    const exercisesPayload = {
      exercises: session.exercises,
      bodyWeight: session.bodyWeight
    };

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("No authenticated user");

    const payload = {
      id: session.id,
      user_id: user.id,
      routine_id: session.routineId,
      routine_name: session.routineName,
      start_time: session.startTime,
      end_time: session.endTime,
      duration_seconds: session.durationSeconds,
      total_volume: session.totalVolume,
      date: session.date,
      exercises_json: exercisesPayload
    };

    const { error } = await supabase.from('sessions').upsert(payload);
    if (error) console.error('Error saving session:', error);
    return { error };
  },

  deleteSession: async (id: string) => {
    const { error } = await supabase.from('sessions').delete().eq('id', id);
    if (error) {
      console.error('Error deleting session:', error);
      return { error };
    }
    return { error: null };
  },

  // --- Measurements (Weight) ---
  logWeight: async (weight: number, date: string) => {
    // Check if entry exists for date to update it, or insert new
    const { data } = await supabase.from('measurements').select('id').eq('date', date).limit(1);

    if (data && data.length > 0) {
      const { error } = await supabase.from('measurements').update({ weight }).eq('id', data[0].id);
      if (error) console.error("Error updating weight", error);
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('measurements').insert({ weight, date, user_id: user.id });
        if (error) console.error("Error logging weight", error);
      }
    }
  },

  getWeightHistory: async (): Promise<BodyWeightLog[]> => {
    const { data, error } = await supabase.from('measurements').select('*').order('date', { ascending: true });
    if (error || !data) return [];
    return data.map((d: any) => ({ id: d.id, date: d.date, weight: d.weight }));
  },

  getTodayWeight: async (): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await supabase.from('measurements').select('*').eq('date', today);
    return data && data.length > 0;
  },

  // --- Nutrition & Water ---

  // Alias for backward compatibility or clarity
  addFoodLog: async (log: Omit<FoodLog, 'id' | 'user_id'> & { notes?: string }) => {
    // We need to match the signature expected by Dashboard.tsx which includes 'notes' and excludes 'user_id'
    // The existing logFood expects Omit<FoodLog, 'id'> which includes user_id? No, FoodLog usually has user_id.
    // internal logFood grabs user_id from auth.
    return DatabaseService.logFood(log);
  },

  logFood: async (log: Omit<FoodLog, 'id'> | any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('food_logs').insert({
      user_id: user.id,
      date: log.date,
      meal_type: log.mealType,
      food_name: log.foodName,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fats: log.fats,
      quantity: log.quantity,
      unit: log.unit
    });
    if (error) console.error("Error logging food:", error);
  },

  getFoodLogs: async (date: string): Promise<FoodLog[]> => {
    const { data, error } = await supabase.from('food_logs').select('*').eq('date', date);
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      date: d.date,
      mealType: d.meal_type,
      foodName: d.food_name,
      calories: d.calories,
      protein: d.protein,
      carbs: d.carbs,
      fats: d.fats,
      quantity: d.quantity,
      unit: d.unit
    }));
  },

  getAllFoodLogs: async (): Promise<FoodLog[]> => {
    const { data, error } = await supabase.from('food_logs').select('*').order('date', { ascending: true });
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      date: d.date,
      mealType: d.meal_type,
      foodName: d.food_name,
      calories: d.calories,
      protein: d.protein,
      carbs: d.carbs,
      fats: d.fats,
      quantity: d.quantity,
      unit: d.unit
    }));
  },

  deleteFoodLog: async (id: string) => {
    await supabase.from('food_logs').delete().eq('id', id);
  },

  updateFoodLog: async (log: FoodLog) => {
    const { error } = await supabase.from('food_logs').update({
      meal_type: log.mealType,
      food_name: log.foodName,
      calories: log.calories,
      protein: log.protein,
      carbs: log.carbs,
      fats: log.fats,
      quantity: log.quantity,
      unit: log.unit
    }).eq('id', log.id);
    if (error) console.error("Error updating food log:", error);
  },

  logWater: async (amount: number, date: string) => {
    // Aggregate water logs per day for simplicity in this function, or just add entry
    // For this app, let's just add an entry.
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('water_logs').insert({
      user_id: user.id,
      date: date,
      amount_ml: amount
    });
    if (error) console.error("Error logging water:", error);
  },

  getWaterLogs: async (date: string): Promise<WaterLog[]> => {
    const { data, error } = await supabase.from('water_logs').select('*').eq('date', date);
    if (error || !data) return [];
    return data.map((d: any) => ({ id: d.id, date: d.date, amount: d.amount_ml }));
  },

  getAllWaterLogs: async (): Promise<WaterLog[]> => {
    const { data, error } = await supabase.from('water_logs').select('*').order('date', { ascending: true });
    if (error || !data) return [];
    return data.map((d: any) => ({ id: d.id, date: d.date, amount: d.amount_ml }));
  },

  addCustomFood: async (food: Omit<FoodItem, 'id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('custom_foods').insert({
      user_id: user.id,
      name: food.name,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fats: food.fats,
      serving_size: food.servingSize
    });
    if (error) console.error("Error adding custom food", error);
  },

  getCustomFoods: async (): Promise<FoodItem[]> => {
    const { data, error } = await supabase.from('custom_foods').select('*');
    if (error || !data) return [];
    return data.map((d: any) => ({
      id: d.id,
      name: d.name,
      calories: d.calories,
      protein: d.protein,
      carbs: d.carbs,
      fats: d.fats,
      servingSize: d.serving_size,
      isCustom: true
    }));
  },

  // --- User Profile ---
  getUserProfile: async (): Promise<UserProfile> => {
    // limit(1) allows us to check existence without throwing error if empty
    const { data, error } = await supabase.from('user_profile').select('*').limit(1);

    if (error || !data || data.length === 0) {
      return { goal: 'general' };
    }
    return {
      goal: data[0].goal,
      targetWeight: data[0].target_weight,
      height: data[0].height,
      calorieGoal: data[0].calorie_goal || 2500,
      proteinGoal: data[0].protein_goal || 150,
      carbsGoal: data[0].carbs_goal || 250,
      fatsGoal: data[0].fats_goal || 70,
      waterGoal: data[0].water_goal || 3000,
      email: data[0].email
    };
  },

  saveUserProfile: async (profile: UserProfile) => {
    // Check if a profile row exists
    const { data } = await supabase.from('user_profile').select('id').limit(1);

    const payload = {
      goal: profile.goal,
      target_weight: profile.targetWeight,
      height: profile.height,
      calorie_goal: profile.calorieGoal,
      protein_goal: profile.proteinGoal,
      carbs_goal: profile.carbsGoal,
      fats_goal: profile.fatsGoal,
      water_goal: profile.waterGoal
    };

    if (data && data.length > 0) {
      // Update existing
      const { error } = await supabase.from('user_profile').update(payload).eq('id', data[0].id);
      if (error) console.error("Error updating profile:", error);
    } else {
      // Insert new
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error } = await supabase.from('user_profile').insert({ ...payload, user_id: user.id });
        if (error) console.error("Error inserting profile:", error);
      }
    }
  },

  // --- Local Settings ---
  getSettings: (): UserSettings => {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : defaultSettings;
  },

  saveSettings: (settings: UserSettings) => {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  },

  getActiveSession: (): WorkoutSession | null => {
    const data = localStorage.getItem(KEYS.ACTIVE_SESSION);
    return data ? JSON.parse(data) : null;
  },

  saveActiveSession: (session: WorkoutSession | null) => {
    if (session) {
      localStorage.setItem(KEYS.ACTIVE_SESSION, JSON.stringify(session));
    } else {
      localStorage.removeItem(KEYS.ACTIVE_SESSION);
    }
  },

  // --- Abandoned Session (Resume Feature) ---
  saveAbandonedSession: (session: WorkoutSession | null) => {
    if (session) {
      localStorage.setItem('ironlog_abandoned_session', JSON.stringify(session));
    } else {
      localStorage.removeItem('ironlog_abandoned_session');
    }
  },

  getAbandonedSession: (): WorkoutSession | null => {
    const data = localStorage.getItem('ironlog_abandoned_session');
    return data ? JSON.parse(data) : null;
  }
};