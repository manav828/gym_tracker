import React, { useState, useEffect, useRef } from 'react';
import { Button, Card, Input, Modal, ConfirmationModal } from './Shared';
import { Plus, Search, Trash2, Droplets, Flame, X, Edit2, ChevronLeft, ChevronRight, Calendar, ArrowLeft, Camera, Loader2 } from 'lucide-react';
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
                {scanResult && (
                    <div className="space-y-4">
                        <div className="relative h-40 bg-gray-100 dark:bg-white/5 rounded-2xl overflow-hidden flex items-center justify-center mb-4">
                            <Camera size={48} className="text-gray-300 dark:text-gray-600" />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Food Name</label>
                                <input
                                    className="w-full bg-slate-50 dark:bg-black/20 border-b border-gray-200 dark:border-gray-800 p-2 font-bold text-lg"
                                    value={scanResult.food_name}
                                    onChange={(e) => setScanResult({ ...scanResult, food_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-4 gap-2">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase">Cals</label>
                                    <div className="font-black text-xl">{scanResult.calories}</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-blue-500 uppercase">Prot</label>
                                    <div className="font-bold">{scanResult.protein}g</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-green-500 uppercase">Carb</label>
                                    <div className="font-bold">{scanResult.carbs}g</div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-purple-500 uppercase">Fat</label>
                                    <div className="font-bold">{scanResult.fats}g</div>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Notes (AI)</label>
                                <textarea
                                    className="w-full bg-slate-50 dark:bg-black/20 rounded-xl p-3 text-sm min-h-[60px]"
                                    value={scanResult.notes}
                                    onChange={(e) => setScanResult({ ...scanResult, notes: e.target.value })}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="ghost" onClick={() => setIsReviewOpen(false)} className="flex-1">Discard</Button>
                                <Button onClick={confirmScan} className="flex-1 bg-orange-500 hover:bg-orange-600">Save Log</Button>
                            </div>
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

    useEffect(() => {
        loadData();
    }, [selectedDate]);

    const loadData = async () => {
        const foods = await DatabaseService.getFoodLogs(selectedDate);
        setFoodLogs(foods);
    };

    const handleDeleteLog = async () => {
        if (!deleteId) return;
        await DatabaseService.deleteFoodLog(deleteId);
        setDeleteId(null);
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
            {/* Header */}
            <div className="bg-white dark:bg-dark-card p-4 flex items-center gap-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20">
                <button onClick={() => window.location.hash = '#home'} className="p-2 -ml-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">Nutrition Journal</h1>
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

                {/* Meals List */}
                <div className="space-y-4">
                    {logsByMeal.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                <Search size={32} />
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 font-medium">No meals logged for this day.</p>
                            <p className="text-sm text-gray-400 mt-1">Tap 'Log Food' to add breakfast, lunch, or snacks.</p>
                        </div>
                    ) : (
                        logsByMeal.map(group => (
                            <div key={group.type} className="space-y-3">
                                <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider pl-1">{group.type}</h3>
                                <div className="bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                                    {group.items.map((log, i) => (
                                        <div key={log.id} className={`p-4 flex justify-between items-center group hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors ${i < group.items.length - 1 ? 'border-b border-gray-100 dark:border-gray-800' : ''}`}>
                                            <div>
                                                <div className="font-semibold text-gray-900 dark:text-white text-base">{log.foodName}</div>
                                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                                    <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400 font-medium">{log.quantity}x {log.unit}</span>
                                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">{Math.round(log.calories)} kcal</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setEditingLog(log); setIsFoodModalOpen(true); }} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => setDeleteId(log.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                    <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center text-xs text-gray-500 font-medium">
                                        <span>Total</span>
                                        <span>{Math.round(group.items.reduce((a, b) => a + b.calories, 0))} kcal</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <FoodLoggerModal
                isOpen={isFoodModalOpen}
                onClose={() => { setIsFoodModalOpen(false); loadData(); }}
                editingLog={editingLog}
                targetDate={selectedDate} // We need to add this prop to Modal
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
    const [mealType, setMealType] = useState('Breakfast');
    const [searchTerm, setSearchTerm] = useState('');
    const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);

    // Log/Food State
    const [editForm, setEditForm] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '', servingSize: '1 serving', quantity: 1 });

    useEffect(() => {
        if (isOpen) {
            DatabaseService.getCustomFoods().then(setCustomFoods);

            if (editingLog) {
                // Pre-fill for editing existing log
                setView('edit');
                setMealType(editingLog.mealType);
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