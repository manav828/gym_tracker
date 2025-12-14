import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Input, Modal, ConfirmationModal } from './Shared';
import { Plus, Search, Trash2, Droplets, Flame, X, Edit2, ChevronLeft, ChevronRight, Calendar, ArrowLeft, Camera, Loader2, Apple, ChevronDown } from 'lucide-react';
import { DatabaseService } from '../services/databaseService';
import { GeminiService } from '../services/geminiService';
import { FoodItem, FoodLog, UserProfile, WaterLog } from '../types';

// Static Food Database (Common Items)
const STATIC_FOODS: FoodItem[] = [
    { name: "Rice (Cooked)", calories: 130, protein: 2.7, carbs: 28, fats: 0.3, servingSize: "100g" },
    { name: "Roti / Chapati", calories: 104, protein: 3, carbs: 18, fats: 3, servingSize: "1 medium" },
    { name: "Chicken Breast (Cooked)", calories: 165, protein: 31, carbs: 0, fats: 3.6, servingSize: "100g" },
    { name: "Egg (Boiled)", calories: 70, protein: 6, carbs: 0.5, fats: 5, servingSize: "1 large" },
    { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fats: 0.3, servingSize: "1 medium" },
    { name: "Milk (Whole)", calories: 150, protein: 8, carbs: 12, fats: 8, servingSize: "250ml" },
    { name: "Whey Protein", calories: 120, protein: 24, carbs: 3, fats: 1, servingSize: "1 scoop" },
    { name: "Paneer (Raw)", calories: 265, protein: 18, carbs: 1.2, fats: 20, servingSize: "100g" },
    { name: "Dal (Cooked)", calories: 100, protein: 5, carbs: 14, fats: 2, servingSize: "1 small bowl" },
    { name: "Dosa (Plain)", calories: 133, protein: 3, carbs: 23, fats: 3, servingSize: "1 medium" },
    { name: "Bread (White)", calories: 79, protein: 2.7, carbs: 15, fats: 1, servingSize: "1 slice" },
    { name: "Bread (Whole Wheat)", calories: 80, protein: 4, carbs: 13, fats: 1, servingSize: "1 slice" },
    { name: "Oats (Cooked)", calories: 71, protein: 2.5, carbs: 12, fats: 1.5, servingSize: "100g" },
    { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fats: 0.3, servingSize: "1 medium" },
    { name: "Peanut Butter", calories: 188, protein: 8, carbs: 6, fats: 16, servingSize: "2 tbsp" },
    { name: "Yogurt / Curd", calories: 60, protein: 3.5, carbs: 4.7, fats: 3.3, servingSize: "100g" },
    { name: "Almonds", calories: 164, protein: 6, carbs: 6, fats: 14, servingSize: "30g" }
];


interface NutritionDashboardProps {
    profile: UserProfile;
    refreshTrigger: number; // Increment to force refresh
}

export const NutritionDashboard: React.FC<NutritionDashboardProps> = ({ profile, refreshTrigger }) => {
    const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
    const [waterLogs, setWaterLogs] = useState<WaterLog[]>([]);
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<FoodLog | undefined>(undefined);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Derived Stats
    const totalCalories = foodLogs.reduce((acc, log) => acc + log.calories, 0);
    const totalProtein = foodLogs.reduce((acc, log) => acc + log.protein, 0);
    const totalCarbs = foodLogs.reduce((acc, log) => acc + log.carbs, 0);
    const totalFats = foodLogs.reduce((acc, log) => acc + log.fats, 0);
    const totalWater = waterLogs.reduce((acc, log) => acc + log.amount, 0);

    const goals = {
        calories: profile.calorieGoal || 2500,
        protein: profile.proteinGoal || 150,
        carbs: profile.carbsGoal || 250,
        fats: profile.fatsGoal || 70,
        water: profile.waterGoal || 3000
    };

    useEffect(() => {
        loadData();
    }, [refreshTrigger]);

    const loadData = async () => {
        const today = new Date().toISOString().split('T')[0];
        const foods = await DatabaseService.getFoodLogs(today);
        const waters = await DatabaseService.getWaterLogs(today);
        setFoodLogs(foods);
        setWaterLogs(waters);
    };

    const handleAddWater = async (amount: number) => {
        const today = new Date().toISOString().split('T')[0];
        await DatabaseService.logWater(amount, today);
        loadData();
    };

    const handleDeleteLog = async () => {
        if (!deleteId) return;
        await DatabaseService.deleteFoodLog(deleteId);
        setDeleteId(null);
        loadData();
    };

    const handleEditClick = (log: FoodLog) => {
        setEditingLog(log);
        setIsFoodModalOpen(true);
    };

    const ProgressBar = ({ current, max, color, label, unit = "g" }: any) => {
        const percent = Math.min((current / max) * 100, 100);
        return (
            <div className="mb-2">
                <div className="flex justify-between text-xs mb-1 font-semibold text-gray-700 dark:text-gray-300">
                    <span>{label}</span>
                    <span>{Math.round(current)} / {max}{unit}</span>
                </div>
                <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
        );
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

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
                mealType: 'Snack',
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
        loadData();
    };

    return (
        <div className="space-y-4">
            {/* Main Nutrition Card */}
            <Card className="p-5 border border-emerald-100 dark:border-emerald-900/30 shadow-sm bg-white dark:bg-dark-card">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Flame className="text-orange-500" fill="currentColor" /> Nutrition
                        </h2>
                        <p className="text-sm text-slate-400 dark:text-gray-500 font-bold uppercase tracking-wider">Daily Tracker</p>
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                        />
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()} disabled={isAnalyzing}>
                            {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                        </Button>
                        <Button onClick={() => setIsFoodModalOpen(true)}>
                            <Plus size={20} /> Add Food
                        </Button>
                    </div>
                </div>
                <Button size="sm" variant="outline" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-400 dark:hover:bg-emerald-900/20" onClick={() => window.location.hash = '#nutrition'}>
                    View Details
                </Button>

                <div className="flex items-center justify-between">
                    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                            <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                            <circle cx="56" cy="56" r="46" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={289} strokeDashoffset={289 - (Math.min(totalCalories / goals.calories, 1) * 289)} className="text-emerald-500 transition-all duration-1000" strokeLinecap="round" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white leading-none">{Math.round(totalCalories)}</span>
                            <span className="text-[10px] uppercase font-bold text-gray-400 mt-1">kcal</span>
                        </div>
                    </div>
                    <div className="flex-1 ml-8 space-y-3">
                        <ProgressBar label="Protein" current={totalProtein} max={goals.protein} color="bg-emerald-500" />
                        <ProgressBar label="Carbs" current={totalCarbs} max={goals.carbs} color="bg-blue-500" />
                        <ProgressBar label="Fats" current={totalFats} max={goals.fats} color="bg-amber-500" />
                    </div>
                </div>
            </Card>

            {/* Water Tracker */}
            <Card className="p-5 bg-blue-50/50 dark:bg-blue-900/5 border-blue-100 dark:border-blue-900/20">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                        <span className="p-1 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Droplets size={16} className="text-blue-500" fill="currentColor" />
                        </span>
                        Hydration
                    </h3>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-300">{totalWater} <span className="text-blue-300 dark:text-blue-500 font-normal">/ {goals.water} ml</span></span>
                </div>
                <div className="h-3 w-full bg-blue-100 dark:bg-blue-900/30 rounded-full overflow-hidden mb-4">
                    <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${Math.min((totalWater / goals.water) * 100, 100)}%` }}></div>
                </div>
                <div className="flex gap-2 justify-between">
                    <button onClick={() => handleAddWater(250)} className="flex-1 py-2.5 bg-white dark:bg-dark-card rounded-xl text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800 shadow-sm active:scale-95 transition-all hover:border-blue-300">+250ml</button>
                    <button onClick={() => handleAddWater(500)} className="flex-1 py-2.5 bg-white dark:bg-dark-card rounded-xl text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800 shadow-sm active:scale-95 transition-all hover:border-blue-300">+500ml</button>
                    <button onClick={() => { const amt = prompt("Enter ml:"); if (amt) handleAddWater(parseFloat(amt)); }} className="flex-1 py-2.5 bg-white dark:bg-dark-card rounded-xl text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800 shadow-sm active:scale-95 transition-all hover:border-blue-300">Custom</button>
                </div>
            </Card>

            <FoodLoggerModal
                isOpen={isFoodModalOpen}
                onClose={() => { setIsFoodModalOpen(false); loadData(); }}
                editingLog={editingLog}
            />

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeleteLog}
                title="Delete Meal?"
                message="Are you sure you want to remove this meal entry?"
                confirmText="Delete"
                variant="danger"
            />

            {/* Scan Review Modal */}
            <Modal isOpen={isReviewOpen} onClose={() => setIsReviewOpen(false)} title="Review Scan">
                {scanResult && scanResult.items && (
                    <div className="space-y-4">
                        <div className="relative h-32 bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden flex items-center justify-center mb-4">
                            <Camera size={48} className="text-gray-300 dark:text-gray-600" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-xs p-2 text-center backdrop-blur-sm">
                                {scanResult.notes}
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
        </div>
    );
};

// --- Nutrition Screen (Full Page) ---

interface NutritionScreenProps {
    profile: UserProfile;
}

export const NutritionScreen: React.FC<NutritionScreenProps> = ({ profile }) => {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);
    const [isFoodModalOpen, setIsFoodModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState<FoodLog | undefined>(undefined);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Scanning State
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [scanResult, setScanResult] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [selectedMealType, setSelectedMealType] = useState<string>('Lunch'); // Default meal type

    // Collapsible state
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    // Batch Edit State
    const [editingGroup, setEditingGroup] = useState<{ type: string, items: FoodLog[] } | null>(null);
    const [editDeleteIds, setEditDeleteIds] = useState<Set<string>>(new Set());
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    // Auto-suggest meal type based on time
    useEffect(() => {
        const hour = new Date().getHours();
        let suggested = 'Snack';
        if (hour >= 5 && hour < 11) suggested = 'Breakfast';
        else if (hour >= 11 && hour < 16) suggested = 'Lunch';
        else if (hour >= 16 && hour < 19) suggested = 'Snack';
        else if (hour >= 19 && hour < 23) suggested = 'Dinner';
        setSelectedMealType(suggested);
        // Also set for manual modal if accessible 
        // (This effect runs on mount, so it sets initial state)
    }, []);

    const loadData = async () => {
        const foods = await DatabaseService.getFoodLogs(selectedDate);
        setFoodLogs(foods);
    };

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
                date: selectedDate,
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
        loadData();
    };

    // Calculate totals for Review Modal
    const reviewTotals = scanResult?.items?.reduce((acc: any, item: any) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fats: acc.fats + (item.fats || 0)
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 }) || { calories: 0, protein: 0, carbs: 0, fats: 0 };

    const handleDeleteLog = async () => {
        if (!deleteId) return;
        await DatabaseService.deleteFoodLog(deleteId);
        setDeleteId(null);
        loadData();
    };

    const handleBatchSave = async () => {
        if (!editingGroup) return;

        // 1. Process Deletions
        for (const id of Array.from(editDeleteIds) as string[]) {
            await DatabaseService.deleteFoodLog(id);
        }

        // 2. Process Updates / Moves
        const itemsToSave = editingGroup.items.filter(item => !editDeleteIds.has(item.id));
        for (const item of itemsToSave) {
            if (item.id) {
                await DatabaseService.updateFoodLog({
                    ...item,
                    mealType: editingGroup.type as any
                });
            }
        }

        setEditingGroup(null);
        setEditDeleteIds(new Set());
        loadData();
    };

    // Calculate totals for Selected Date
    const totals = foodLogs.reduce((acc, log) => ({
        cal: acc.cal + log.calories,
        pro: acc.pro + log.protein,
        carb: acc.carb + log.carbs,
        fat: acc.fat + log.fats
    }), { cal: 0, pro: 0, carb: 0, fat: 0 });

    const HorizontalCalendar = () => {
        const scrollRef = useRef<HTMLDivElement>(null);
        // Generate last 30 days + next 7 days
        const dates = [];
        for (let i = -30; i <= 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            dates.push(d);
        }

        useEffect(() => {
            // Scroll to selected date on mount
            if (scrollRef.current) {
                // simple scroll to center logic or just end
                scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
            }
        }, []);

        return (
            <div className="bg-white dark:bg-dark-card border-b border-gray-100 dark:border-gray-800 py-3 shadow-sm sticky top-0 z-10">
                <div
                    ref={scrollRef}
                    className="flex gap-2 overflow-x-auto px-4 no-scrollbar items-center"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {dates.map(date => {
                        const dateStr = date.toISOString().split('T')[0];
                        const isSelected = dateStr === selectedDate;
                        const isToday = dateStr === new Date().toISOString().split('T')[0];

                        return (
                            <button
                                key={dateStr}
                                onClick={() => setSelectedDate(dateStr)}
                                className={`flex flex-col items-center justify-center min-w-[50px] h-[58px] rounded-xl transition-all ${isSelected
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-105'
                                    : 'bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'
                                    }`}
                            >
                                <span className={`text-[10px] uppercase font-bold ${isSelected ? 'text-emerald-100' : ''}`}>
                                    {date.toLocaleDateString(undefined, { weekday: 'short' })}
                                </span>
                                <span className={`text-lg font-bold ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                    {date.getDate()}
                                </span>
                                {isToday && !isSelected && <div className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5"></div>}
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    };

    // Group logs by meal type
    const logsByMeal = ['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(meal => ({
        type: meal,
        items: foodLogs.filter(f => f.mealType === meal)
    })).filter(g => g.items.length > 0);

    return (
        <div className="pb-24 min-h-screen bg-gray-50 dark:bg-dark-bg">
            {/* Floating Action Button (FAB) */}
            <div className="fixed bottom-24 right-6 z-30">
                <button
                    onClick={() => { setEditingLog(undefined); setIsFoodModalOpen(true); }}
                    className="w-14 h-14 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full shadow-xl shadow-emerald-500/30 flex items-center justify-center transition-transform active:scale-95"
                >
                    <Plus size={28} />
                </button>
            </div>

            {/* Modals */}
            <div className="bg-white dark:bg-dark-card p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
                <button onClick={() => window.location.hash = '#home'} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nutrition Journal</h1>
                <div className="ml-auto flex gap-2">
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
                        className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 disabled:opacity-50"
                    >
                        {isAnalyzing ? <Loader2 size={20} className="animate-spin" /> : <Camera size={20} />}
                    </button>
                </div>
            </div>

            <HorizontalCalendar />

            <div className="p-4 space-y-6">
                {/* Summary Card for Selected Date */}
                <Card className="p-5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-xl shadow-emerald-500/20 rounded-2xl">
                    <div className="flex justify-between items-end mb-5">
                        <div className="text-emerald-100 text-xs font-bold uppercase tracking-wider flex items-center gap-1"><Flame size={14} /> Calories</div>
                        <div className="text-4xl font-bold tracking-tight">{Math.round(totals.cal)} <span className="text-sm font-medium text-emerald-100/70">/ {profile.calorieGoal || 2500}</span></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 bg-white/10 rounded-xl p-3 text-center backdrop-blur-sm">
                        <div className="border-r border-white/10 last:border-0">
                            <div className="text-[10px] text-emerald-100 uppercase font-bold mb-1">Protein</div>
                            <div className="font-bold text-lg">{Math.round(totals.pro)}g</div>
                        </div>
                        <div className="border-r border-white/10 last:border-0">
                            <div className="text-[10px] text-emerald-100 uppercase font-bold mb-1">Carbs</div>
                            <div className="font-bold text-lg">{Math.round(totals.carb)}g</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-emerald-100 uppercase font-bold mb-1">Fat</div>
                            <div className="font-bold text-lg">{Math.round(totals.fat)}g</div>
                        </div>
                    </div>
                </Card>

                {/* Add Button */}
                <Button
                    className="w-full py-6 text-lg bg-white dark:bg-dark-card text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900 shadow-sm hover:bg-emerald-50 dark:hover:bg-emerald-900/10 transition-all active:scale-[0.98]"
                    onClick={() => { setEditingLog(undefined); setIsFoodModalOpen(true); }}
                >
                    <Plus size={22} className="mr-2" /> Log Food
                </Button>

                {/* Food Logs List */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {(Object.entries(
                        foodLogs.reduce((acc, log) => {
                            const type = log.mealType || 'Other';
                            if (!acc[type]) acc[type] = [];
                            acc[type].push(log);
                            return acc;
                        }, {} as Record<string, FoodLog[]>)
                    ) as [string, FoodLog[]][])
                        .sort(([a], [b]) => {
                            // Order: Breakfast, Lunch, Dinner, Snack
                            const order: Record<string, number> = { Breakfast: 1, Lunch: 2, Dinner: 3, Snack: 4 };
                            return (order[a] || 99) - (order[b] || 99);
                        })
                        .map(([type, logs]) => {
                            const totalCal = Math.round(logs.reduce((sum, l) => sum + l.calories, 0));
                            const totalPro = Math.round(logs.reduce((sum, l) => sum + l.protein, 0));
                            const totalCarb = Math.round(logs.reduce((sum, l) => sum + l.carbs, 0));
                            const totalFat = Math.round(logs.reduce((sum, l) => sum + l.fats, 0));
                            const itemCount = logs.reduce((sum, l) => sum + l.quantity, 0); // or logs.length? User said '7 items' - implies count of distinct entries usually. Let's use logs.length for 'items'.

                            return (
                                <div key={type} className="bg-white dark:bg-[#161B22] border border-gray-100 dark:border-white/5 rounded-xl overflow-hidden shadow-sm mb-3">
                                    {/* Meal Header */}
                                    <div
                                        className="flex flex-col px-4 py-3 cursor-pointer select-none hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                        onClick={() => setCollapsed(prev => ({ ...prev, [type]: !prev[type] }))}
                                    >
                                        <div className="flex justify-between items-start">
                                            {/* Top Row: Title & Count */}
                                            <div className="flex items-center gap-2">
                                                <h3 className="text-[#111827] dark:text-white font-bold text-base">{type}</h3>
                                                <span className="text-gray-400 dark:text-gray-500">•</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">{logs.length} items</span>
                                            </div>

                                            {/* Icons */}
                                            <div className="flex items-center gap-3">
                                                <button
                                                    className="p-1.5 text-[#9CA3AF] hover:text-[#111827] dark:hover:text-white transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingGroup({ type, items: JSON.parse(JSON.stringify(logs)) });
                                                        setEditDeleteIds(new Set());
                                                    }}
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    className="text-emerald-500 hover:text-emerald-600 transition-colors"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingLog(undefined);
                                                        setIsFoodModalOpen(true);
                                                    }}
                                                >
                                                    <Plus size={18} />
                                                </button>
                                                <div className={`text-gray-400 transition-transform duration-200 ${!collapsed[type] ? 'rotate-180' : ''}`}>
                                                    <ChevronDown size={18} />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Bottom Row: Macros */}
                                        <div className="flex items-center gap-3 mt-1 text-xs">
                                            <span className="text-emerald-500 font-bold">{totalCal} kcal</span>
                                            <span className="text-gray-300 dark:text-gray-700">|</span>
                                            <div className="flex gap-2 text-gray-500 dark:text-gray-400">
                                                <span>P {totalPro}g</span>
                                                <span>C {totalCarb}g</span>
                                                <span>F {totalFat}g</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Expanded List */}
                                    {!collapsed[type] && (
                                        <div className="border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#161B22]">
                                            {(expandedGroups[type] ? logs : logs.slice(0, 3)).map((log, idx) => {
                                                const maxMacro = Math.max(log.protein, log.carbs, log.fats);
                                                let macroDisplay = null;

                                                if (maxMacro > 0) {
                                                    if (maxMacro === log.protein) macroDisplay = <span className="text-blue-500 bg-blue-50 dark:bg-blue-900/10 text-[10px] font-bold px-1.5 py-0.5 rounded-md">P {Math.round(log.protein)}g</span>;
                                                    else if (maxMacro === log.carbs) macroDisplay = <span className="text-blue-500 bg-blue-50 dark:bg-blue-900/10 text-[10px] font-bold px-1.5 py-0.5 rounded-md">C {Math.round(log.carbs)}g</span>;
                                                    else macroDisplay = <span className="text-orange-500 bg-orange-50 dark:bg-orange-900/10 text-[10px] font-bold px-1.5 py-0.5 rounded-md">F {Math.round(log.fats)}g</span>;
                                                }

                                                return (
                                                    <div
                                                        key={log.id}
                                                        className={`py-3 px-4 hover:bg-[#F7F8FA] dark:hover:bg-white/5 transition-colors group relative ${idx !== logs.length - 1 ? 'border-b border-gray-100 dark:border-white/5' : ''}`}
                                                    >
                                                        <div className="flex justify-between items-start mb-1">
                                                            <div className="font-bold text-[#111827] dark:text-[#E5E7EB] text-sm">{log.foodName}</div>
                                                            <div className="font-bold text-[#111827] dark:text-[#E5E7EB] text-sm">
                                                                {Math.round(log.calories)} <span className="text-xs font-normal text-gray-400">kcal</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <div className="text-xs text-gray-500 dark:text-gray-400">{log.quantity} {log.unit}</div>
                                                            <div>{macroDisplay}</div>
                                                        </div>
                                                        {/* Hidden Trash */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setDeleteId(log.id); }}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white dark:bg-[#161B22] shadow-sm border border-gray-100 dark:border-gray-700 rounded-full text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                );
                                            })}

                                            {/* View More Footer */}
                                            {logs.length > 3 && !expandedGroups[type] && (
                                                <button
                                                    onClick={() => setExpandedGroups(prev => ({ ...prev, [type]: true }))}
                                                    className="w-full py-3 text-xs font-bold text-gray-500 hover:text-emerald-600 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors uppercase tracking-wide border-t border-gray-100 dark:border-white/5"
                                                >
                                                    View {logs.length - 3} More Items
                                                </button>
                                            )}
                                            {logs.length > 3 && expandedGroups[type] && (
                                                <button
                                                    onClick={() => setExpandedGroups(prev => ({ ...prev, [type]: false }))}
                                                    className="w-full py-3 text-xs font-bold text-gray-500 hover:text-emerald-600 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors uppercase tracking-wide border-t border-gray-100 dark:border-white/5"
                                                >
                                                    Show Less
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                    {foodLogs.length === 0 && (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Apple size={32} />
                            </div>
                            <p className="text-gray-400 dark:text-gray-600 font-medium">No food logs for this day</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Batch Edit Modal - Redesigned */}
            <Modal isOpen={!!editingGroup} onClose={() => setEditingGroup(null)} title="Edit Meal">
                {editingGroup && (
                    <div className="flex flex-col h-full max-h-[80vh]">
                        {/* Meal Type Segmented Control */}
                        <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-xl mb-6">
                            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setEditingGroup({ ...editingGroup, type })}
                                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${editingGroup.type === type
                                        ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                        }`}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>

                        {/* Scrollable Food List */}
                        <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5 min-h-0 relative">
                            {editingGroup.items.map((item, idx) => {
                                const isDeleted = editDeleteIds.has(item.id);
                                return (
                                    <div key={item.id} className={`bg-white dark:bg-[#161B22] p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all ${isDeleted ? 'opacity-50 grayscale' : ''}`}>

                                        {/* Header: Name + Trash */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex items-start gap-2">
                                                <div className={`w-2 h-2 mt-1.5 rounded-full ${Math.max(item.protein, item.carbs, item.fats) === item.protein ? 'bg-emerald-500' :
                                                    Math.max(item.protein, item.carbs, item.fats) === item.carbs ? 'bg-blue-500' : 'bg-orange-500'
                                                    }`} />
                                                <div>
                                                    <input
                                                        className="font-bold text-gray-900 dark:text-white text-base bg-transparent p-0 border-none focus:ring-0 focus:outline-none w-full"
                                                        value={item.foodName}
                                                        disabled={isDeleted}
                                                        onChange={(e) => {
                                                            const newItems = [...editingGroup.items];
                                                            newItems[idx].foodName = e.target.value;
                                                            setEditingGroup({ ...editingGroup, items: newItems });
                                                        }}
                                                    />
                                                    <div className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                                                        {item.quantity} {item.unit}
                                                    </div>
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    const newSet = new Set(editDeleteIds);
                                                    if (isDeleted) newSet.delete(item.id);
                                                    else newSet.add(item.id);
                                                    setEditDeleteIds(newSet);
                                                }}
                                                className="text-gray-300 hover:text-gray-500 transition-colors p-1"
                                            >
                                                {isDeleted ? <span className="text-xs font-bold text-emerald-500">UNDO</span> : <Trash2 size={16} />}
                                            </button>
                                        </div>

                                        {/* Controls Row */}
                                        <div className={`flex items-end justify-between ${isDeleted ? 'pointer-events-none' : ''}`}>
                                            {/* Quantity Stepper/Input */}
                                            <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-xl p-1">
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all"
                                                    onClick={() => {
                                                        const newItems = [...editingGroup.items];
                                                        newItems[idx].quantity = Math.max(0.1, (newItems[idx].quantity || 0) - 0.5);
                                                        setEditingGroup({ ...editingGroup, items: newItems });
                                                    }}
                                                >
                                                    -
                                                </button>
                                                <input
                                                    className="w-12 text-center bg-transparent font-bold text-gray-900 dark:text-white text-sm focus:outline-none"
                                                    value={item.quantity}
                                                    type="number"
                                                    onChange={(e) => {
                                                        const newItems = [...editingGroup.items];
                                                        newItems[idx].quantity = parseFloat(e.target.value) || 0;
                                                        setEditingGroup({ ...editingGroup, items: newItems });
                                                    }}
                                                />
                                                <button
                                                    className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-white dark:hover:bg-white/10 rounded-lg transition-all"
                                                    onClick={() => {
                                                        const newItems = [...editingGroup.items];
                                                        newItems[idx].quantity = (newItems[idx].quantity || 0) + 0.5;
                                                        setEditingGroup({ ...editingGroup, items: newItems });
                                                    }}
                                                >
                                                    +
                                                </button>
                                            </div>

                                            {/* Macros */}
                                            <div className="text-right">
                                                <div className="flex items-center justify-end gap-1 mb-1 text-gray-900 dark:text-white font-bold">
                                                    <Flame size={12} className="text-gray-400" />
                                                    {Math.round(item.calories)}<span className="text-xs font-normal text-gray-400 ml-0.5">kcal</span>
                                                </div>
                                                <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider">
                                                    <span className="text-blue-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500" />{Math.round(item.protein)}g P</span>
                                                    <span className="text-emerald-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />{Math.round(item.carbs)}g C</span>
                                                    <span className="text-purple-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" />{Math.round(item.fats)}g F</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Total Intake Summary */}
                        <div className="bg-white dark:bg-[#161B22] mx-[-24px] mb-[-24px] p-6 rounded-b-2xl border-t border-gray-100 dark:border-white/10 mt-4">
                            <div className="mb-6">
                                <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Intake</div>
                                <div className="flex justify-between items-end">
                                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                        {Math.round(editingGroup.items.filter(i => !editDeleteIds.has(i.id)).reduce((a, b) => a + b.calories, 0))} <span className="text-lg font-medium text-gray-400">kcal</span>
                                    </div>
                                    <div className="flex gap-4 text-sm font-bold">
                                        <div className="text-blue-500 flex flex-col items-end">
                                            <span>{Math.round(editingGroup.items.filter(i => !editDeleteIds.has(i.id)).reduce((a, b) => a + b.protein, 0))}g</span>
                                            <span className="text-[10px] text-gray-400 font-bold">PRO</span>
                                        </div>
                                        <div className="text-emerald-500 flex flex-col items-end">
                                            <span>{Math.round(editingGroup.items.filter(i => !editDeleteIds.has(i.id)).reduce((a, b) => a + b.carbs, 0))}g</span>
                                            <span className="text-[10px] text-gray-400 font-bold">CARB</span>
                                        </div>
                                        <div className="text-purple-500 flex flex-col items-end">
                                            <span>{Math.round(editingGroup.items.filter(i => !editDeleteIds.has(i.id)).reduce((a, b) => a + b.fats, 0))}g</span>
                                            <span className="text-[10px] text-gray-400 font-bold">FAT</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setEditingGroup(null)}
                                    className="flex-1 h-12 rounded-lg border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 font-bold"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleBatchSave}
                                    className="flex-1 h-12 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>

            <FoodLoggerModal
                isOpen={isFoodModalOpen}
                onClose={() => { setIsFoodModalOpen(false); setEditingLog(undefined); }}
                selectedDate={selectedDate}
                onSave={loadData}
                initialData={editingLog}
            />

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={handleDeleteLog}
                title="Delete Food Log"
                message="Are you sure you want to delete this food log?"
                confirmText="Delete"
                variant="danger"
            />
        </div>
    );
};

interface FoodLoggerProps {
    isOpen: boolean;
    onClose: () => void;
    editingLog?: FoodLog;
    targetDate?: string;
}

const FoodLoggerModal: React.FC<FoodLoggerProps> = ({ isOpen, onClose, editingLog, targetDate }) => {
    const [view, setView] = useState<'search' | 'create' | 'edit'>('search');
    const [mealType, setMealType] = useState('Snack');
    const [searchTerm, setSearchTerm] = useState('');
    const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);

    // Log/Food State
    const [editForm, setEditForm] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '', servingSize: '1 serving', quantity: 1 });

    useEffect(() => {
        if (isOpen) {
            DatabaseService.getCustomFoods().then(setCustomFoods);

            // Auto-suggest meal type on open if not editing
            if (!editingLog) {
                const hour = new Date().getHours();
                if (hour >= 5 && hour < 11) setMealType('Breakfast');
                else if (hour >= 11 && hour < 16) setMealType('Lunch');
                else if (hour >= 16 && hour < 19) setMealType('Snack');
                else if (hour >= 19 && hour < 23) setMealType('Dinner');
            }

            if (editingLog) {
                // Pre-fill for editing existing log
                setView('edit');
                // Ensure meal type is set from the log
                setMealType(editingLog.mealType || 'Snack'); // Assuming mealType exists on FoodLog
                setEditForm({
                    name: editingLog.foodName,
                    calories: (editingLog.calories / editingLog.quantity).toString(), // Per unit estimate
                    protein: (editingLog.protein / editingLog.quantity).toString(),
                    carbs: (editingLog.carbs / editingLog.quantity).toString(),
                    fats: (editingLog.fats / editingLog.quantity).toString(),
                    servingSize: editingLog.unit,
                    quantity: editingLog.quantity
                });
            } else {
                // Reset for new log
                setView('search');
                setSearchTerm('');
                setEditForm({ name: '', calories: '', protein: '', carbs: '', fats: '', servingSize: '1 serving', quantity: 1 });
            }
        }
    }, [isOpen, editingLog]);

    const handleLogFood = async (food: FoodItem, qty: number = 1) => {
        const today = new Date().toISOString().split('T')[0];
        // Use targetDate if available, otherwise today
        const dateToLog = targetDate || today;
        await DatabaseService.logFood({
            date: dateToLog,
            mealType: mealType as any,
            foodName: food.name,
            calories: food.calories * qty,
            protein: food.protein * qty,
            carbs: food.carbs * qty,
            fats: food.fats * qty,
            quantity: qty,
            unit: food.servingSize
        });
        onClose();
    };

    const handleUpdateLog = async () => {
        if (!editingLog) return;
        const qty = parseFloat(editForm.quantity.toString()) || 1;
        // Base values (per unit)
        // Note: For edited logs, we might rely on the user adjusting the TOTALS or PER UNIT. 
        // Simpler: The inputs represent PER UNIT values, and we multiply by Qty.
        const perUnit = {
            cal: parseFloat(editForm.calories),
            pro: parseFloat(editForm.protein) || 0,
            carb: parseFloat(editForm.carbs) || 0,
            fat: parseFloat(editForm.fats) || 0
        };

        const updatedLog: FoodLog = {
            ...editingLog,
            mealType: mealType as any,
            foodName: editForm.name,
            calories: perUnit.cal * qty,
            protein: perUnit.pro * qty,
            carbs: perUnit.carb * qty,
            fats: perUnit.fat * qty,
            quantity: qty,
            unit: editForm.servingSize
        };

        await DatabaseService.updateFoodLog(updatedLog);
        onClose();
    };

    const handleSaveCustomFood = async () => {
        if (!editForm.name || !editForm.calories) return;
        const food = {
            name: editForm.name,
            calories: parseFloat(editForm.calories),
            protein: parseFloat(editForm.protein) || 0,
            carbs: parseFloat(editForm.carbs) || 0,
            fats: parseFloat(editForm.fats) || 0,
            servingSize: editForm.servingSize
        };
        await DatabaseService.addCustomFood(food);
        // Automatically log it too? Usually yes.
        await handleLogFood({ ...food, isCustom: true }, 1);
        // setCustomFoods([...customFoods, { ...food, isCustom: true }]);
        // setView('search');
    };

    const allFoods = [...customFoods, ...STATIC_FOODS];
    const filteredFoods = allFoods.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const MealSelector = () => (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-4">
            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => (
                <button
                    key={m}
                    onClick={() => setMealType(m)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${mealType === m
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                        }`}
                >
                    {m}
                </button>
            ))}
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={view === 'edit' ? "Edit Entry" : "Log Meal"}>
            <MealSelector />

            {view === 'search' ? (
                <>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            className="w-full pl-9 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-transparent focus:bg-white dark:focus:bg-dark-card focus:ring-2 focus:ring-orange-500 outline-none dark:text-white"
                            placeholder="Search food (e.g. Rice, Egg)..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1">
                        {filteredFoods.length === 0 ? (
                            <div className="text-center py-6">
                                <p className="text-gray-500 text-sm mb-3">No foods found.</p>
                                <Button size="sm" onClick={() => setView('create')}>+ Create "{searchTerm}"</Button>
                            </div>
                        ) : (
                            filteredFoods.map((food, i) => (
                                <div key={i} className="flex justify-between items-center p-3 bg-white dark:bg-dark-card border border-gray-100 dark:border-gray-800 rounded-xl hover:border-orange-500 cursor-pointer group" onClick={() => handleLogFood(food)}>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white">{food.name}</div>
                                        <div className="text-xs text-gray-500">
                                            {food.calories} cal • {food.protein}p • {food.carbs}c • {food.fats}f <span className="text-gray-400">({food.servingSize})</span>
                                        </div>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 flex items-center justify-center group-hover:bg-orange-100 group-hover:text-orange-500">
                                        <Plus size={16} />
                                    </div>
                                </div>
                            ))
                        )}
                        <div className="pt-4 text-center">
                            <button onClick={() => setView('create')} className="text-sm text-orange-600 font-bold hover:underline">Or create custom food</button>
                        </div>
                    </div>
                </>
            ) : (
                <div className="space-y-4">
                    <button onClick={() => setView('search')} className="text-sm text-gray-500 mb-2 flex items-center gap-1"><X size={14} /> Cancel</button>
                    {/* Reusing form for Create and Edit */}
                    <Input label="Food Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} autoFocus />

                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Calories (per serving)" type="number" value={editForm.calories} onChange={e => setEditForm({ ...editForm, calories: e.target.value })} />
                        <Input label="Serving Size / Unit" value={editForm.servingSize} onChange={e => setEditForm({ ...editForm, servingSize: e.target.value })} />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Protein (g)" type="number" value={editForm.protein} onChange={e => setEditForm({ ...editForm, protein: e.target.value })} />
                        <Input label="Carbs (g)" type="number" value={editForm.carbs} onChange={e => setEditForm({ ...editForm, carbs: e.target.value })} />
                        <Input label="Fats (g)" type="number" value={editForm.fats} onChange={e => setEditForm({ ...editForm, fats: e.target.value })} />
                    </div>

                    {view === 'edit' && (
                        <div className="mt-2">
                            <Input label="Quantity (x Servings)" type="number" value={editForm.quantity} onChange={e => setEditForm({ ...editForm, quantity: parseFloat(e.target.value) })} />
                        </div>
                    )}

                    <Button onClick={view === 'edit' ? handleUpdateLog : handleSaveCustomFood} className="w-full mt-4 bg-orange-500 hover:bg-orange-600">
                        {view === 'edit' ? 'Update Entry' : 'Save & Add Custom Food'}
                    </Button>
                </div>
            )}
        </Modal>
    );
};