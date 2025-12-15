import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Routine, WorkoutSession, UserProfile, BodyWeightLog, FoodLog, WaterLog } from '../types';
import { DatabaseService } from '../services/databaseService';
import { GeminiService } from '../services/geminiService';
import { Button, Card, Modal, Input, ConfirmationModal } from './Shared';
import { NutritionDashboard } from './Nutrition';
import { Calendar as CalendarIcon, Activity, Plus, Play, Trash, BarChart as BarChartIcon, Sparkles, Send, Edit2, UserCircle, Scale, ChevronLeft, ChevronRight, Search, BookOpen, Copy, ArrowLeft, X, Ruler, TrendingUp, Info, Flame, Droplets, ChevronDown, ChevronUp, Dumbbell, Timer, Home, Settings as SettingsIcon, BarChart3, LogOut, Trash2, Camera, Loader2 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

// --- Constants ---
import { COMMON_EXERCISES, ExerciseDetail } from './exercisesData';

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

// --- Home Screen Components ---

const InsightSection: React.FC<{ lastStats?: { date: number; volume: number; duration: number } }> = ({ lastStats }) => {
    if (!lastStats) return (
        <div className="p-4 rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 flex items-center gap-3 shadow-sm backdrop-blur-sm">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500"><Sparkles size={16} fill="currentColor" /></div>
            <div>
                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest leading-tight">Coach Tip</p>
                <p className="text-xs font-bold text-slate-700 dark:text-gray-200 leading-tight mt-0.5">Consistency beats intensity.</p>
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 shadow-sm backdrop-blur-sm">
                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Last Session</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{Math.round(lastStats.duration / 60)}</span>
                    <span className="text-xs text-gray-500">min</span>
                </div>
            </div>
            <div className="p-3 rounded-xl bg-white/60 dark:bg-white/5 border border-white/40 dark:border-white/5 shadow-sm backdrop-blur-sm">
                <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">Volume</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-lg font-black text-slate-900 dark:text-white">{(lastStats.volume / 1000).toFixed(1)}k</span>
                    <span className="text-xs font-bold text-slate-500 dark:text-gray-500">kg</span>
                </div>
            </div>
        </div>
    );
};

const HeroCard: React.FC<{ routine: Routine; onStart: () => void }> = ({ routine, onStart }) => {
    return (
        <div className="relative overflow-hidden rounded-[2.5rem] p-1 transition-all duration-300 group ring-1 ring-black/5 dark:ring-white/10">
            {/* Backgrounds */}
            <div className="absolute inset-0 bg-[#f0f9ff] dark:bg-gradient-to-br dark:from-[#1a1a1a] dark:to-[#0a0a0a] transition-colors" />

            {/* Glow Effects */}
            <div className="absolute -top-32 -right-32 w-80 h-80 bg-blue-500/10 dark:bg-primary-500/20 rounded-full blur-3xl transition-opacity pointer-events-none" />

            <div className="relative h-full rounded-[2.3rem] p-7 flex flex-col justify-between
                bg-transparent
            ">
                <div className="flex justify-between items-start mb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 dark:bg-white/5 border border-blue-100 dark:border-white/10 shadow-sm backdrop-blur-sm">
                        <span className="w-2 h-2 rounded-full bg-blue-500 dark:bg-primary-500 animate-pulse" />
                        <span className="text-[11px] font-black text-blue-900 dark:text-white uppercase tracking-widest">Today's Workout</span>
                    </div>
                    {routine.lastPerformed && (
                        <span className="text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-1">
                            Last: {new Date(routine.lastPerformed).toLocaleDateString(undefined, { weekday: 'short' })}
                        </span>
                    )}
                </div>

                <div className="mb-6">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-[0.95] mb-3 tracking-tighter">
                        {routine.name}
                    </h2>
                    <div className="flex gap-4 text-xs font-bold text-slate-500 dark:text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><Activity size={14} className="text-blue-500" /> {routine.exercises.length} Exercises</span>
                        <span className="flex items-center gap-1.5"><Timer size={14} className="text-indigo-500" /> ~{routine.exercises.length * 5} min</span>
                    </div>
                </div>

                <div className="mb-6">
                    <InsightSection lastStats={routine.lastPerformed ? { date: routine.lastPerformed, volume: 12500, duration: 3200 } : undefined} />
                </div>

                <button
                    onClick={onStart}
                    className="w-full relative overflow-hidden rounded-2xl bg-slate-900 dark:bg-primary-600 text-white font-black text-lg py-4 shadow-xl shadow-slate-900/20 dark:shadow-primary-600/40 group-hover:scale-[1.02] active:scale-[0.98] transition-all transform will-change-transform"
                >
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                    <div className="relative flex items-center justify-center gap-3">
                        <Play fill="currentColor" size={22} /> START SESSION
                    </div>
                </button>
            </div>
        </div>
    );
};

const MetricCard: React.FC<{
    label: string;
    value: string | number;
    unit?: string;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    onClick?: () => void;
}> = ({ label, value, unit, icon: Icon, trend, onClick }) => (
    <button onClick={onClick} className="flex-1 relative overflow-hidden rounded-3xl p-5 transition-all active:scale-[0.98] text-left group
        bg-white shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-transparent hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)]
        dark:bg-[#121212] dark:border-white/5 dark:shadow-none dark:hover:bg-[#1a1a1a]
    ">
        <div className="absolute top-5 right-5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 dark:text-gray-600">
            <Edit2 size={14} />
        </div>

        <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-gray-400 group-hover:text-blue-500 transition-colors">
                <Icon size={20} strokeWidth={2} />
            </div>
            {trend && (
                <div className={`text-[10px] font-bold px-2 py-1 rounded-full ${trend === 'down' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400'}`}>
                    {trend === 'down' ? '↓' : '↑'}
                </div>
            )}
        </div>
        <div>
            <div className="text-[11px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mb-1">{label}</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {value} <span className="text-sm font-bold text-slate-400 dark:text-gray-600 ml-0.5">{unit}</span>
            </div>
        </div>
    </button>
);

const HydrationCard: React.FC<{ logs: WaterLog[]; onAdd: (amount: number) => void }> = ({ logs, onAdd }) => {
    const today = new Date().toISOString().split('T')[0];
    const todayTotal = logs.filter(l => l.date === today).reduce((acc, l) => acc + l.amount, 0);
    const goal = 3000;
    const percentage = Math.min(100, Math.round((todayTotal / goal) * 100));

    return (
        <div className="rounded-[2.5rem] p-1 mb-8
            bg-white shadow-sm border border-slate-100
            dark:bg-[#121212] dark:shadow-none dark:border-white/5
        ">
            <div className="p-6">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                            <Droplets size={18} className="text-cyan-500" fill="currentColor" /> Hydration
                        </h3>
                        <p className="text-xs text-slate-400 dark:text-gray-500 font-bold mt-1 tracking-wide">Daily Goal: 3000ml</p>
                    </div>
                    {/* Ring */}
                    <div className="relative w-16 h-16 flex items-center justify-center">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-white/5" />
                            <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={163} strokeDashoffset={163 - (percentage / 100) * 163} className="text-cyan-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase">Today</span>
                            <span className="text-xs font-black text-slate-900 dark:text-white">{percentage}%</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => onAdd(250)} className="flex-[2] py-4 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-sm font-bold shadow-lg shadow-cyan-500/25 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                        <Plus size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> Add 250ml
                    </button>
                    <button onClick={() => onAdd(500)} className="flex-1 py-4 px-4 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-gray-400 text-xs font-bold hover:bg-slate-100 dark:hover:bg-white/10 active:scale-[0.98] transition-all">
                        +500ml
                    </button>
                </div>
            </div>
        </div>
    );
};

const NutritionCard: React.FC<{ logs: FoodLog[]; onLogReq: () => void; profile: UserProfile | null; onRefresh: () => void }> = ({ logs, onLogReq, profile, onRefresh }) => {
    const today = new Date().toISOString().split('T')[0];
    const todayLogs = logs.filter(l => l.date === today);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const totals = todayLogs.reduce((acc, log) => ({
        calories: acc.calories + log.calories,
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fats: acc.fats + log.fats
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });

    const goals = {
        calories: profile?.calorieGoal || 2500,
        protein: profile?.proteinGoal || 150,
        carbs: profile?.carbsGoal || 250,
        fats: profile?.fatsGoal || 70
    };

    const [scanResult, setScanResult] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedMealType, setSelectedMealType] = useState<string>('Lunch'); // Default meal type

    const calPct = Math.min(100, Math.round((totals.calories / goals.calories) * 100));

    // Handle File Upload
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Set preview directly
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);

        setIsAnalyzing(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                const result = await GeminiService.analyzeFoodImage(base64);
                if (result) {
                    setScanResult(result);
                    setIsReviewOpen(true);
                }
                setIsAnalyzing(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error("Scan failed", error);
            setIsAnalyzing(false);
        }
    };

    const confirmScan = async () => {
        if (!scanResult || !scanResult.items) return;

        for (const item of scanResult.items) {
            await DatabaseService.addFoodLog({
                date: new Date().toISOString().split('T')[0],
                mealType: selectedMealType as any,
                foodName: item.food_name,
                calories: item.calories,
                protein: item.protein,
                carbs: item.carbs,
                fats: item.fats,
                quantity: item.quantity || 1,
                unit: item.unit || 'serving',
                notes: scanResult.notes
            });
        }

        setIsReviewOpen(false);
        setScanResult(null);
        setPreviewUrl(null);
        setIsReviewOpen(false);
        setScanResult(null);
        setPreviewUrl(null);
        onRefresh();
    };

    // Calculate totals for Review Modal
    const reviewTotals = scanResult?.items?.reduce((acc: any, item: any) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fats: acc.fats + (item.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 }) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

    // Mini Component for Macro
    const MacroItem = ({ label, value, goal, color }: any) => (
        <div className="flex flex-col items-center">
            <div className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-1">{label}</div>
            <div className="text-sm font-black text-slate-900 dark:text-white">{value}g</div>
            <div className="w-12 h-1 bg-slate-100 dark:bg-white/10 rounded-full mt-1 overflow-hidden">
                <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(100, (value / goal) * 100)}%` }} />
            </div>
        </div>
    );

    return (
        <>
            <div className="rounded-[2.5rem] p-1 mb-6
            bg-white shadow-sm border border-slate-100
            dark:bg-[#121212] dark:shadow-none dark:border-white/5
        ">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-wide">
                                <Flame size={18} className="text-orange-500" fill="currentColor" /> Nutrition
                            </h3>
                            <p className="text-xs text-slate-400 dark:text-gray-500 font-bold mt-1 tracking-wide">Fuel your body</p>
                        </div>
                        <div className="flex gap-2">
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileSelect}
                            />
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isAnalyzing}
                                className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-500 hover:bg-orange-100 dark:hover:bg-orange-500/20 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 mb-6">
                        {/* Ring */}
                        <div className="relative w-24 h-24 flex-shrink-0">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100 dark:text-white/5" />
                                <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={251} strokeDashoffset={251 - (calPct / 100) * 251} className="text-orange-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{totals.calories}</span>
                                <span className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase">/ {goals.calories}</span>
                            </div>
                        </div>

                        {/* Macros Grid */}
                        <div className="flex-1 grid grid-cols-3 gap-2">
                            <MacroItem label="Prot" value={Math.round(totals.protein)} goal={goals.protein} color="bg-blue-500" />
                            <MacroItem label="Carb" value={Math.round(totals.carbs)} goal={goals.carbs} color="bg-emerald-500" />
                            <MacroItem label="Fat" value={Math.round(totals.fats)} goal={goals.fats} color="bg-purple-500" />
                        </div>
                    </div>

                    <button onClick={onLogReq} className="w-full py-3.5 rounded-xl bg-slate-900 dark:bg-white/10 hover:bg-black dark:hover:bg-white/20 text-white text-sm font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group">
                        <Plus size={18} strokeWidth={3} className="text-white/50" /> Log Meal Manually
                    </button>
                </div>
            </div>

            {/* Scan Review Modal */}
            <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title="Review Scan">
                {scanResult && scanResult.items && (
                    <div className="space-y-4">
                        {previewUrl && (
                            <div className="relative h-48 bg-black rounded-2xl overflow-hidden mb-4">
                                <img src={previewUrl} alt="Scan" className="w-full h-full object-contain" />
                                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-xs p-2 text-center backdrop-blur-sm">
                                    {scanResult.notes}
                                </div>
                            </div>
                        )}

                        {/* Meal Type Selector */}
                        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-white/5 rounded-lg">
                            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedMealType(type)}
                                    className={`flex-1 py-1 px-2 text-xs font-bold rounded-md transition-all ${selectedMealType === type
                                        ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600 dark:text-emerald-400'
                                        : 'text-gray-500 hover:text-gray-700'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Totals Summary */}
                        <div className="flex justify-between bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/30">
                            <div className="text-center">
                                <div className="text-[10px] text-gray-500 uppercase font-bold">Total Cals</div>
                                <div className="text-lg font-black text-emerald-700 dark:text-emerald-400">{reviewTotals.calories}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[10px] text-gray-500 uppercase font-bold">Protein</div>
                                <div className="text-sm font-bold text-blue-600 dark:text-blue-400">{reviewTotals.protein}g</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[10px] text-gray-500 uppercase font-bold">Carbs</div>
                                <div className="text-sm font-bold text-green-600 dark:text-green-400">{reviewTotals.carbs}g</div>
                            </div>
                            <div className="text-center">
                                <div className="text-[10px] text-gray-500 uppercase font-bold">Fats</div>
                                <div className="text-sm font-bold text-purple-600 dark:text-purple-400">{reviewTotals.fats}g</div>
                            </div>
                        </div>

                        <div className="max-h-[50vh] overflow-y-auto space-y-3 pr-1">
                            {scanResult.items.map((item: any, idx: number) => (
                                <div key={idx} className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                                    <div className="flex justify-between items-start mb-2">
                                        <input
                                            className="bg-transparent border-none font-bold text-gray-900 dark:text-white w-full focus:ring-0 p-0"
                                            value={item.food_name}
                                            onChange={(e) => {
                                                const newItems = [...scanResult.items];
                                                newItems[idx].food_name = e.target.value;
                                                setScanResult({ ...scanResult, items: newItems });
                                            }}
                                        />
                                        <button
                                            onClick={() => {
                                                const newItems = scanResult.items.filter((_: any, i: number) => i !== idx);
                                                setScanResult({ ...scanResult, items: newItems });
                                            }}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-4 gap-2">
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-400 uppercase block">Cals</label>
                                            <input
                                                type="number"
                                                className="w-full bg-transparent p-0 text-sm font-black"
                                                value={item.calories}
                                                onChange={(e) => {
                                                    const newItems = [...scanResult.items];
                                                    newItems[idx].calories = parseFloat(e.target.value) || 0;
                                                    setScanResult({ ...scanResult, items: newItems });
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-blue-500 uppercase block">Pro</label>
                                            <input
                                                type="number"
                                                className="w-full bg-transparent p-0 text-sm font-bold"
                                                value={item.protein}
                                                onChange={(e) => {
                                                    const newItems = [...scanResult.items];
                                                    newItems[idx].protein = parseFloat(e.target.value) || 0;
                                                    setScanResult({ ...scanResult, items: newItems });
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-green-500 uppercase block">Carb</label>
                                            <input
                                                type="number"
                                                className="w-full bg-transparent p-0 text-sm font-bold"
                                                value={item.carbs}
                                                onChange={(e) => {
                                                    const newItems = [...scanResult.items];
                                                    newItems[idx].carbs = parseFloat(e.target.value) || 0;
                                                    setScanResult({ ...scanResult, items: newItems });
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-purple-500 uppercase block">Fat</label>
                                            <input
                                                type="number"
                                                className="w-full bg-transparent p-0 text-sm font-bold"
                                                value={item.fats}
                                                onChange={(e) => {
                                                    const newItems = [...scanResult.items];
                                                    newItems[idx].fats = parseFloat(e.target.value) || 0;
                                                    setScanResult({ ...scanResult, items: newItems });
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button variant="ghost" onClick={() => setIsReviewOpen(false)} className="flex-1">Discard</Button>
                            <Button onClick={confirmScan} className="flex-1 bg-orange-500 hover:bg-orange-600">Save All Logs</Button>
                        </div>
                    </div>
                )}
            </Modal>
        </>
    );
};

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
    // Local State
    const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
    const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);

    // Modals
    const [isWeightModalOpen, setIsWeightModalOpen] = useState(false);
    const [inputWeight, setInputWeight] = useState('');

    useEffect(() => {
        DatabaseService.getAllWaterLogs().then(setWaterLogs);
        DatabaseService.getFoodLogs(new Date().toISOString().split('T')[0]).then(setFoodLogs);
    }, [onRefresh]); // Simple refresh trigger

    const handleAddWater = async (amount: number) => {
        const today = new Date().toISOString().split('T')[0];
        await DatabaseService.logWater(amount, today);
        const updated = await DatabaseService.getAllWaterLogs();
        setWaterLogs(updated);
    };

    const handleSaveWeight = async () => {
        if (!inputWeight) return;
        const w = parseFloat(inputWeight);
        if (!isNaN(w)) {
            await DatabaseService.logWeight(w, new Date().toISOString().split('T')[0]);
            setIsWeightModalOpen(false);
            setInputWeight('');
            onRefresh();
        }
    };

    // Derived Data
    const sortedRoutines = [...routines].sort((a, b) => (a.lastPerformed || 0) - (b.lastPerformed || 0));
    const nextRoutine = sortedRoutines[0];
    const otherRoutines = sortedRoutines.slice(1);

    const bmi = (userProfile?.height && latestWeight)
        ? (latestWeight / Math.pow(userProfile.height / 100, 2)).toFixed(1)
        : '--';

    return (
        <div className="min-h-screen bg-[#F6F8FC] dark:bg-[#09090b] pb-32 transition-colors duration-500">
            {/* Header */}
            <header className="px-6 pt-10 pb-6 flex justify-between items-center bg-[#F6F8FC]/80 dark:bg-[#09090b]/80 backdrop-blur-xl sticky top-0 z-20">
                <div>
                    <h1 className="text-3xl font-black italic tracking-tighter text-slate-900 dark:text-white">GYMPRO</h1>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                        {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div
                    onClick={() => window.location.hash = '#settings'}
                    className="w-11 h-11 rounded-full bg-white dark:bg-white/10 flex items-center justify-center text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/20 transition-all cursor-pointer shadow-sm border border-slate-100 dark:border-transparent"
                >
                    <UserCircle size={22} className="opacity-80" />
                </div>
            </header>

            <div className="px-5 space-y-8">
                {/* Active Session Banner */}
                {activeSession && (
                    <div className="bg-green-500 text-white p-4 rounded-2xl shadow-lg flex justify-between items-center mb-6 animate-in slide-in-from-top-5">
                        <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-white animate-pulse"></div>
                            <span className="font-bold">Workout in Progress</span>
                        </div>
                        <Button size="sm" variant="secondary" onClick={() => onResume(activeSession)} className="bg-white/90 text-green-700 hover:bg-white text-xs py-1 px-3 h-8">
                            Resume
                        </Button>
                    </div>
                )}

                {/* Hero Card */}
                {nextRoutine ? (
                    <HeroCard routine={nextRoutine} onStart={() => onStartWorkout(nextRoutine)} />
                ) : (
                    <div className="text-center py-12 bg-white dark:bg-dark-card rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800 mb-6">
                        <p className="text-gray-400 font-medium mb-4">No routines found</p>
                        <Button onClick={() => window.location.hash = '#workouts'}>Create Routine</Button>
                    </div>
                )}


                {/* Metrics Grid */}
                <div>
                    <div className="flex gap-4 mb-6">
                        <MetricCard
                            label="Weight"
                            value={latestWeight || '--'}
                            unit="kg"
                            icon={Scale}
                            trend="neutral"
                            color="bg-purple-100 text-purple-600"
                            onClick={() => setIsWeightModalOpen(true)}
                        />
                        <MetricCard
                            label="BMI"
                            value={bmi || '--'}
                            icon={Ruler}
                            color="bg-emerald-100 text-emerald-600"
                        />
                    </div>

                    {/* Nutrition & Hydration Stack */}
                    <div className="space-y-6">
                        <NutritionCard
                            logs={foodLogs}
                            profile={userProfile}
                            onLogReq={() => window.location.hash = '#nutrition'}
                            onRefresh={onRefresh}
                        />
                        <HydrationCard logs={waterLogs} onAdd={handleAddWater} />
                    </div>
                </div>

                {/* Other Routines */}
                {otherRoutines.length > 0 && (
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 ml-1">Other Routines</h3>
                        <div className="space-y-3">
                            {otherRoutines.map(routine => (
                                <div key={routine.id} className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center group active:scale-[0.98] transition-all">
                                    <div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{routine.name}</h4>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {routine.exercises.length} Exercises • {routine.lastPerformed ? `Last: ${new Date(routine.lastPerformed).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : 'Never'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onStartWorkout(routine)}
                                        className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-400 group-hover:bg-primary-500 group-hover:text-white flex items-center justify-center transition-colors"
                                    >
                                        <Play size={14} fill="currentColor" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Weight Logging Modal */}
            <Modal isOpen={isWeightModalOpen} onClose={() => setIsWeightModalOpen(false)} title="Log Weight">
                <div className="space-y-4">
                    <div className="flex justify-center py-4">
                        <div className="w-20 h-20 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400">
                            <Scale size={32} />
                        </div>
                    </div>
                    <Input
                        type="number"
                        placeholder="Current Weight (kg)"
                        value={inputWeight}
                        onChange={e => setInputWeight(e.target.value)}
                        autoFocus
                        className="text-center text-2xl font-bold py-4"
                    />
                    <Button onClick={handleSaveWeight} className="w-full h-12 text-lg">Update Weight</Button>
                </div>
            </Modal>
        </div>
    );
};
// --- Calendar/History Screen ---
export const CalendarScreen: React.FC<{ onEditSession: (session: WorkoutSession) => void }> = ({ onEditSession }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

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
                    {displayedSessions.map(session => {
                        const isExpanded = expandedSessionId === session.id;
                        return (
                            <div key={session.id} className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-800 pb-6 last:pb-0">
                                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary-500 border-4 border-white dark:border-dark-bg"></div>
                                <div className="mb-1 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    {new Date(session.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <Card className={`p-0 overflow-hidden transition-all duration-300 ${isExpanded ? 'ring-2 ring-primary-500' : ''}`} onClick={() => setExpandedSessionId(isExpanded ? null : session.id)}>
                                    <div className="p-4 flex justify-between items-start cursor-pointer">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{session.routineName}</h3>
                                            <div className="flex gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                                                <span>⏱ {Math.floor(session.durationSeconds / 60)}m</span>
                                                <span>⚖️ {session.totalVolume}kg</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isExpanded ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                            {isExpanded && (
                                                <button onClick={(e) => { e.stopPropagation(); onEditSession(session); }} className="text-gray-400 hover:text-blue-500 p-2 z-10 transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                            )}
                                            <button onClick={(e) => handleDeleteClick(session.id, e)} className="text-gray-400 hover:text-red-500 p-2 z-10"><Trash size={16} /></button>
                                        </div>
                                    </div>

                                    {session.bodyWeight && <div className="px-4 text-xs text-purple-500 font-semibold mb-2">Body Weight: {session.bodyWeight}kg</div>}

                                    {isExpanded && (
                                        <div className="px-4 pb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                                            <div className="border-t border-gray-100 dark:border-gray-800 pt-3 space-y-3">
                                                {session.exercises.map((ex, i) => (
                                                    <div key={i} className="text-sm">
                                                        <div className="font-bold text-gray-800 dark:text-gray-200 mb-1">{ex.name}</div>
                                                        <div className="flex flex-wrap gap-2">
                                                            {ex.sets.filter(s => s.completed).map((set, j) => (
                                                                <span key={j} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded text-xs font-mono">
                                                                    {set.weight}kg x {set.reps}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!isExpanded && (
                                        <div className="bg-gray-50 dark:bg-dark-bg/50 px-4 py-2 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500 flex justify-between items-center">
                                            <span>{session.exercises.length} Exercises Completed</span>
                                            <span className="text-primary-500 font-medium">View Details</span>
                                        </div>
                                    )}
                                </Card>
                            </div>
                        );
                    })}
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
        <div className="flex flex-col h-[calc(100dvh-env(safe-area-inset-top))] max-w-2xl mx-auto relative">
            {/* Header Tabs */}
            <div className="flex p-2 bg-gray-50/80 dark:bg-dark-bg/80 backdrop-blur-xl z-20 border-b border-gray-100 dark:border-white/5 sticky top-0">
                <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-xl w-full">
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
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                {view === 'analytics' ? (
                    <div className="h-full overflow-y-auto p-4 pb-32">
                        <AnalyticsView />
                    </div>
                ) : (
                    <div className="flex flex-col h-full bg-slate-50 dark:bg-dark-bg relative">
                        {/* Messages Container */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-[130px]"> {/* Padding for input + nav */}
                            {messages.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed shadow-sm ${msg.role === 'user'
                                        ? 'bg-primary-600 text-white rounded-br-none'
                                        : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-800 text-gray-800 dark:text-gray-200 rounded-bl-none'
                                        }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-dark-card p-4 rounded-2xl rounded-bl-none shadow-sm border border-gray-100 dark:border-gray-800">
                                        <div className="flex gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div ref={scrollRef} />
                        </div>

                        {/* Input Area - Fixed relative to bottom nav */}
                        <div className="absolute w-full left-0 z-20 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-dark-card p-2 backdrop-blur-xl pb-2"
                            style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
                        >
                            <div className="flex gap-2 items-end max-w-2xl mx-auto">
                                <textarea
                                    className="flex-1 bg-gray-100 dark:bg-gray-800/50 border-0 rounded-2xl px-4 py-3 text-sm focus:ring-0 outline-none dark:text-white resize-none max-h-32 min-h-[48px]"
                                    placeholder="Ask IronCoach..."
                                    rows={1}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSend();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={isLoading || !input.trim()}
                                    className="bg-primary-600 hover:bg-primary-700 text-white w-12 h-12 rounded-full flex items-center justify-center disabled:opacity-50 disabled:bg-gray-300 transition-all shadow-lg active:scale-90 shrink-0 mb-px"
                                >
                                    <Send size={20} fill="currentColor" />
                                </button>
                            </div>
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
