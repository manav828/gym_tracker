import React, { useState, useEffect, useRef } from 'react';
import { Home, Calendar, Settings as SettingsIcon, Dumbbell, BarChart3, ChevronUp, Scale, LogOut, Users, ClipboardList, User } from 'lucide-react';
import { HomeScreen, CalendarScreen, ReportsScreen, RoutinesScreen, SettingsScreen } from './components/Dashboard';
import { NutritionScreen } from './components/Nutrition';
import { ActiveSession } from './components/ActiveSession';
import { DatabaseService } from './services/databaseService';
import { Routine, WorkoutSession } from './types';
import { Button, Modal, Input, Card, ConfirmationModal } from './components/Shared';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { TrainerDashboard } from './components/TrainerDashboard';
import { PlanBuilder } from './components/PlanBuilder';
import { TraineeView } from './components/TraineeView';

// Simple Router Component
const Router = ({
  route,
  children
}: {
  route: string,
  children: (currentRoute: string) => React.ReactNode
}) => {
  return <>{children(route)}</>;
};

function AppContent() {
  const { user, signOut, loading, userRole, hasTrainer } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);

  // History Editing State
  const [editingSession, setEditingSession] = useState<WorkoutSession | null>(null);

  // Resume Abandoned Session State
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [abandonedSessionToResume, setAbandonedSessionToResume] = useState<WorkoutSession | null>(null);
  const [pendingRoutineStart, setPendingRoutineStart] = useState<Routine | null>(null);

  // Weight Reminder State
  const [showWeightReminder, setShowWeightReminder] = useState(false);
  const [todayWeight, setTodayWeight] = useState('');

  // Dashboard State lifted up
  const [userProfile, setUserProfile] = useState<any>(null);
  const [stats, setStats] = useState({ workouts: 0, volume: 0 });
  const [latestWeight, setLatestWeight] = useState<number | null>(null);

  // Ref to prevent race conditions
  const ignoreSessionRestoreRef = useRef(false);

  const fetchDashboardData = async () => {
    // 1. Sessions & Stats
    const sessions = await DatabaseService.getSessions();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentSessions = sessions.filter(s => s.startTime > oneWeekAgo);
    const totalVol = recentSessions.reduce((acc, s) => acc + s.totalVolume, 0);
    setStats({ workouts: recentSessions.length, volume: totalVol });

    // 2. Weight History
    const history = await DatabaseService.getWeightHistory();
    if (history.length > 0) setLatestWeight(history[history.length - 1].weight);

    // 3. User Profile
    const profile = await DatabaseService.getUserProfile();
    setUserProfile(profile);
  };

  // Initialize
  useEffect(() => {
    if (!user) return;

    // Load Routines
    DatabaseService.getRoutines().then(setRoutines);

    // Load Dashboard Data
    fetchDashboardData();

    // Check for active session
    const savedSession = DatabaseService.getActiveSession();
    if (savedSession) {
      // Optimistically set session, but check ref before setting routine
      setActiveSession(savedSession);
      DatabaseService.getRoutines().then(rs => {
        if (ignoreSessionRestoreRef.current) return; // Prevent overwriting if user already started new
        const r = rs.find(rt => rt.id === savedSession.routineId);
        if (r) setActiveRoutine(r);
      });
    }

    // Check Daily Weight
    checkDailyWeight();

    // Hash change listener
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) setCurrentRoute(hash);
      else setCurrentRoute('home');
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Initial check

    // Dark Mode init
    const settings = DatabaseService.getSettings();
    if (settings.theme === 'dark' || (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark');
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  const checkDailyWeight = async () => {
    const today = new Date().toISOString().split('T')[0];
    const lastReminded = localStorage.getItem('ironlog_last_weight_reminder');

    // If already reminded today, skip
    if (lastReminded === today) return;

    const hasLogged = await DatabaseService.getTodayWeight();
    if (!hasLogged) {
      // Show popup
      setTimeout(() => setShowWeightReminder(true), 2000); // Small delay for UX
    }
  };

  const handleLogWeight = async () => {
    if (!todayWeight) return;
    const today = new Date().toISOString().split('T')[0];
    await DatabaseService.logWeight(parseFloat(todayWeight), today);
    localStorage.setItem('ironlog_last_weight_reminder', today);
    setShowWeightReminder(false);
    fetchDashboardData();
  };

  const handleDismissWeight = () => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('ironlog_last_weight_reminder', today); // Don't ask again today
    setShowWeightReminder(false);
  };

  const handleStartWorkout = (routine: Routine) => {
    // 1. Check if ANY session is currently active
    if (activeSession) {
      if (activeSession.routineId === routine.id) {
        // Resume the active one naturally
        setCurrentRoute('active-workout');
        window.location.hash = 'active-workout';
        return;
      } else {
        // If user actively clicks Play on a NEW routine while another is active,
        // we assume they want to switch. We start the new one (overwriting the old one).
        startNewWorkout(routine);
        return;
      }
    }

    // 2. Check for Abandoned Session (same routine, same day)
    const abandoned = DatabaseService.getAbandonedSession();
    const today = new Date().toISOString().split('T')[0];

    if (abandoned && abandoned.routineId === routine.id && abandoned.date === today) {
      setAbandonedSessionToResume(abandoned);
      setPendingRoutineStart(routine);
      setIsResumeModalOpen(true);
      return;
    }

    // 3. Start New
    startNewWorkout(routine);
  };

  const startNewWorkout = (routine: Routine) => {
    ignoreSessionRestoreRef.current = true; // Block any pending restore
    setActiveRoutine(routine);
    setActiveSession(null);
    setCurrentRoute('active-workout');
    window.location.hash = 'active-workout';
  };

  const confirmResume = () => {
    if (abandonedSessionToResume) {
      const routine = routines.find(r => r.id === abandonedSessionToResume.routineId);
      if (routine) {
        setActiveRoutine(routine);
        setActiveSession(abandonedSessionToResume);
        setCurrentRoute('active-workout');
        window.location.hash = 'active-workout';
      }
    }
    setIsResumeModalOpen(false);
    setAbandonedSessionToResume(null);
    setPendingRoutineStart(null);
  };

  const declineResume = () => {
    if (pendingRoutineStart) {
      startNewWorkout(pendingRoutineStart);
    }
    setIsResumeModalOpen(false);
    setAbandonedSessionToResume(null);
    setPendingRoutineStart(null);
    // Clear the abandoned session so we don't ask again immediately?
    // Maybe keep it until end of day? No, if they chose "Start New", they probably don't want the old one.
    DatabaseService.saveAbandonedSession(null);
  };

  const handleResumeWorkout = (session: WorkoutSession) => {
    const routine = routines.find(r => r.id === session.routineId);
    if (routine) {
      setActiveRoutine(routine);
      setActiveSession(session);
      setCurrentRoute('active-workout');
      window.location.hash = 'active-workout';
    }
  }

  const handleMinimizeWorkout = () => {
    // Just change route, keep session state active
    setCurrentRoute('home');
    window.location.hash = 'home';
  }

  const handleFinishWorkout = () => {
    setActiveSession(null);
    setActiveRoutine(null);
    setEditingSession(null); // Also clear editing state
    setCurrentRoute('home');
    window.location.hash = 'home';
  };

  const handleEditHistory = (session: WorkoutSession) => {
    // 1. Find the routine content (to get muscle groups/videos/etc)
    // Even if routine doesn't exist anymore, we can try to reconstruct a partial one,
    // but better to find the original if possible.
    let routine = routines.find(r => r.id === session.routineId);

    if (!routine) {
      // Fallback if routine deleted: create a dummy wrapper so ActiveSession can render
      routine = {
        id: session.routineId,
        name: session.routineName,
        exercises: session.exercises.map(e => ({
          id: e.exerciseId,
          name: e.name,
          muscleGroup: 'Unknown', // We lost this metadata if routine deleted
          sets: 3,
          reps: 10
        }))
      };
    }

    setActiveRoutine(routine); // ActiveSession needs this context
    setEditingSession(session);
    setCurrentRoute('edit-workout');
    window.location.hash = 'edit-workout';
  };

  const FloatingSessionBar = () => {
    if (!activeSession || currentRoute === 'active-workout') return null;

    return (
      <div
        onClick={() => { setCurrentRoute('active-workout'); window.location.hash = 'active-workout'; }}
        className="fixed bottom-20 left-4 right-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-4 rounded-xl shadow-xl z-40 flex justify-between items-center cursor-pointer animate-in slide-in-from-bottom-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
          <div>
            <p className="text-xs font-bold uppercase opacity-75">Workout in Progress</p>
            <p className="font-bold text-sm">{activeSession.routineName}</p>
          </div>
        </div>
        <ChevronUp size={20} />
      </div>
    );
  }

  const BottomNav = () => {
    if (currentRoute === 'active-workout') return null;

    const navItems = [
      { id: 'home', icon: Home, label: 'Home' },
      // Role-based nav items
      ...(userRole === 'trainer' ? [
        { id: 'trainees', icon: Users, label: 'Trainees' },
        { id: 'plan-builder', icon: ClipboardList, label: 'Plans' },
      ] : [
        { id: 'workouts', icon: Dumbbell, label: 'Workouts' },
      ]),
      // Show trainer badge for trainees
      ...(hasTrainer && userRole === 'user' ? [
        { id: 'my-trainer', icon: User, label: 'My Trainer' },
      ] : []),
      { id: 'calendar', icon: Calendar, label: 'History' },
      { id: 'reports', icon: BarChart3, label: 'AI Coach' },
      { id: 'settings', icon: SettingsIcon, label: 'Settings' },
    ];

    return (
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-800 pb-safe z-30">
        <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => window.location.hash = item.id}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentRoute === item.id
                ? 'text-primary-600 dark:text-primary-400'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                }`}
            >
              <item.icon size={20} strokeWidth={currentRoute === item.id ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}

          <Modal isOpen={isResumeModalOpen} onClose={() => setIsResumeModalOpen(false)} title="Resume Workout?">
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">You have an unfinished session for this routine from today.</p>
              <div className="flex gap-3 justify-end">
                <Button variant="ghost" onClick={declineResume}>
                  Start New
                </Button>
                <Button onClick={confirmResume}>
                  Resume Session
                </Button>
              </div>
            </div>
          </Modal>

        </div>
      </div>
    );
  };

  if (loading) return <div className="h-screen flex items-center justify-center bg-gray-50 dark:bg-dark-bg text-gray-400">Loading IronLog...</div>;

  if (!user) return <Auth />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200 font-sans">
      <div className={`mx-auto max-w-3xl bg-white dark:bg-dark-bg min-h-screen shadow-2xl shadow-black/5 relative pt-safe ${currentRoute === 'reports' ? '' : (activeSession && currentRoute !== 'active-workout' ? 'pb-40' : 'pb-24')}`}>
        {currentRoute === 'settings' && (
          <div className="absolute top-4 right-4 z-50">
            <Button variant="ghost" size="sm" onClick={signOut} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
              <LogOut size={16} className="mr-2" /> Sign Out
            </Button>
          </div>
        )}

        {currentRoute === 'active-workout' && activeRoutine ? (
          <ActiveSession
            routine={activeRoutine}
            existingSession={activeSession}
            onFinish={handleFinishWorkout}
            onBack={handleMinimizeWorkout}
            onSessionUpdate={setActiveSession}
          />
        ) : currentRoute === 'edit-workout' && activeRoutine && editingSession ? (
          <ActiveSession
            routine={activeRoutine}
            existingSession={editingSession}
            onFinish={handleFinishWorkout}
            onBack={() => { setCurrentRoute('calendar'); window.location.hash = 'calendar'; }}
            onSessionUpdate={() => { }} // No auto-save to local storage needed for history edit
            isHistory={true}
          />
        ) : (
          <Router route={currentRoute}>
            {(route) => {
              switch (route) {
                case 'home': return <HomeScreen routines={routines} onStartWorkout={handleStartWorkout} onResume={handleResumeWorkout} onViewHistory={() => window.location.hash = 'calendar'} activeSession={activeSession} userProfile={userProfile} stats={stats} latestWeight={latestWeight} onRefresh={fetchDashboardData} />;
                case 'workouts': return <RoutinesScreen routines={routines} onUpdateRoutines={setRoutines} />;
                case 'calendar': return <CalendarScreen onEditSession={handleEditHistory} />;
                case 'reports': return <ReportsScreen />;
                case 'nutrition': return <NutritionScreen profile={userProfile} />;
                case 'settings': return <SettingsScreen />;
                // Trainer Routes
                case 'trainees': return <TrainerDashboard />;
                case 'plan-builder': return <PlanBuilder onBack={() => window.location.hash = 'trainees'} />;
                // Trainee Routes
                case 'my-trainer': return <TraineeView />;
                default: return <HomeScreen routines={routines} onStartWorkout={handleStartWorkout} onResume={handleResumeWorkout} onViewHistory={() => window.location.hash = 'calendar'} activeSession={activeSession} userProfile={userProfile} stats={stats} latestWeight={latestWeight} onRefresh={fetchDashboardData} />;
              }
            }}
          </Router>
        )}
      </div>

      <FloatingSessionBar />
      <BottomNav />

      {/* Daily Weight Modal */}
      <Modal isOpen={showWeightReminder} onClose={handleDismissWeight} title="Daily Check-in">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center mx-auto mb-2">
            <Scale size={32} />
          </div>
          <p className="text-gray-600 dark:text-gray-300">Tracking your weight daily helps AI give better recommendations. Log it now?</p>
          <Input
            type="number"
            placeholder="Weight (kg)"
            className="text-center text-lg font-bold"
            value={todayWeight}
            onChange={(e) => setTodayWeight(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleDismissWeight} className="flex-1">Skip</Button>
            <Button onClick={handleLogWeight} className="flex-1 bg-purple-600 hover:bg-purple-700">Save</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}