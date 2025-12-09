import React, { useState, useEffect } from 'react';
import { Home, Calendar, Settings as SettingsIcon, Dumbbell, BarChart3, ChevronUp, X, Scale } from 'lucide-react';
import { HomeScreen, CalendarScreen, ReportsScreen, RoutinesScreen, SettingsScreen } from './components/Dashboard';
import { ActiveSession } from './components/ActiveSession';
import { DatabaseService } from './services/databaseService';
import { Routine, WorkoutSession } from './types';
import { Button, Modal, Input, Card } from './components/Shared';

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

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  
  // Weight Reminder State
  const [showWeightReminder, setShowWeightReminder] = useState(false);
  const [todayWeight, setTodayWeight] = useState('');

  // Initialize
  useEffect(() => {
    // Load Routines from Supabase
    DatabaseService.getRoutines().then(setRoutines);
    
    // Check for active session (Local for speed/offline safety)
    const savedSession = DatabaseService.getActiveSession();
    if (savedSession) {
      setActiveSession(savedSession);
      DatabaseService.getRoutines().then(rs => {
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
  }, []);

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
  };

  const handleDismissWeight = () => {
      const today = new Date().toISOString().split('T')[0];
      localStorage.setItem('ironlog_last_weight_reminder', today); // Don't ask again today
      setShowWeightReminder(false);
  };

  const handleStartWorkout = (routine: Routine) => {
    setActiveRoutine(routine);
    setActiveSession(null); // Clear any old stale session if it wasn't resumed
    setCurrentRoute('active-workout');
    window.location.hash = 'active-workout';
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
    setCurrentRoute('home');
    window.location.hash = 'home';
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
      { id: 'workouts', icon: Dumbbell, label: 'Workouts' },
      { id: 'calendar', icon: Calendar, label: 'History' },
      { id: 'reports', icon: BarChart3, label: 'AI Chat' },
      { id: 'settings', icon: SettingsIcon, label: 'Settings' },
    ];

    return (
      <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-dark-card border-t border-gray-200 dark:border-gray-800 pb-safe z-30">
        <div className="flex justify-around items-center h-16 max-w-2xl mx-auto">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => window.location.hash = item.id}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                currentRoute === item.id 
                  ? 'text-primary-600 dark:text-primary-400' 
                  : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
              }`}
            >
              <item.icon size={20} strokeWidth={currentRoute === item.id ? 2.5 : 2} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg transition-colors duration-200 font-sans">
      <div className="mx-auto max-w-3xl bg-white dark:bg-dark-bg min-h-screen shadow-2xl shadow-black/5 relative">
        {currentRoute === 'active-workout' && activeRoutine ? (
            <ActiveSession 
                routine={activeRoutine} 
                existingSession={activeSession}
                onFinish={handleFinishWorkout}
                onBack={handleMinimizeWorkout}
            />
        ) : (
            <Router route={currentRoute}>
                {(route) => {
                    switch (route) {
                        case 'home': return <HomeScreen routines={routines} onStartWorkout={handleStartWorkout} onResume={handleResumeWorkout} onViewHistory={() => window.location.hash = 'calendar'} activeSession={activeSession} />;
                        case 'workouts': return <RoutinesScreen routines={routines} onUpdateRoutines={setRoutines} />;
                        case 'calendar': return <CalendarScreen />;
                        case 'reports': return <ReportsScreen />;
                        case 'settings': return <SettingsScreen />;
                        default: return <HomeScreen routines={routines} onStartWorkout={handleStartWorkout} onResume={handleResumeWorkout} onViewHistory={() => window.location.hash = 'calendar'} activeSession={activeSession} />;
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