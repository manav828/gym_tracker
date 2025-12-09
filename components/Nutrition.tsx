import React, { useState, useEffect } from 'react';
import { Button, Card, Input, Modal } from './Shared';
import { Plus, Search, Trash2, Droplets, Flame, X } from 'lucide-react';
import { DatabaseService } from '../services/databaseService';
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

    const ProgressBar = ({ current, max, color, label, unit = "g" }: any) => {
        const percent = Math.min((current / max) * 100, 100);
        return (
            <div className="mb-2">
                <div className="flex justify-between text-xs mb-1 font-semibold text-gray-700 dark:text-gray-300">
                    <span>{label}</span>
                    <span>{Math.round(current)} / {max}{unit}</span>
                </div>
                <div className="h-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className={`h-full ${color}`} style={{ width: `${percent}%` }}></div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {/* Main Nutrition Card */}
            <Card className="p-4">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Flame size={18} className="text-orange-500" /> Nutrition Today
                        </h3>
                    </div>
                    <Button size="sm" onClick={() => setIsFoodModalOpen(true)}>
                        <Plus size={16} className="mr-1" /> Add Meal
                    </Button>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <div className="relative w-24 h-24 flex items-center justify-center">
                         <svg className="w-full h-full transform -rotate-90">
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={251.2} strokeDashoffset={251.2 - (Math.min(totalCalories/goals.calories, 1) * 251.2)} className="text-orange-500 transition-all duration-1000" />
                        </svg>
                        <div className="absolute flex flex-col items-center">
                            <span className="text-xl font-bold text-gray-900 dark:text-white">{Math.round(totalCalories)}</span>
                            <span className="text-[10px] text-gray-500">kcal</span>
                        </div>
                    </div>
                    <div className="flex-1 ml-6 space-y-2">
                        <ProgressBar label="Protein" current={totalProtein} max={goals.protein} color="bg-blue-500" />
                        <ProgressBar label="Carbs" current={totalCarbs} max={goals.carbs} color="bg-green-500" />
                        <ProgressBar label="Fats" current={totalFats} max={goals.fats} color="bg-yellow-500" />
                    </div>
                </div>
            </Card>

            {/* Water Tracker */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30">
                <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                        <Droplets size={18} /> Hydration
                    </h3>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-300">{totalWater} / {goals.water} ml</span>
                </div>
                <div className="h-3 w-full bg-blue-200 dark:bg-blue-900/50 rounded-full overflow-hidden mb-4">
                     <div className="h-full bg-blue-500" style={{ width: `${Math.min((totalWater/goals.water)*100, 100)}%` }}></div>
                </div>
                <div className="flex gap-2 justify-between">
                    <button onClick={() => handleAddWater(250)} className="flex-1 py-2 bg-white dark:bg-dark-card rounded-lg text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800 shadow-sm active:scale-95 transition-transform">+250ml</button>
                    <button onClick={() => handleAddWater(500)} className="flex-1 py-2 bg-white dark:bg-dark-card rounded-lg text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800 shadow-sm active:scale-95 transition-transform">+500ml</button>
                    <button onClick={() => { const amt = prompt("Enter ml:"); if(amt) handleAddWater(parseFloat(amt)); }} className="flex-1 py-2 bg-white dark:bg-dark-card rounded-lg text-blue-600 dark:text-blue-400 text-xs font-bold border border-blue-100 dark:border-blue-800 shadow-sm active:scale-95 transition-transform">Custom</button>
                </div>
            </Card>

            <FoodLoggerModal isOpen={isFoodModalOpen} onClose={() => { setIsFoodModalOpen(false); loadData(); }} />
        </div>
    );
};

// --- Food Logger Modal ---

interface FoodLoggerProps {
    isOpen: boolean;
    onClose: () => void;
}

const FoodLoggerModal: React.FC<FoodLoggerProps> = ({ isOpen, onClose }) => {
    const [view, setView] = useState<'search' | 'create'>('search');
    const [mealType, setMealType] = useState('Breakfast');
    const [searchTerm, setSearchTerm] = useState('');
    const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
    
    // Create Custom Food State
    const [newFood, setNewFood] = useState({ name: '', calories: '', protein: '', carbs: '', fats: '', servingSize: '1 serving' });

    useEffect(() => {
        if (isOpen) {
            DatabaseService.getCustomFoods().then(setCustomFoods);
            setSearchTerm('');
            setView('search');
        }
    }, [isOpen]);

    const handleLogFood = async (food: FoodItem, qty: number = 1) => {
        const today = new Date().toISOString().split('T')[0];
        await DatabaseService.logFood({
            date: today,
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

    const handleSaveCustomFood = async () => {
        if (!newFood.name || !newFood.calories) return;
        const food = {
            name: newFood.name,
            calories: parseFloat(newFood.calories),
            protein: parseFloat(newFood.protein) || 0,
            carbs: parseFloat(newFood.carbs) || 0,
            fats: parseFloat(newFood.fats) || 0,
            servingSize: newFood.servingSize
        };
        await DatabaseService.addCustomFood(food);
        setCustomFoods([...customFoods, { ...food, isCustom: true }]);
        setView('search');
    };

    const allFoods = [...customFoods, ...STATIC_FOODS];
    const filteredFoods = allFoods.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    const MealSelector = () => (
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-4">
            {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(m => (
                <button 
                    key={m} 
                    onClick={() => setMealType(m)}
                    className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${
                        mealType === m 
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
        <Modal isOpen={isOpen} onClose={onClose} title="Log Meal">
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
                    <button onClick={() => setView('search')} className="text-sm text-gray-500 mb-2 flex items-center gap-1"><X size={14}/> Cancel</button>
                    <Input label="Food Name" value={newFood.name} onChange={e => setNewFood({...newFood, name: e.target.value})} autoFocus />
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="Calories" type="number" value={newFood.calories} onChange={e => setNewFood({...newFood, calories: e.target.value})} />
                        <Input label="Serving Size (e.g. 100g)" value={newFood.servingSize} onChange={e => setNewFood({...newFood, servingSize: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <Input label="Protein (g)" type="number" value={newFood.protein} onChange={e => setNewFood({...newFood, protein: e.target.value})} />
                        <Input label="Carbs (g)" type="number" value={newFood.carbs} onChange={e => setNewFood({...newFood, carbs: e.target.value})} />
                        <Input label="Fats (g)" type="number" value={newFood.fats} onChange={e => setNewFood({...newFood, fats: e.target.value})} />
                    </div>
                    <Button onClick={handleSaveCustomFood} className="w-full mt-4 bg-orange-500 hover:bg-orange-600">Save & Add</Button>
                </div>
            )}
        </Modal>
    );
};