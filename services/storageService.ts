import { Routine, WorkoutSession, UserSettings } from '../types';

const KEYS = {
  ROUTINES: 'ironlog_routines',
  SESSIONS: 'ironlog_sessions',
  SETTINGS: 'ironlog_settings',
  ACTIVE_SESSION: 'ironlog_active_session'
};

const defaultRoutines: Routine[] = [
  {
    id: '1',
    name: 'Push (Chest/Triceps/Shoulders)',
    exercises: [
      { id: 'e1', name: 'Bench Press', muscleGroup: 'Chest', defaultSets: 3, defaultReps: 8 },
      { id: 'e2', name: 'Overhead Press', muscleGroup: 'Shoulders', defaultSets: 3, defaultReps: 10 },
      { id: 'e3', name: 'Tricep Pushdown', muscleGroup: 'Triceps', defaultSets: 3, defaultReps: 12 },
    ]
  },
  {
    id: '2',
    name: 'Pull (Back/Biceps)',
    exercises: [
      { id: 'e4', name: 'Pull Ups', muscleGroup: 'Back', defaultSets: 3, defaultReps: 8 },
      { id: 'e5', name: 'Barbell Row', muscleGroup: 'Back', defaultSets: 3, defaultReps: 8 },
      { id: 'e6', name: 'Bicep Curl', muscleGroup: 'Biceps', defaultSets: 3, defaultReps: 12 },
    ]
  }
];

const defaultSettings: UserSettings = {
  theme: 'system',
  unit: 'kg',
  defaultRestTimer: 90
};

export const StorageService = {
  getRoutines: (): Routine[] => {
    const data = localStorage.getItem(KEYS.ROUTINES);
    return data ? JSON.parse(data) : defaultRoutines;
  },

  saveRoutines: (routines: Routine[]) => {
    localStorage.setItem(KEYS.ROUTINES, JSON.stringify(routines));
  },

  getSessions: (): WorkoutSession[] => {
    const data = localStorage.getItem(KEYS.SESSIONS);
    return data ? JSON.parse(data) : [];
  },

  saveSession: (session: WorkoutSession) => {
    const sessions = StorageService.getSessions();
    sessions.push(session);
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  },

  updateSession: (updatedSession: WorkoutSession) => {
      const sessions = StorageService.getSessions();
      const index = sessions.findIndex(s => s.id === updatedSession.id);
      if (index !== -1) {
          sessions[index] = updatedSession;
          localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
      }
  },

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
  
  deleteRoutine: (id: string) => {
      const routines = StorageService.getRoutines().filter(r => r.id !== id);
      StorageService.saveRoutines(routines);
  },
  
  deleteSession: (id: string) => {
      const sessions = StorageService.getSessions().filter(s => s.id !== id);
      localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  }
};