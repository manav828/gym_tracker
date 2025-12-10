import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Routine, WorkoutSession, UserProfile, BodyWeightLog, FoodLog, WaterLog } from '../types';
import { DatabaseService } from '../services/databaseService';
import { GeminiService } from '../services/geminiService';
import { Button, Card, Modal, Input, ConfirmationModal } from './Shared';
import { NutritionDashboard } from './Nutrition';
import { Calendar as CalendarIcon, Activity, Plus, Play, Trash, BarChart as BarChartIcon, Sparkles, Send, Edit2, UserCircle, Scale, ChevronLeft, ChevronRight, Search, BookOpen, Copy, ArrowLeft, X, Ruler, TrendingUp, Info, Flame, Droplets } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Constants ---
interface ExerciseDetail {
    name: string;
    target: string;
}

const COMMON_EXERCISES: Record<string, ExerciseDetail[]> = {
    'Chest': [
        { name: 'Bench Press', target: 'Middle Chest (Overall Mass)' },
        { name: 'Incline Barbell Press', target: 'Upper Chest' },
        { name: 'Decline Barbell Press', target: 'Lower Chest' },
        { name: 'Dumbbell Bench Press', target: 'Middle Chest (Stabilization)' },
        { name: 'Incline Dumbbell Press', target: 'Upper Chest' },
        { name: 'Decline Dumbbell Press', target: 'Lower Chest' },
        { name: 'Chest Fly (Dumbbell)', target: 'Inner/Outer Chest (Stretch)' },
        { name: 'Cable Crossover', target: 'Lower/Inner Chest' },
        { name: 'Pec Deck Machine', target: 'Inner Chest (Isolation)' },
        { name: 'Push Ups', target: 'General Chest & Core' },
        { name: 'Weighted Push Ups', target: 'General Chest' },
        { name: 'Dips (Chest Focus)', target: 'Lower Chest' },
        { name: 'Landmine Press', target: 'Upper/Inner Chest' }
    ],
    'Back': [
        { name: 'Pull Ups', target: 'Lats (Width)' },
        { name: 'Chin Ups', target: 'Lats & Biceps' },
        { name: 'Lat Pulldown (Wide)', target: 'Upper Lats (Width)' },
        { name: 'Lat Pulldown (Close)', target: 'Lower Lats' },
        { name: 'Barbell Row', target: 'Mid Back (Thickness)' },
        { name: 'Pendlay Row', target: 'Upper Back/Lats (Power)' },
        { name: 'Dumbbell Row', target: 'Lats (Unilateral)' },
        { name: 'Seated Cable Row', target: 'Mid Back/Rhomboids' },
        { name: 'Deadlift', target: 'Entire Posterior Chain' },
        { name: 'Rack Pulls', target: 'Upper Back/Traps' },
        { name: 'T-Bar Row', target: 'Mid Back thickness' },
        { name: 'Face Pulls', target: 'Rear Delts & Rotator Cuff' },
        { name: 'Straight Arm Pulldown', target: 'Lats (Isolation)' },
        { name: 'Shrugs', target: 'Upper Traps' }
    ],
    'Legs': [
        { name: 'Squat (Back)', target: 'Quads & Glutes (Overall)' },
        { name: 'Squat (Front)', target: 'Quads (Anterior)' },
        { name: 'Leg Press', target: 'Quads/Glutes (Heavy Load)' },
        { name: 'Hack Squat', target: 'Quads (Isolation focus)' },
        { name: 'Romanian Deadlift', target: 'Hamstrings & Glutes' },
        { name: 'Stiff Leg Deadlift', target: 'Hamstrings (Stretch)' },
        { name: 'Walking Lunges', target: 'Glutes & Quads (Unilateral)' },
        { name: 'Bulgarian Split Squat', target: 'Glutes & Quads (Balance)' },
        { name: 'Leg Extension', target: 'Quads (Isolation)' },
        { name: 'Leg Curl (Seated)', target: 'Hamstrings' },
        { name: 'Leg Curl (Lying)', target: 'Hamstrings' },
        { name: 'Calf Raises (Standing)', target: 'Calves (Gastrocnemius)' },
        { name: 'Calf Raises (Seated)', target: 'Calves (Soleus)' },
        { name: 'Hip Thrust', target: 'Glutes (Max Contraction)' }
    ],
    'Shoulders': [
        { name: 'Overhead Press (Barbell)', target: 'Front Delts (Power)' },
        { name: 'Overhead Press (Dumbbell)', target: 'Front Delts (Stability)' },
        { name: 'Arnold Press', target: 'All Delt Heads' },
        { name: 'Seated Dumbbell Press', target: 'Front/Side Delts' },
        { name: 'Lateral Raises', target: 'Side Delts (Width)' },
        { name: 'Front Raises', target: 'Front Delts' },
        { name: 'Rear Delt Fly', target: 'Rear Delts' },
        { name: 'Upright Row', target: 'Side Delts & Traps' },
        { name: 'Cable Lateral Raise', target: 'Side Delts (Constant Tension)' }
    ],
    'Biceps': [
        { name: 'Barbell Curl', target: 'Biceps (Overall Mass)' },
        { name: 'Dumbbell Curl', target: 'Biceps (Supination)' },
        { name: 'Hammer Curl', target: 'Brachialis (Width/Forearm)' },
        { name: 'Preacher Curl', target: 'Short Head (Peak)' },
        { name: 'Concentration Curl', target: 'Biceps (Isolation)' },
        { name: 'Incline Dumbbell Curl', target: 'Long Head (Stretch)' },
        { name: 'EZ Bar Curl', target: 'Biceps (Wrist Comfort)' }
    ],
    'Triceps': [
        { name: 'Tricep Pushdown (Rope)', target: 'Lateral Head' },
        { name: 'Tricep Pushdown (Bar)', target: 'Long Head' },
        { name: 'Skullcrushers', target: 'Medial/Long Head' },
        { name: 'Overhead Ext (Dumbbell)', target: 'Long Head (Stretch)' },
        { name: 'Overhead Ext (Cable)', target: 'Long Head (Stretch)' },
        { name: 'Close Grip Bench', target: 'Triceps (Mass)' },
        { name: 'Dips', target: 'Triceps (Overall)' },
        { name: 'Kickbacks', target: 'Triceps (Contraction)' }
    ],
    'Core': [
        { name: 'Plank', target: 'Core Stability' },
        { name: 'Side Plank', target: 'Obliques' },
        { name: 'Crunches', target: 'Upper Abs' },
        { name: 'Leg Raises', target: 'Lower Abs' },
        { name: 'Hanging Leg Raises', target: 'Lower Abs (Decompressed)' },
        { name: 'Russian Twists', target: 'Obliques' },
        { name: 'Ab Wheel Rollout', target: 'Deep Core/Lats' },
        { name: 'Mountain Climbers', target: 'Core & Cardio' },
        { name: 'Cable Woodchopper', target: 'Obliques (Rotational)' }
    ],
    'Cardio': [
        { name: 'Treadmill Run', target: 'Endurance' },
        { name: 'Cycling', target: 'Leg Endurance' },
        { name: 'Elliptical', target: 'Low Impact' },
        { name: 'Rowing Machine', target: 'Full Body Endurance' },
        { name: 'Jump Rope', target: 'Coordination & Calves' },
        { name: 'HIIT Sprints', target: 'Fat Loss (Anaerobic)' },
        { name: 'Burpees', target: 'Full Body Conditioning' }
    ]
};

const PREDEFINED_TEMPLATES = [
    {
        name: "Full Body A (Beginner)",
        goal: "General Fitness",
        exercises: [
            { name: "Squat (Back)", muscle: "Legs" },
            { name: "Bench Press", muscle: "Chest" },
            { name: "Barbell Row", muscle: "Back" },
            { name: "Overhead Press (Barbell)", muscle: "Shoulders" },
            { name: "Plank", muscle: "Core" }
        ]
    },
    {
        name: "Push Day (Hypertrophy)",
        goal: "Muscle Gain",
        exercises: [
            { name: "Bench Press", muscle: "Chest" },
            { name: "Incline Dumbbell Press", muscle: "Chest" },
            { name: "Overhead Press (Dumbbell)", muscle: "Shoulders" },
            { name: "Lateral Raises", muscle: "Shoulders" },
            { name: "Tricep Pushdown (Rope)", muscle: "Triceps" },
            { name: "Overhead Extension (Dumbbell)", muscle: "Triceps" }
        ]
    },
    {
        name: "Pull Day (Hypertrophy)",
        goal: "Muscle Gain",
        exercises: [
            { name: "Deadlift", muscle: "Back" },
            { name: "Pull Ups", muscle: "Back" },
            { name: "Seated Cable Row", muscle: "Back" },
            { name: "Face Pulls", muscle: "Shoulders" },
            { name: "Barbell Curl", muscle: "Biceps" },
            { name: "Hammer Curl", muscle: "Biceps" }
        ]
    },
    {
        name: "Legs (Power)",
        goal: "Strength",
        exercises: [
            { name: "Squat (Back)", muscle: "Legs" },
            { name: "Romanian Deadlift (RDL)", muscle: "Legs" },
            { name: "Leg Press", muscle: "Legs" },
            { name: "Calf Raises (Standing)", muscle: "Legs" },
            { name: "Hanging Leg Raises", muscle: "Core" }
        ]
    },
    {
        name: "Fat Burner Circuit",
        goal: "Weight Loss",
        exercises: [
            { name: "Jump Rope", muscle: "Cardio" },
            { name: "Bodyweight Squats", muscle: "Legs" },
            { name: "Push Ups", muscle: "Chest" },
            { name: "Mountain Climbers", muscle: "Core" },
            { name: "Burpees", muscle: "Cardio" }
        ]
    }
];

// --- Home Screen ---
export const HomeScreen: React.FC<{
    routines: Routine[];
    onStartWorkout: (routine: Routine) => void;
    onViewHistory: () => void;
    onResume: (session: WorkoutSession) => void;
    activeSession: WorkoutSession | null;
    userProfile: UserProfile | null;
    stats: { workouts: number, volume: number };
    latestWeight: number | null;
    onRefresh: () => void;
}> = ({ routines, onStartWorkout, onViewHistory, onResume, activeSession, userProfile, stats, latestWeight, onRefresh }) => {
    // Local UI state
    const [userHeight, setUserHeight] = useState<number | null>(null);

    // Sync local height with profile prop when it changes
    useEffect(() => {
        if (userProfile?.height) setUserHeight(userProfile.height);
    }, [userProfile]);

    const [isHeightModalOpen, setIsHeightModalOpen] = useState(false);
    const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
    const [inputHeight, setInputHeight] = useState('');
    const [inputWeight, setInputWeight] = useState('');

    const handleSaveWeight = async () => {
        if (!inputWeight) return;
        const w = parseFloat(inputWeight);
        if (!isNaN(w)) {
            await DatabaseService.logWeight(w, new Date().toISOString().split('T')[0]);
            setIsWeightModalOpen(false);
            setInputWeight('');
            onRefresh(); // Trigger parent refresh
        }
    }

    const handleSaveHeight = async () => {
        if (!inputHeight) return;
        const h = parseFloat(inputHeight);
        if (!isNaN(h)) {
            const profile = await DatabaseService.getUserProfile();
            await DatabaseService.saveUserProfile({ ...profile, height: h });
            setUserHeight(h);
            setIsHeightModalOpen(false);
            onRefresh(); // Trigger parent refresh
        }
    }

    const calculateBMI = () => {
        if (!latestWeight || !userHeight) return null;
        const heightM = userHeight / 100;
        const bmi = latestWeight / (heightM * heightM);
        return bmi.toFixed(1);
    }

    const getBMIInfo = (bmi: number) => {
        if (bmi < 18.5) return { label: 'Underweight', color: 'text-blue-500' };
        if (bmi < 25) return { label: 'Normal', color: 'text-green-500' };
        if (bmi < 30) return { label: 'Overweight', color: 'text-orange-500' };
        return { label: 'Obese', color: 'text-red-500' };
    }

    const bmi = calculateBMI();
    const bmiInfo = bmi ? getBMIInfo(parseFloat(bmi)) : null;

    // Sort Routines: "Next Up" Logic
    const sortedRoutines = [...routines].sort((a, b) => {
        const timeA = a.lastPerformed || 0;
        const timeB = b.lastPerformed || 0;
        return timeA - timeB;
    });

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">GymPro</h1>
                    <p className="text-sm text-gray-500">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                </div>
                <div onClick={() => window.location.hash = '#settings'} className="cursor-pointer w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
                    <UserCircle size={24} />
                </div>
            </div>

            {/* Active Session Card */}
            {activeSession && (
                <Card className="border-l-4 border-l-green-500 animate-pulse bg-green-50 dark:bg-green-900/10">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-green-700 dark:text-green-400">Workout in Progress</h3>
                            <p className="text-sm text-green-600 dark:text-green-500">{activeSession.routineName}</p>
                        </div>
                        <Button size="sm" onClick={() => onResume(activeSession)} className="bg-green-600 hover:bg-green-700">Resume</Button>
                    </div>
                </Card>
            )}

            {/* Nutrition Module */}
            {userProfile && <NutritionDashboard profile={userProfile} refreshTrigger={latestWeight || 0} />}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
                <Card className="p-4 relative" onClick={() => setIsWeightModalOpen(true)}>
                    <div className="flex items-center gap-2 text-gray-500 mb-2 text-xs uppercase font-bold tracking-wider">
                        <Scale size={16} /> Weight
                    </div>
                    <div className="text-2xl font-bold dark:text-white">{latestWeight || '--'} <span className="text-sm font-normal text-gray-400">kg</span></div>
                    <div className="absolute bottom-3 right-3 text-primary-500"><Plus size={16} /></div>
                </Card>

                <Card className="p-4 relative" onClick={() => !userHeight && setIsHeightModalOpen(true)}>
                    <div className="flex items-center gap-2 text-gray-500 mb-2 text-xs uppercase font-bold tracking-wider">
                        <Ruler size={16} /> BMI
                    </div>
                    {bmi ? (
                        <>
                            <div className="text-2xl font-bold dark:text-white">{bmi}</div>
                            <div className={`text-xs font-bold ${bmiInfo?.color}`}>{bmiInfo?.label}</div>
                        </>
                    ) : (
                        <div className="flex flex-col items-start justify-center h-full">
                            <div className="text-sm text-primary-500 font-bold flex items-center gap-1">Add Height <Plus size={12} /></div>
                        </div>
                    )}
                    {userHeight && (
                        <div className="absolute bottom-3 right-3 text-gray-300" onClick={(e) => { e.stopPropagation(); setIsHeightModalOpen(true); }}>
                            <Edit2 size={12} />
                        </div>
                    )}
                </Card>
            </div>

            {/* Quick Start Workout */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Start Workout</h2>
                    <Button variant="ghost" size="sm" onClick={() => window.location.hash = '#workouts'}>Manage</Button>
                </div>
                <div className="space-y-3">
                    {sortedRoutines.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-dark-card rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                            <p className="text-gray-500 mb-4">No routines found.</p>
                            <Button onClick={() => window.location.hash = '#routines'}>Create Routine</Button>
                        </div>
                    ) : (
                        sortedRoutines.map(routine => (
                            <div key={routine.id} className="relative bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-shadow">
                                {activeSession && activeSession.routineId === routine.id && (
                                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg rounded-tr-lg animate-pulse">
                                        IN PROGRESS
                                    </div>
                                )}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <div className="text-xs text-primary-600 dark:text-primary-400 font-bold mb-1 uppercase tracking-wider">{routine.dayLabel || 'Routine'}</div>
                                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">{routine.name}</h3>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {routine.lastPerformed ? `Last: ${new Date(routine.lastPerformed).toLocaleDateString()}` : 'Never performed'}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onStartWorkout(routine)}
                                        className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center shadow-lg shadow-primary-500/30 hover:bg-primary-600 transition-colors"
                                    >
                                        <Play size={20} fill="currentColor" className="ml-0.5" />
                                    </button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {routine.exercises.slice(0, 3).map((ex, i) => (
                                        <span key={i} className="text-[10px] px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md font-medium">
                                            {ex.name}
                                        </span>
                                    ))}
                                    {routine.exercises.length > 3 && (
                                        <span className="text-[10px] px-2 py-1 bg-gray-50 dark:bg-gray-800 text-gray-400 rounded-md font-medium">+{routine.exercises.length - 3}</span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Height Modal */}
            <Modal isOpen={isHeightModalOpen} onClose={() => setIsHeightModalOpen(false)} title="Update Height">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Enter your height to calculate BMI.</p>
                    <Input
                        label="Height (cm)"
                        type="number"
                        placeholder="e.g. 175"
                        value={inputHeight}
                        onChange={(e) => setInputHeight(e.target.value)}
                        autoFocus
                    />
                    <Button onClick={handleSaveHeight} className="w-full">Save Height</Button>
                </div>
            </Modal>

            {/* Weight Modal */}
            <Modal isOpen={isWeightModalOpen} onClose={() => setIsWeightModalOpen(false)} title="Log Weight">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Log your current body weight.</p>
                    <Input
                        label="Weight (kg)"
                        type="number"
                        placeholder="e.g. 80.5"
                        value={inputWeight}
                        onChange={(e) => setInputWeight(e.target.value)}
                        autoFocus
                    />
                    <Button onClick={handleSaveWeight} className="w-full">Save Weight</Button>
                </div>
            </Modal>
        </div>
    );
};

// --- Calendar/History Screen ---
export const CalendarScreen: React.FC = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    useEffect(() => {
        const fetchSessions = async () => {
            const data = await DatabaseService.getSessions();
            setSessions(data);
        };
        fetchSessions();
    }, []);

    const confirmDelete = async () => {
        if (!deleteId) return;
        const originalSessions = [...sessions];
        setSessions(prev => prev.filter(s => s.id !== deleteId)); // Optimistic

        try {
            const { error } = await DatabaseService.deleteSession(deleteId);
            if (error) throw error;
        } catch (err) {
            alert("Failed to delete session. This is likely a permission issue. Please check your Supabase dashboard or internet connection.");
            setSessions(originalSessions); // Revert
        } finally {
            setDeleteId(null);
        }
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    // Calendar Helpers
    const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

    const changeMonth = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setCurrentDate(newDate);
        setSelectedDate(null);
    }

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentDate);
        const startDay = getFirstDayOfMonth(currentDate); // 0 = Sun, 1 = Mon...
        const days = [];

        // Empties
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-12"></div>);
        }

        // Days
        for (let i = 1; i <= daysInMonth; i++) {
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const daySessions = sessions.filter(s => s.date === dateStr);
            const hasWorkout = daySessions.length > 0;
            const isSelected = selectedDate === dateStr;

            days.push(
                <div
                    key={i}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-12 flex flex-col items-center justify-center rounded-lg cursor-pointer transition-colors relative border ${isSelected
                        ? 'bg-primary-500 text-white border-primary-600'
                        : 'bg-white dark:bg-dark-card border-transparent hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                >
                    <span className={`text-sm ${hasWorkout && !isSelected ? 'font-bold' : ''}`}>{i}</span>
                    {hasWorkout && (
                        <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-primary-500'}`}></div>
                    )}
                </div>
            );
        }
        return days;
    }

    const displayedSessions = selectedDate
        ? sessions.filter(s => s.date === selectedDate)
        : sessions.sort((a, b) => b.startTime - a.startTime).slice(0, 5); // Show recent if no selection

    return (
        <div className="p-4 pb-24 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">History</h1>

            {/* Calendar Widget */}
            <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ChevronLeft size={20} /></button>
                    <h2 className="font-bold text-gray-900 dark:text-white">
                        {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                    </h2>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><ChevronRight size={20} /></button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 font-bold uppercase mb-2">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                    {renderCalendarGrid()}
                </div>
            </div>

            <h3 className="font-bold text-gray-500 uppercase text-xs mb-3">
                {selectedDate ? `Workouts on ${selectedDate}` : 'Recent Workouts'}
            </h3>

            {displayedSessions.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                    <p>No workouts found for this period.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {displayedSessions.map(session => (
                        <div key={session.id} className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 pb-6 last:pb-0">
                            <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary-500 border-4 border-white dark:border-dark-bg"></div>
                            <div className="mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <Card className="p-0 overflow-hidden">
                                <div className="p-4 flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white">{session.routineName}</h3>
                                        <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            <span>⏱ {Math.floor(session.durationSeconds / 60)}m</span>
                                            <span>⚖️ {session.totalVolume}kg</span>
                                        </div>
                                    </div>
                                    <button onClick={(e) => handleDeleteClick(session.id, e)} className="text-gray-400 hover:text-red-500 p-2 z-10"><Trash size={16} /></button>
                                </div>
                                {session.bodyWeight && <div className="px-4 text-xs text-purple-500 font-semibold mb-2">Body Weight: {session.bodyWeight}kg</div>}
                                <div className="bg-gray-50 dark:bg-dark-bg/50 px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                                    {session.exercises.length} Exercises Completed
                                </div>
                            </Card>
                        </div>
                    ))}
                </div>
            )}

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Workout Log?"
                message="This action cannot be undone."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

// --- Reports Screen (Chat & Analytics) ---

const AnalyticsView: React.FC = () => {
    const [weights, setWeights] = useState<BodyWeightLog[]>([]);
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [allFoodLogs, setAllFoodLogs] = useState<FoodLog[]>([]);
    const [allWaterLogs, setAllWaterLogs] = useState<WaterLog[]>([]);
    const [selectedExercise, setSelectedExercise] = useState<string>('Bench Press');

    // Derived
    const [exercisesList, setExercisesList] = useState<string[]>([]);
    const [exerciseData, setExerciseData] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            const w = await DatabaseService.getWeightHistory();
            const s = await DatabaseService.getSessions();
            const f = await DatabaseService.getAllFoodLogs();
            const wa = await DatabaseService.getAllWaterLogs();

            // Sort by date
            w.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            s.sort((a, b) => a.startTime - b.startTime);
            f.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            wa.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

            setWeights(w);
            setSessions(s);
            setAllFoodLogs(f);
            setAllWaterLogs(wa);

            // Extract all unique exercises from history
            const allExNames = new Set<string>();
            s.forEach(session => {
                session.exercises.forEach(e => allExNames.add(e.name));
            });
            setExercisesList(Array.from(allExNames).sort());
        };
        fetchData();
    }, []);

    // Process Exercise Data whenever selection changes
    useEffect(() => {
        if (!selectedExercise || sessions.length === 0) return;

        const dataPoints: any[] = [];
        sessions.forEach(session => {
            const ex = session.exercises.find(e => e.name === selectedExercise);
            if (ex && ex.sets.length > 0) {
                // Find Max Weight for this session
                const maxWeight = Math.max(...ex.sets.map(s => s.weight));
                dataPoints.push({
                    date: new Date(session.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
                    weight: maxWeight,
                    fullDate: new Date(session.startTime).getTime()
                });
            }
        });

        setExerciseData(dataPoints);
    }, [selectedExercise, sessions]);

    // Format Volume Data
    const volumeData = sessions.slice(-10).map(s => ({
        date: new Date(s.startTime).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        volume: s.totalVolume
    }));

    // Format Weight Data
    const weightData = weights.slice(-10).map(w => ({
        date: new Date(w.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        weight: w.weight
    }));

    // Format Nutrition Data (Last 7 unique days)
    const nutritionData = useMemo(() => {
        const daysMap = new Map<string, number>();
        allFoodLogs.forEach(log => {
            const current = daysMap.get(log.date) || 0;
            daysMap.set(log.date, current + log.calories);
        });
        return Array.from(daysMap.entries())
            .slice(-7)
            .map(([date, calories]) => ({
                date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
                calories
            }));
    }, [allFoodLogs]);

    const waterData = useMemo(() => {
        const daysMap = new Map<string, number>();
        allWaterLogs.forEach(log => {
            const current = daysMap.get(log.date) || 0;
            daysMap.set(log.date, current + log.amount);
        });
        return Array.from(daysMap.entries())
            .slice(-7)
            .map(([date, amount]) => ({
                date: new Date(date).toLocaleDateString(undefined, { weekday: 'short' }),
                amount
            }));
    }, [allWaterLogs]);

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Weight Chart */}
            <Card className="p-4">
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Scale size={18} className="text-purple-500" /> Body Weight Trend
                    </h3>
                    <span className="text-xs text-gray-400">Last 10 Logs</span>
                </div>
                <div className="h-48 w-full">
                    {weightData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={weightData}>
                                <defs>
                                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fontSize: 10 }} stroke="#9ca3af" width={30} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#8884d8' }}
                                />
                                <Area type="monotone" dataKey="weight" stroke="#8884d8" fillOpacity={1} fill="url(#colorWeight)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            Not enough data yet. Log your weight more often!
                        </div>
                    )}
                </div>
            </Card>

            {/* Nutrition Chart */}
            <Card className="p-4">
                <div className="mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Flame size={18} className="text-orange-500" /> Calorie Intake
                    </h3>
                </div>
                <div className="h-48 w-full">
                    {nutritionData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={nutritionData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" width={30} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="calories" fill="#f97316" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            Log meals to see calorie trends.
                        </div>
                    )}
                </div>
            </Card>

            {/* Water Chart */}
            <Card className="p-4">
                <div className="mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Droplets size={18} className="text-blue-500" /> Water Intake
                    </h3>
                </div>
                <div className="h-48 w-full">
                    {waterData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={waterData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" width={30} />
                                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                                <Bar dataKey="amount" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            Track water to see hydration history.
                        </div>
                    )}
                </div>
            </Card>

            {/* Volume Chart */}
            <Card className="p-4">
                <div className="mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Activity size={18} className="text-green-500" /> Workout Volume
                    </h3>
                </div>
                <div className="h-48 w-full">
                    {volumeData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={volumeData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                <YAxis tick={{ fontSize: 10 }} stroke="#9ca3af" width={30} tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`} />
                                <Tooltip
                                    cursor={{ fill: 'transparent' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="volume" fill="#22c55e" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                            Start working out to see stats!
                        </div>
                    )}
                </div>
            </Card>

            {/* Strength Progress Chart */}
            <Card className="p-4">
                <div className="mb-4">
                    <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                        <TrendingUp size={18} className="text-blue-500" /> Strength Progress
                    </h3>
                    <select
                        className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 text-sm dark:text-white"
                        value={selectedExercise}
                        onChange={(e) => setSelectedExercise(e.target.value)}
                    >
                        {exercisesList.length === 0 && <option>No exercises recorded yet</option>}
                        {exercisesList.map(ex => <option key={ex} value={ex}>{ex}</option>)}
                    </select>
                </div>

                <div className="h-48 w-full">
                    {exerciseData.length > 1 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={exerciseData}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="#9ca3af" />
                                <YAxis domain={['auto', 'auto']} tick={{ fontSize: 10 }} stroke="#9ca3af" width={30} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm text-center px-4">
                            {exercisesList.length === 0 ? "Complete a workout first!" : "Need at least 2 sessions of this exercise to show a trend."}
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

interface ChatMessage {
    role: 'user' | 'model';
    text: string;
}

export const ReportsScreen: React.FC = () => {
    const [view, setView] = useState<'analytics' | 'chat'>('analytics');

    // Chat State
    const [messages, setMessages] = useState<ChatMessage[]>([{ role: 'model', text: "Hi! I'm IronCoach. I have access to your full workout history. Ask me anything!" }]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
        setInput('');
        setIsLoading(true);

        try {
            // Fetch ALL context
            const sessions = await DatabaseService.getSessions();
            const profile = await DatabaseService.getUserProfile();
            const weights = await DatabaseService.getWeightHistory();

            // Summarize history to avoid token limits but keep detail
            // Group by Routine Name and Date
            const summarizedHistory = sessions.map(s => {
                const bestSets = s.exercises.map(e => {
                    const maxWeight = Math.max(...e.sets.map(x => x.weight));
                    return `${e.name}: ${maxWeight}kg`;
                }).join(', ');
                return `${s.date} (${s.routineName}): Vol ${s.totalVolume}kg. Best: ${bestSets}`;
            }).join('\n');

            const weightText = weights.length > 0 ? `Weight Log: ${weights.map(w => `${w.date}: ${w.weight}kg`).join('; ')}` : "No weight logs.";

            const context = `
                User Goal: ${profile.goal}
                Target Weight: ${profile.targetWeight || 'Not set'}
                Current Height: ${profile.height || 'Not set'}cm
                Body Weight History: ${weightText}
                Nutrition Goal: ${profile.calorieGoal || 2500} cal, ${profile.proteinGoal || 150}g protein.
                Full Workout History Summary:
                ${summarizedHistory}
            `;

            const response = await GeminiService.chatWithData(userMsg, context);

            setMessages(prev => [...prev, { role: 'model', text: response }]);
        } catch (e) {
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I couldn't connect to the server. Please try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (view === 'chat') {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, view]);

    return (
        <div className="flex flex-col h-full max-h-[calc(100vh-80px)] p-4 pb-24 max-w-2xl mx-auto">
            {/* Header Tabs */}
            <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl mb-4 shrink-0">
                <button
                    onClick={() => setView('analytics')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${view === 'analytics'
                        ? 'bg-white dark:bg-dark-card shadow-sm text-gray-900 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Analytics
                </button>
                <button
                    onClick={() => setView('chat')}
                    className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${view === 'chat'
                        ? 'bg-white dark:bg-dark-card shadow-sm text-gray-900 dark:text-white'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    AI Coach
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {view === 'analytics' ? (
                    <AnalyticsView />
                ) : (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 space-y-4 mb-4 pr-2">
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm whitespace-pre-wrap ${msg.role === 'user'
                                        ? 'bg-primary-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none shadow-sm'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-gray-100 dark:bg-dark-card p-4 rounded-2xl rounded-bl-none">
                                        <div className="flex gap-1">
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>

                        <div className="flex gap-2 shrink-0">
                            <input
                                className="flex-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 rounded-full px-4 py-3 text-sm focus:ring-2 focus:ring-primary-500 outline-none dark:text-white"
                                placeholder="Ask about progress, strength, etc..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            />
                            <button
                                onClick={handleSend}
                                disabled={isLoading || !input.trim()}
                                className="bg-primary-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:bg-primary-700 disabled:opacity-50 transition-colors shadow-lg shadow-primary-500/30"
                            >
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Routines Management Screen ---
export const RoutinesScreen: React.FC<{ routines: Routine[]; onUpdateRoutines: (r: Routine[]) => void }> = ({ routines, onUpdateRoutines }) => {
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // AI State
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    // Manual Creation/Edit State
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newRoutineName, setNewRoutineName] = useState("");
    const [newExercises, setNewExercises] = useState<{ id?: string, name: string, muscle: string, target?: string }[]>([]);

    // UI State for Builder
    const [builderView, setBuilderView] = useState<'overview' | 'add_exercise'>('overview');
    const [exerciseSearch, setExerciseSearch] = useState("");
    const [activeMuscleFilter, setActiveMuscleFilter] = useState("All");

    const handleAiGenerate = async () => {
        if (!aiPrompt.trim()) return;
        setIsGenerating(true);
        try {
            const generated = await GeminiService.generateRoutine(aiPrompt);
            const newRoutines: Routine[] = generated.map(g => ({
                id: crypto.randomUUID(),
                name: g.name,
                exercises: g.exercises.map(e => ({
                    id: crypto.randomUUID(),
                    name: e.name,
                    muscleGroup: e.muscleGroup,
                    defaultSets: e.sets,
                    defaultReps: e.reps,
                    notes: e.notes
                }))
            }));

            for (const r of newRoutines) {
                await DatabaseService.saveRoutine(r);
            }
            const all = await DatabaseService.getRoutines();
            onUpdateRoutines(all);
            setIsAiModalOpen(false);
            setAiPrompt("");
        } catch (e) {
            alert("Failed to generate.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleEditRoutine = (routine: Routine) => {
        setEditingId(routine.id);
        setNewRoutineName(routine.name);
        setNewExercises(routine.exercises.map(e => ({ id: e.id, name: e.name, muscle: e.muscleGroup })));
        setBuilderView('overview');
        setIsCreateModalOpen(true);
    };

    const handleManualSave = async () => {
        if (!newRoutineName.trim() || newExercises.length === 0) return;

        const routineId = editingId || crypto.randomUUID();

        const newRoutine: Routine = {
            id: routineId,
            name: newRoutineName,
            exercises: newExercises.map(e => ({
                id: e.id || crypto.randomUUID(),
                name: e.name,
                muscleGroup: e.muscle,
                defaultSets: 3,
                defaultReps: 10
            }))
        };

        await DatabaseService.saveRoutine(newRoutine);
        const all = await DatabaseService.getRoutines();
        onUpdateRoutines(all);

        // Reset
        setIsCreateModalOpen(false);
        setEditingId(null);
        setNewRoutineName("");
        setNewExercises([]);
        setBuilderView('overview');
    };

    const addQuickExercise = (name: string, muscle: string, target?: string) => {
        setNewExercises([...newExercises, { name, muscle, target }]);
        setBuilderView('overview'); // Go back after adding
        setExerciseSearch("");
    };

    const handleAddTemplate = async (template: typeof PREDEFINED_TEMPLATES[0]) => {
        const newRoutine: Routine = {
            id: crypto.randomUUID(),
            name: template.name,
            exercises: template.exercises.map(e => ({
                id: crypto.randomUUID(),
                name: e.name,
                muscleGroup: e.muscle,
                defaultSets: 3,
                defaultReps: 10
            }))
        };
        await DatabaseService.saveRoutine(newRoutine);
        const all = await DatabaseService.getRoutines();
        onUpdateRoutines(all);
        setIsTemplateModalOpen(false);
    }

    const confirmDelete = async () => {
        if (!deleteId) return;
        const originalRoutines = [...routines];
        onUpdateRoutines(routines.filter(r => r.id !== deleteId)); // Optimistic

        try {
            const { error } = await DatabaseService.deleteRoutine(deleteId);
            if (error) throw error;
        } catch (e) {
            console.error(e);
            alert("Failed to delete routine. Check permissions.");
            onUpdateRoutines(originalRoutines); // Revert
        } finally {
            setDeleteId(null);
        }
    };

    const handleDeleteClick = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const filteredExercises = () => {
        let result: { name: string, muscle: string, target: string }[] = [];

        // Flatten
        Object.entries(COMMON_EXERCISES).forEach(([muscle, exercises]) => {
            if (activeMuscleFilter === 'All' || activeMuscleFilter === muscle) {
                exercises.forEach(ex => result.push({ name: ex.name, muscle, target: ex.target }));
            }
        });

        // Filter by Search
        if (exerciseSearch) {
            result = result.filter(e => e.name.toLowerCase().includes(exerciseSearch.toLowerCase()));
        }

        return result;
    }

    const updateExerciseName = (index: number, newName: string) => {
        setNewExercises(prev => prev.map((ex, i) => i === index ? { ...ex, name: newName } : ex));
    }

    return (
        <div className="p-4 pb-24 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Workout Routines</h1>

            <div className="grid gap-4 mb-6">
                <Button onClick={() => { setEditingId(null); setNewRoutineName(""); setNewExercises([]); setBuilderView('overview'); setIsCreateModalOpen(true); }} className="w-full bg-gray-900 dark:bg-white dark:text-black hover:opacity-90 py-4">
                    <Plus className="mr-2" size={18} /> Create Custom Plan
                </Button>
                <div className="grid grid-cols-2 gap-4">
                    <Button onClick={() => setIsTemplateModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white py-4" variant="primary">
                        <BookOpen className="mr-2" size={18} /> Templates
                    </Button>
                    <Button onClick={() => setIsAiModalOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-white py-4" variant="primary">
                        <Sparkles className="mr-2" size={18} /> AI Generate
                    </Button>
                </div>
            </div>

            <div className="grid gap-4">
                {routines.map(routine => (
                    <Card key={routine.id} className="p-4 relative group cursor-pointer hover:border-primary-500 transition-colors" onClick={() => handleEditRoutine(routine)}>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                                    {routine.name} <Edit2 size={12} className="opacity-50" />
                                </h3>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {routine.exercises.slice(0, 4).map((e, idx) => (
                                        <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                                            {e.name}
                                        </span>
                                    ))}
                                    {routine.exercises.length > 4 && <span className="text-xs text-gray-400 py-1">+{routine.exercises.length - 4} more</span>}
                                </div>
                            </div>
                            <button onClick={(e) => handleDeleteClick(routine.id, e)} className="p-2 text-gray-400 hover:text-red-500 z-10">
                                <Trash size={18} />
                            </button>
                        </div>
                    </Card>
                ))}
            </div>

            {/* AI Modal */}
            <Modal isOpen={isAiModalOpen} onClose={() => setIsAiModalOpen(false)} title="AI Routine Generator">
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">Describe your goal, and I'll build a full routine for you.</p>
                    <textarea
                        className="w-full h-32 p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                        placeholder="E.g. I want to build a bigger chest and arms. I have 3 days a week."
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                    />
                    <Button
                        onClick={handleAiGenerate}
                        isLoading={isGenerating}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                    >
                        Generate Routine
                    </Button>
                </div>
            </Modal>

            {/* Templates Modal */}
            <Modal isOpen={isTemplateModalOpen} onClose={() => setIsTemplateModalOpen(false)} title="Workout Templates">
                <div className="space-y-4">
                    {PREDEFINED_TEMPLATES.map((tpl, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-dark-card border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex justify-between items-center">
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white">{tpl.name}</h4>
                                <div className="text-xs text-primary-600 dark:text-primary-400 font-semibold mb-1 uppercase tracking-wider">{tpl.goal}</div>
                                <p className="text-xs text-gray-500">{tpl.exercises.map(e => e.name).join(', ')}</p>
                            </div>
                            <Button size="sm" onClick={() => handleAddTemplate(tpl)}>
                                <Copy size={16} />
                            </Button>
                        </div>
                    ))}
                </div>
            </Modal>

            {/* Manual Builder Modal - REDESIGNED */}
            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={editingId ? "Edit Routine" : "Create Routine"}>

                {builderView === 'overview' ? (
                    // VIEW 1: OVERVIEW
                    <div className="space-y-6">
                        <div>
                            <input
                                className="w-full bg-transparent border-b-2 border-gray-200 dark:border-gray-700 py-2 text-2xl font-bold text-gray-900 dark:text-white placeholder-gray-300 focus:border-primary-500 outline-none transition-colors"
                                placeholder="Routine Name (e.g. Chest Day)"
                                value={newRoutineName}
                                onChange={e => setNewRoutineName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="space-y-3">
                            {newExercises.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 bg-gray-50 dark:bg-dark-bg/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-800">
                                    <p>No exercises added yet.</p>
                                    <Button variant="ghost" className="mt-2 text-primary-500" onClick={() => setBuilderView('add_exercise')}>Add your first exercise</Button>
                                </div>
                            ) : (
                                newExercises.map((ex, i) => (
                                    <div key={i} className="flex justify-between items-center bg-white dark:bg-dark-card p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex items-center gap-3 flex-1 mr-4">
                                            <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500 shrink-0">{i + 1}</span>
                                            <div className="flex-1">
                                                <input
                                                    className="font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 outline-none w-full"
                                                    value={ex.name}
                                                    onChange={(e) => updateExerciseName(i, e.target.value)}
                                                />
                                                <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                                                    <span>{ex.muscle}</span>
                                                    {ex.target && (
                                                        <>
                                                            <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                                            <span className="text-primary-600 dark:text-primary-400 font-medium">{ex.target}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => setNewExercises(prev => prev.filter((_, idx) => idx !== i))} className="text-gray-400 hover:text-red-500 p-2"><Trash size={18} /></button>
                                    </div>
                                ))
                            )}

                            <button
                                onClick={() => setBuilderView('add_exercise')}
                                className="w-full py-4 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 font-bold hover:border-primary-500 hover:text-primary-500 transition-colors flex items-center justify-center gap-2"
                            >
                                <Plus size={20} /> Add Exercise
                            </button>
                        </div>

                        <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                            <Button
                                onClick={handleManualSave}
                                className="w-full py-3 text-lg font-bold"
                                disabled={!newRoutineName || newExercises.length === 0}
                            >
                                Save Routine
                            </Button>
                        </div>
                    </div>
                ) : (
                    // VIEW 2: ADD EXERCISE (SELECTOR)
                    <div className="flex flex-col h-[60vh]">
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setBuilderView('overview')} className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                                <ArrowLeft size={20} />
                            </button>
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input
                                    className="w-full pl-9 pr-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-dark-card focus:ring-2 focus:ring-primary-500 outline-none text-sm dark:text-white"
                                    placeholder="Search exercise..."
                                    value={exerciseSearch}
                                    onChange={(e) => setExerciseSearch(e.target.value)}
                                    autoFocus
                                />
                            </div>
                        </div>

                        {/* Muscle Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
                            {['All', ...Object.keys(COMMON_EXERCISES)].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setActiveMuscleFilter(m)}
                                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeMuscleFilter === m
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>

                        {/* List */}
                        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                            {filteredExercises().length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 text-sm mb-3">No exercises found.</p>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => addQuickExercise(exerciseSearch, "Custom", "General")}
                                    >
                                        Create "{exerciseSearch}"
                                    </Button>
                                </div>
                            ) : (
                                filteredExercises().map((ex, i) => (
                                    <button
                                        key={i}
                                        onClick={() => addQuickExercise(ex.name, ex.muscle, ex.target)}
                                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex justify-between items-center group transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700"
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-900 dark:text-white text-sm">{ex.name}</div>
                                            <div className="text-xs text-gray-500 flex gap-2">
                                                <span>{ex.muscle}</span>
                                                <span className="text-primary-500 font-medium">• {ex.target}</span>
                                            </div>
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover:bg-primary-100 group-hover:text-primary-600">
                                            <Plus size={14} />
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </Modal>

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title="Delete Routine?"
                message="This will delete the routine template. Past workout history will not be affected."
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

export const SettingsScreen: React.FC = () => {
    const [profile, setProfile] = useState<UserProfile>({ goal: 'general', targetWeight: 0, height: 0 });
    const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
    const [isClearCacheModalOpen, setIsClearCacheModalOpen] = useState(false);

    useEffect(() => {
        DatabaseService.getUserProfile().then(setProfile);
    }, []);

    const saveProfile = async () => {
        await DatabaseService.saveUserProfile(profile);
        setIsSaveModalOpen(true);
    }

    const handleClearCache = () => {
        localStorage.clear();
        window.location.reload();
    }

    const toggleTheme = () => {
        const isDark = document.documentElement.classList.toggle('dark');
        const settings = DatabaseService.getSettings();
        settings.theme = isDark ? 'dark' : 'light';
        DatabaseService.saveSettings(settings);
    }

    return (
        <div className="p-4 max-w-2xl mx-auto pb-24">
            <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Settings</h1>

            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
                <h3 className="font-bold text-lg mb-4 dark:text-white flex items-center gap-2"><UserCircle size={20} /> Fitness Profile</h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Goal</label>
                        <select
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 dark:text-white"
                            value={profile.goal}
                            onChange={(e) => setProfile({ ...profile, goal: e.target.value as any })}
                        >
                            <option value="hypertrophy">Build Muscle (Hypertrophy)</option>
                            <option value="strength">Increase Strength</option>
                            <option value="weight_loss">Lose Fat / Weight</option>
                            <option value="endurance">Endurance</option>
                            <option value="general">General Fitness</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Height (cm)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 dark:text-white"
                                placeholder="180"
                                value={profile.height || ''}
                                onChange={(e) => setProfile({ ...profile, height: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Weight (kg)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 dark:text-white"
                                value={profile.targetWeight || ''}
                                onChange={(e) => setProfile({ ...profile, targetWeight: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-gray-800 p-4 mb-6">
                <h3 className="font-bold text-lg mb-4 dark:text-white flex items-center gap-2"><Flame size={20} className="text-orange-500" /> Nutrition Goals</h3>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Daily Calories</label>
                            <input
                                type="number"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 dark:text-white"
                                placeholder="2500"
                                value={profile.calorieGoal || ''}
                                onChange={(e) => setProfile({ ...profile, calorieGoal: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Water Goal (ml)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 dark:text-white"
                                placeholder="3000"
                                value={profile.waterGoal || ''}
                                onChange={(e) => setProfile({ ...profile, waterGoal: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Protein (g)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 dark:text-white"
                                value={profile.proteinGoal || ''}
                                onChange={(e) => setProfile({ ...profile, proteinGoal: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Carbs (g)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 dark:text-white"
                                value={profile.carbsGoal || ''}
                                onChange={(e) => setProfile({ ...profile, carbsGoal: parseFloat(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Fats (g)</label>
                            <input
                                type="number"
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-2 dark:text-white"
                                value={profile.fatsGoal || ''}
                                onChange={(e) => setProfile({ ...profile, fatsGoal: parseFloat(e.target.value) })}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <Button onClick={saveProfile} className="w-full" size="lg">Save All Settings</Button>

            <div className="mt-8 bg-white dark:bg-dark-card rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                <div className="p-4 flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-200">Dark Mode</span>
                    <button onClick={toggleTheme} className="bg-gray-200 dark:bg-gray-700 relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none">
                        <span className="translate-x-0 dark:translate-x-5 inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"></span>
                    </button>
                </div>
                <div className="p-4 flex justify-between items-center">
                    <span className="font-medium text-gray-700 dark:text-gray-200">Local Cache</span>
                    <button onClick={() => setIsClearCacheModalOpen(true)} className="text-red-500 text-sm font-bold">CLEAR</button>
                </div>
            </div>

            <ConfirmationModal
                isOpen={isSaveModalOpen}
                onClose={() => setIsSaveModalOpen(false)}
                onConfirm={() => setIsSaveModalOpen(false)}
                title="Profile Saved"
                message="Your settings have been successfully updated."
                confirmText="OK"
                showCancel={false}
            />

            <ConfirmationModal
                isOpen={isClearCacheModalOpen}
                onClose={() => setIsClearCacheModalOpen(false)}
                onConfirm={handleClearCache}
                title="Clear Local Cache?"
                message="This will reset your local app state. Your data saved to the cloud (Supabase) will be safe."
                confirmText="Clear & Reload"
                variant="danger"
            />
        </div>
    )
}