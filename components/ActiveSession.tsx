import React, { useState, useEffect, useRef } from 'react';
import { WorkoutSession, Set, Routine, TrackingType } from '../types';
import { DatabaseService } from '../services/databaseService';
import { Button, Input, Card, ConfirmationModal, Modal } from './Shared';
import { Timer, Check, Plus, Trash2, Video, History, Scale, TrendingUp, ChevronLeft, X, Play, Pause, Settings, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, Line } from 'recharts';
import { COMMON_EXERCISES, getMuscleGroupForExercise, getExerciseTarget } from './exercisesData';

interface ActiveSessionProps {
    routine: Routine;
    onFinish: () => void;
    onBack: () => void;
    existingSession: WorkoutSession | null;
    onSessionUpdate: (session: WorkoutSession) => void;
    isHistory?: boolean;
}

export const ActiveSession: React.FC<ActiveSessionProps> = ({ routine, onFinish, onBack, existingSession, onSessionUpdate, isHistory = false }) => {
    const [session, setSession] = useState<WorkoutSession>(() => {
        if (existingSession) {
            // If resuming an already paused session, ensure state reflects it
            return existingSession;
        }
        const now = new Date();
        return {
            id: crypto.randomUUID(),
            routineId: routine.id,
            routineName: routine.name,
            startTime: Date.now(),
            durationSeconds: 0,
            exercises: routine.exercises.map(ex => ({
                exerciseId: ex.id,
                name: ex.name,
                sets: [],
                notes: ex.notes
            })),
            totalVolume: 0,
            date: now.toISOString().split('T')[0],
            totalPausedDuration: 0,
            lastPausedTime: undefined
        };
    });

    const [activeExerciseIndex, setActiveExerciseIndex] = useState(0);
    const [restTimer, setRestTimer] = useState(0);
    const [isResting, setIsResting] = useState(false);
    // Initialize paused state from session data
    const [isPaused, setIsPaused] = useState<boolean>(!!session.lastPausedTime);
    const [bodyWeight, setBodyWeight] = useState<string>('');
    const [isDiscardModalOpen, setIsDiscardModalOpen] = useState(false);
    const [isDeleteExerciseModalOpen, setIsDeleteExerciseModalOpen] = useState(false);
    const [isTrackingSettingsModalOpen, setIsTrackingSettingsModalOpen] = useState(false);

    // Add Exercise State
    const [isAddExerciseModalOpen, setIsAddExerciseModalOpen] = useState(false);
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
    const [customExerciseName, setCustomExerciseName] = useState('');
    const [customTrackingType, setCustomTrackingType] = useState<TrackingType>('reps_weight');
    const [isAddToRoutineModalOpen, setIsAddToRoutineModalOpen] = useState(false);
    const [pendingExercise, setPendingExercise] = useState<{ name: string, type: TrackingType, muscle?: string } | null>(null);

    const handleAddExercise = (exerciseName: string, defaultType: TrackingType = 'reps_weight', muscle?: string) => {
        setPendingExercise({ name: exerciseName, type: defaultType, muscle });
        setIsAddToRoutineModalOpen(true);
    };

    const confirmAddExercise = async (addToRoutine: boolean) => {
        if (!pendingExercise) return;

        const newExercise = {
            exerciseId: crypto.randomUUID(), // New ID
            name: pendingExercise.name,
            sets: [], // Start empty
            notes: '',
            trackingType: pendingExercise.type
        };
        const updatedExercises = [...session.exercises, newExercise];
        setSession({ ...session, exercises: updatedExercises });
        setActiveExerciseIndex(updatedExercises.length - 1); // Switch to new

        if (addToRoutine) {
            await DatabaseService.addExerciseToRoutine(routine.id, {
                id: crypto.randomUUID(),
                name: pendingExercise.name,
                muscleGroup: pendingExercise.muscle || getMuscleGroupForExercise(pendingExercise.name) || 'General',
                defaultSets: 3,
                defaultReps: 10
            });
        }

        setIsAddToRoutineModalOpen(false);
        setIsAddExerciseModalOpen(false);
        setPendingExercise(null);
        setSelectedMuscle(null);
        setCustomTrackingType('reps_weight'); // Reset
    };

    const timerIntervalRef = useRef<number | null>(null);
    const sessionTimerRef = useRef<number | null>(null);

    const currentExercise = session.exercises[activeExerciseIndex];
    const routineExerciseDef = routine.exercises.find(e => e.id === currentExercise.exerciseId);
    const prevSessionExercise = existingSession?.exercises.find(e => e.exerciseId === currentExercise.exerciseId);

    // Exercise History State
    const [exerciseHistory, setExerciseHistory] = useState<{ date: string, maxWeight: number, totalVolume: number, oneRepMax: number }[]>([]);
    const [lastLog, setLastLog] = useState<{ date: string, sets: any[] } | null>(null);
    const [summaryStats, setSummaryStats] = useState<{ current: { maxWeight: number, volume: number }, previous: { maxWeight: number, volume: number }, diff: { maxWeight: number, volume: number } } | null>(null);
    const [isExerciseSummaryModalOpen, setIsExerciseSummaryModalOpen] = useState(false);

    // Fetch History when exercise changes
    useEffect(() => {
        const fetchHistory = async () => {
            if (currentExercise.name) {
                // 1. Get History Data for Graph
                const history = await DatabaseService.getExerciseHistory(currentExercise.name);
                setExerciseHistory(history.slice(-10));

                // 2. Get Last Completed Session for specific "Last Time" view
                const last = await DatabaseService.getLastLogForExercise(currentExercise.name);
                setLastLog(last);
            }
        };
        fetchHistory();
    }, [currentExercise.name]);

    const handleFinishExercise = () => {
        const currentEx = session.exercises[activeExerciseIndex];
        // Calculate stats
        let currentMaxWeight = 0;
        let currentVolume = 0;
        let completedSets = 0;

        currentEx.sets.forEach(s => {
            if (s.completed) {
                completedSets++;
                const w = Number(s.weight) || 0;
                const r = Number(s.reps) || 0;
                if (w > currentMaxWeight) currentMaxWeight = w;
                currentVolume += (w * r);
            }
        });

        if (completedSets === 0) {
            // Just move next if nothing done
            if (activeExerciseIndex < session.exercises.length - 1) {
                setActiveExerciseIndex(prev => prev + 1);
            } else {
                finishSession();
            }
            return;
        }

        // Compare with previous/history
        // Use prevSessionExercise if available, or last entry in history
        let prevMaxWeight = 0;
        let prevVolume = 0;

        if (exerciseHistory.length > 0) {
            const last = exerciseHistory[exerciseHistory.length - 1];
            prevMaxWeight = last.maxWeight;
            prevVolume = last.totalVolume;
        }

        const stats = {
            current: { maxWeight: currentMaxWeight, volume: currentVolume },
            previous: { maxWeight: prevMaxWeight, volume: prevVolume },
            diff: {
                maxWeight: prevMaxWeight > 0 ? ((currentMaxWeight - prevMaxWeight) / prevMaxWeight) * 100 : 0,
                volume: prevVolume > 0 ? ((currentVolume - prevVolume) / prevVolume) * 100 : 0
            }
        };

        setSummaryStats(stats);
        setIsExerciseSummaryModalOpen(true);
    };

    const confirmNextExercise = () => {
        setIsExerciseSummaryModalOpen(false);
        if (activeExerciseIndex < session.exercises.length - 1) {
            setActiveExerciseIndex(prev => prev + 1);
        } else {
            finishSession();
        }
    };



    // Session Timer Logic (Wall-Clock Based)
    useEffect(() => {
        // If history mode, do NOT run timer
        if (isHistory) return;

        // If currently paused, do not increment timer
        if (isPaused) {
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
            return;
        }

        // If running, tick every second to update UI
        sessionTimerRef.current = window.setInterval(() => {
            setSession(prev => {
                // If somehow it got paused without us knowing (race condition?), skip
                if (prev.lastPausedTime) return prev;

                const now = Date.now();
                const totalPausedMS = (prev.totalPausedDuration || 0) * 1000;
                // Calculate elapsed time accurately
                const elapsedMS = now - prev.startTime - totalPausedMS;
                const newDuration = Math.max(0, Math.floor(elapsedMS / 1000));

                return { ...prev, durationSeconds: newDuration };
            });
        }, 1000);

        return () => {
            if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
        };
    }, [isPaused, isHistory]);

    // Save to local storage on every change
    useEffect(() => {
        if (!isHistory) {
            DatabaseService.saveActiveSession(session);
        }
        onSessionUpdate(session);
    }, [session, isHistory]);

    // Toggle Pause Handler
    const togglePause = () => {
        if (isPaused) {
            // RESUME
            const now = Date.now();
            const pauseStart = session.lastPausedTime || now; // Should exist
            const pauseDurationSeconds = (now - pauseStart) / 1000;

            setSession(prev => ({
                ...prev,
                lastPausedTime: undefined,
                totalPausedDuration: (prev.totalPausedDuration || 0) + pauseDurationSeconds
            }));
            setIsPaused(false);
        } else {
            // PAUSE
            setSession(prev => ({
                ...prev,
                lastPausedTime: Date.now()
            }));
            setIsPaused(true);
        }
    };

    // Rest Timer Logic
    useEffect(() => {
        if (isResting && restTimer > 0) {
            timerIntervalRef.current = window.setInterval(() => {
                setRestTimer(prev => {
                    if (prev <= 1) {
                        setIsResting(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
        return () => {
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        };
    }, [isResting, restTimer]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + ':' : ''}${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const handleAddSet = (exerciseIndex: number) => {
        const updatedExercises = [...session.exercises];
        const currentEx = updatedExercises[exerciseIndex];
        // Default empty values based on types
        const newSet: Set = {
            id: crypto.randomUUID(),
            reps: 0,
            weight: 0,
            distance: 0,
            duration: 0,
            completed: false,
            rpe: undefined
        };

        updatedExercises[exerciseIndex].sets.push(newSet);
        setSession({ ...session, exercises: updatedExercises });
    };

    const updateSet = (exerciseIndex: number, setIndex: number, field: keyof Set, value: any) => {
        const updatedExercises = [...session.exercises];
        const set = updatedExercises[exerciseIndex].sets[setIndex];

        if (field === 'completed' && value === true && !set.completed) {
            const settings = DatabaseService.getSettings();
            setRestTimer(settings.defaultRestTimer);
            setIsResting(true);
        }

        (set as any)[field] = value;
        updatedExercises[exerciseIndex].sets[setIndex] = set;
        setSession({ ...session, exercises: updatedExercises });
    };

    const deleteSet = (exerciseIndex: number, setIndex: number) => {
        const updatedExercises = [...session.exercises];
        updatedExercises[exerciseIndex].sets.splice(setIndex, 1);
        setSession({ ...session, exercises: updatedExercises });
    }

    const handleDeleteExercise = () => {
        const updatedExercises = session.exercises.filter((_, idx) => idx !== activeExerciseIndex);
        setSession({ ...session, exercises: updatedExercises });
        setIsDeleteExerciseModalOpen(false);
        // Adjust active index
        if (activeExerciseIndex >= updatedExercises.length) {
            setActiveExerciseIndex(Math.max(0, updatedExercises.length - 1));
        }
    };

    const handleUpdateTrackingType = (type: TrackingType) => {
        const updatedExercises = [...session.exercises];
        updatedExercises[activeExerciseIndex].trackingType = type;
        // Optionally clean up sets if needed, but keeping data is safer for now
        // For example, if switching from RepsOnly to WeightReps, weight defaults to 0 which is fine.
        setSession({ ...session, exercises: updatedExercises });
        setIsTrackingSettingsModalOpen(false);
    };

    const finishSession = async () => {
        try {
            // 1. Calculate Volume
            let vol = 0;
            session.exercises.forEach(ex => {
                ex.sets.forEach(s => {
                    if (s.completed) vol += (s.weight * s.reps);
                });
            });

            // 2. Prepare Data
            const finalSession = {
                ...session,
                // If history, keep original endTime. If active, set to now.
                endTime: isHistory ? session.endTime : Date.now(),
                totalVolume: Math.round(vol), // Ensure integer for DB
                bodyWeight: bodyWeight ? parseFloat(bodyWeight) : undefined
            };

            // 3. Save Session
            const { error } = await DatabaseService.saveSession(finalSession);
            if (error) throw error; // Handle Supabase error object

            // 4. Also log weight to measurements table if provided (skip if history to avoid double logging old weights)
            if (bodyWeight && !isHistory) {
                await DatabaseService.logWeight(parseFloat(bodyWeight), finalSession.date);
            }

            if (!isHistory) {
                DatabaseService.saveActiveSession(null);
            }
            onFinish();
        } catch (err: any) {
            console.error("Failed to save session:", err);
            alert(`Failed to save workout: ${err.message || 'Unknown error'}. Please check your internet connection.`);
        }
    };



    return (
        <div className="pb-24 max-w-2xl mx-auto">
            {/* Sticky Header */}
            <div className="sticky top-0 bg-white/95 dark:bg-dark-bg/95 backdrop-blur z-20 px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 -ml-2 text-gray-500 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-dark-card">
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h2 className="font-bold text-gray-900 dark:text-white leading-tight">{routine.name}</h2>
                        <div className="text-xs text-gray-500 font-mono flex items-center gap-2">
                            {isHistory ? (
                                <span className="text-orange-500 font-bold">EDITING HISTORY</span>
                            ) : (
                                <>
                                    {formatTime(session.durationSeconds)}
                                    {isPaused && <span className="text-yellow-500 font-bold px-1 rounded bg-yellow-100 dark:bg-yellow-900/30">PAUSED</span>}
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {!isHistory && (
                        <>
                            <button onClick={togglePause} className={`p-2 rounded-full ${isPaused ? 'text-green-500 bg-green-50' : 'text-gray-500 bg-gray-50'}`}>
                                {isPaused ? <Play size={20} fill="currentColor" /> : <Pause size={20} fill="currentColor" />}
                            </button>

                            <button onClick={() => setIsDiscardModalOpen(true)} className="p-2 text-red-500 hover:bg-red-50 rounded-full">
                                <X size={20} />
                            </button>

                            {isResting ? (
                                <div className="bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1 animate-pulse" onClick={() => setIsResting(false)}>
                                    <Timer size={14} /> {formatTime(restTimer)}
                                </div>
                            ) : (
                                <button onClick={() => { setRestTimer(60); setIsResting(true); }} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-dark-card text-gray-500">
                                    <Timer size={20} />
                                </button>
                            )}
                        </>
                    )}
                    <Button size="sm" onClick={finishSession} className="bg-green-600 hover:bg-green-700">{isHistory ? 'Save Changes' : 'Finish'}</Button>
                </div>
            </div>

            <div className="p-4 space-y-6">

                {/* Navigation */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                    {session.exercises.map((ex, idx) => (
                        <button
                            key={ex.exerciseId}
                            onClick={() => setActiveExerciseIndex(idx)}
                            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm whitespace-nowrap transition-all ${idx === activeExerciseIndex
                                ? 'bg-primary-600 text-white shadow-md'
                                : 'bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400'
                                }`}
                        >
                            {ex.name}
                            {ex.sets.filter(s => s.completed).length > 0 && <span className="ml-1 opacity-70">({ex.sets.filter(s => s.completed).length})</span>}
                        </button>
                    ))}
                    <button
                        onClick={() => setIsAddExerciseModalOpen(true)}
                        className="flex-shrink-0 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-400 border border-transparent hover:bg-primary-200 dark:hover:bg-primary-900/60 transition-colors"
                    >
                        <Plus size={14} className="inline mr-1" /> Add Exercise
                    </button>
                </div>

                {/* Active Exercise Card */}
                <div className="animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{currentExercise.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{getExerciseTarget(currentExercise.name) || routineExerciseDef?.muscleGroup || getMuscleGroupForExercise(currentExercise.name) || 'General'}</p>
                        </div>
                        {routineExerciseDef?.videoUrl && (
                            <a href={routineExerciseDef.videoUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full">
                                <Video size={24} />
                            </a>
                        )}
                        <button
                            onClick={() => setIsTrackingSettingsModalOpen(true)}
                            className="p-2 text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                            title="Configure Tracking Columns"
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={() => setIsDeleteExerciseModalOpen(true)}
                            className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                            title="Remove Exercise"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>

                    {/* Exercise Progression Graph */}
                    {exerciseHistory.length > 1 && (
                        <div className="mb-6 h-48 w-full bg-white dark:bg-dark-card rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-2">
                            <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider ml-2">Progress Trend (Volume & Max Weight)</p>
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={exerciseHistory}>
                                    <defs>
                                        <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" hide />
                                    <YAxis yAxisId="left" hide domain={['auto', 'auto']} />
                                    <YAxis yAxisId="right" orientation="right" hide domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1f2937', borderColor: '#374151', color: '#fff', fontSize: '12px' }}
                                        itemStyle={{ color: '#fff' }}
                                        labelStyle={{ color: '#9ca3af', marginBottom: '4px' }}
                                    />
                                    <Area yAxisId="left" type="monotone" dataKey="totalVolume" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorVol)" name="Volume (kg)" />
                                    <Line yAxisId="right" type="monotone" dataKey="maxWeight" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Max Weight (kg)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Comparison Logic */}
                    {/* Comparison Logic */}
                    {lastLog ? (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 text-sm">
                            <div className="flex items-center justify-between gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-2">
                                <span className="flex items-center gap-1"><History size={14} /> Last Time ({new Date(lastLog.date || 0).toLocaleDateString()})</span>
                                <span className="text-xs opacity-75">Beat these numbers!</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                {lastLog.sets.map((s, i) => (
                                    <div key={i} className="flex-shrink-0 bg-white dark:bg-dark-card px-2 py-1 rounded border border-blue-200 dark:border-blue-800/50 text-xs">
                                        {/* Fallback logic if tracking type is missing in history */}
                                        {(s.weight > 0 && s.reps > 0) && (
                                            <span>{s.weight}kg x {s.reps}</span>
                                        )}
                                        {(s.weight === 0 && s.reps > 0) && (
                                            <span>{s.reps} reps</span>
                                        )}
                                        {s.duration > 0 && (
                                            <span>{s.duration}m</span>
                                        )}
                                        {s.distance > 0 && (
                                            <span>{s.distance}km</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 text-xs text-gray-400 italic">No previous history found for this exercise.</div>
                    )}

                </div>

                {/* Sets Table Header - Dynamic based on Type */}
                <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">
                        <div className="col-span-1">Set</div>
                        {(!currentExercise.trackingType || currentExercise.trackingType === 'reps_weight') && (
                            <>
                                <div className="col-span-3">kg</div>
                                <div className="col-span-3">Reps</div>
                                <div className="col-span-2" title="Rate of Perceived Exertion (1-10)">RPE</div>
                            </>
                        )}
                        {currentExercise.trackingType === 'reps_only' && (
                            <>
                                <div className="col-span-6">Reps</div>
                                <div className="col-span-2" title="Rate of Perceived Exertion (1-10)">RPE</div>
                            </>
                        )}
                        {currentExercise.trackingType === 'duration' && (
                            <>
                                <div className="col-span-6">Duration (min)</div>
                                <div className="col-span-2" title="Intensity (1-10)">Int</div>
                            </>
                        )}
                        {currentExercise.trackingType === 'distance_duration' && (
                            <>
                                <div className="col-span-3">Dist (km)</div>
                                <div className="col-span-3">Time (min)</div>
                                <div className="col-span-2" title="Intensity (1-10)">Int</div>
                            </>
                        )}
                        <div className="col-span-3">Done</div>
                    </div>

                    {currentExercise.sets.map((set, idx) => (
                        <div key={set.id} className={`grid grid-cols-12 gap-2 items-center transition-all ${set.completed ? 'opacity-50' : ''}`}>
                            <div className="col-span-1 flex justify-center">
                                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                    {idx + 1}
                                </div>
                            </div>

                            {(!currentExercise.trackingType || currentExercise.trackingType === 'reps_weight') && (
                                <>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            placeholder="kg"
                                            value={set.weight === 0 ? '' : set.weight}
                                            onChange={(e) => updateSet(activeExerciseIndex, idx, 'weight', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md py-2 text-center font-mono font-bold text-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            placeholder="reps"
                                            value={set.reps === 0 ? '' : set.reps}
                                            onChange={(e) => updateSet(activeExerciseIndex, idx, 'reps', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md py-2 text-center font-mono font-bold text-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            placeholder="-"
                                            max={10}
                                            value={set.rpe || ''}
                                            onChange={(e) => updateSet(activeExerciseIndex, idx, 'rpe', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md py-2 text-center font-mono text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {currentExercise.trackingType === 'reps_only' && (
                                <>
                                    <div className="col-span-6">
                                        <input
                                            type="number"
                                            placeholder="reps"
                                            value={set.reps === 0 ? '' : set.reps}
                                            onChange={(e) => updateSet(activeExerciseIndex, idx, 'reps', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md py-2 text-center font-mono font-bold text-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            placeholder="-"
                                            max={10}
                                            value={set.rpe || ''}
                                            onChange={(e) => updateSet(activeExerciseIndex, idx, 'rpe', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md py-2 text-center font-mono text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {currentExercise.trackingType === 'duration' && (
                                <>
                                    <div className="col-span-6">
                                        <input
                                            type="number"
                                            placeholder="min"
                                            value={set.duration === 0 ? '' : set.duration}
                                            onChange={(e) => updateSet(activeExerciseIndex, idx, 'duration', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md py-2 text-center font-mono font-bold text-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            placeholder="-"
                                            max={10}
                                            value={set.rpe || ''}
                                            onChange={(e) => updateSet(activeExerciseIndex, idx, 'rpe', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md py-2 text-center font-mono text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                                        />
                                    </div>
                                </>
                            )}

                            {currentExercise.trackingType === 'distance_duration' && (
                                <>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            placeholder="km"
                                            value={set.distance === 0 ? '' : set.distance}
                                            onChange={(e) => updateSet(activeExerciseIndex, idx, 'distance', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md py-2 text-center font-mono font-bold text-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <input
                                            type="number"
                                            placeholder="min"
                                            value={set.duration === 0 ? '' : set.duration}
                                            onChange={(e) => updateSet(activeExerciseIndex, idx, 'duration', e.target.value === '' ? 0 : parseFloat(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md py-2 text-center font-mono font-bold text-lg focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <input
                                            type="number"
                                            placeholder="-"
                                            max={10}
                                            value={set.rpe || ''}
                                            onChange={(e) => updateSet(activeExerciseIndex, idx, 'rpe', e.target.value === '' ? undefined : parseFloat(e.target.value))}
                                            className="w-full bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-md py-2 text-center font-mono text-sm focus:ring-2 focus:ring-yellow-500 outline-none"
                                        />
                                    </div>
                                </>
                            )}


                            <div className="col-span-3 flex justify-center gap-1">
                                <button
                                    onClick={() => updateSet(activeExerciseIndex, idx, 'completed', !set.completed)}
                                    className={`w-full h-10 rounded-md flex items-center justify-center transition-colors ${set.completed
                                        ? 'bg-green-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600'
                                        }`}
                                >
                                    <Check size={20} />
                                </button>
                                <button
                                    onClick={() => deleteSet(activeExerciseIndex, idx)}
                                    className="w-8 h-10 rounded-md flex items-center justify-center text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}

                    <Button variant="outline" className="w-full border-dashed" onClick={() => handleAddSet(activeExerciseIndex)}>
                        <Plus size={16} className="mr-2" /> Add Set
                    </Button>
                </div>

                {/* Notes */}
                <div className="mt-6">
                    <textarea
                        placeholder="Notes for this exercise..."
                        className="w-full bg-transparent border-b border-gray-200 dark:border-gray-800 py-2 text-sm focus:border-primary-500 outline-none resize-none text-gray-600 dark:text-gray-300"
                        rows={2}
                        value={currentExercise.notes || ''}
                        onChange={(e) => {
                            const updatedExercises = [...session.exercises];
                            updatedExercises[activeExerciseIndex].notes = e.target.value;
                            setSession({ ...session, exercises: updatedExercises });
                        }}
                    />
                </div>
            </div>

            {/* Quick Nav Buttons */}
            <div className="grid grid-cols-2 gap-4 mt-8">
                {activeExerciseIndex > 0 ? (
                    <Button
                        variant="secondary"
                        onClick={() => setActiveExerciseIndex(prev => prev - 1)}
                        className="w-full"
                    >
                        <ChevronLeft size={16} className="mr-2" /> Previous
                    </Button>
                ) : (
                    <div></div> // Spacer
                )}

                <Button
                    size="lg"
                    onClick={handleFinishExercise}
                    className={`w-full font-bold shadow-lg shadow-primary-500/30 ${activeExerciseIndex === session.exercises.length - 1 ? 'bg-green-600 hover:bg-green-700' : 'bg-primary-600 hover:bg-primary-700'}`}
                >
                    {activeExerciseIndex === session.exercises.length - 1 ? (
                        <span className="flex items-center gap-2">Finish Workout <Check size={18} /></span>
                    ) : (
                        <span className="flex items-center gap-2">Finish Exercise <ChevronRight size={18} /></span>
                    )}
                </Button>
            </div>

            {/* Exercise Summary Modal */}
            <Modal isOpen={isExerciseSummaryModalOpen} onClose={() => setIsExerciseSummaryModalOpen(false)} title="Exercise Summary">
                {summaryStats && (
                    <div className="space-y-6 text-center">
                        <div className="flex justify-center">
                            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center">
                                <Check size={32} strokeWidth={3} />
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Good Job!</h3>
                            <p className="text-gray-500 dark:text-gray-400">{currentExercise.name} Completed</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Total Volume</p>
                                <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                                    {summaryStats.current.volume}kg
                                </div>
                                {summaryStats.diff.volume !== 0 && (
                                    <div className={`text-xs font-bold mt-1 ${summaryStats.diff.volume > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {summaryStats.diff.volume > 0 ? '+' : ''}{summaryStats.diff.volume.toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                                <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Max Weight</p>
                                <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                                    {summaryStats.current.maxWeight}kg
                                </div>
                                {summaryStats.diff.maxWeight !== 0 && (
                                    <div className={`text-xs font-bold mt-1 ${summaryStats.diff.maxWeight > 0 ? 'text-green-500' : 'text-red-500'}`}>
                                        {summaryStats.diff.maxWeight > 0 ? '+' : ''}{summaryStats.diff.maxWeight.toFixed(1)}%
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button onClick={confirmNextExercise} className="w-full" size="lg">
                            {activeExerciseIndex < session.exercises.length - 1 ? 'Next Exercise' : 'Finish Workout'}
                        </Button>
                    </div>
                )}
            </Modal>

            {/* Body Weight Input at end of list */}
            {activeExerciseIndex === session.exercises.length - 1 && (
                <Card className="mt-8 p-4 bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
                    <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-400 font-bold">
                        <Scale size={20} /> Track Body Weight
                    </div>
                    <div className="flex gap-2">
                        <Input
                            type="number"
                            placeholder="Current Weight (kg)"
                            value={bodyWeight}
                            onChange={(e) => setBodyWeight(e.target.value)}
                        />
                    </div>
                    <p className="text-xs text-purple-600/70 mt-1">Log your weight for AI progress tracking.</p>
                </Card>
            )}
            {/* Discard Confirmation */}
            <ConfirmationModal
                isOpen={isDiscardModalOpen}
                onClose={() => setIsDiscardModalOpen(false)}
                onConfirm={() => {
                    // Save as abandoned so it can be resumed later if same day/routine
                    DatabaseService.saveAbandonedSession(session);
                    DatabaseService.saveActiveSession(null);
                    onFinish();
                }}
                title="Discard Workout?"
                message="This will cancel the current session. Since you started it, we'll save a draft in case you want to resume it later today."
                confirmText="Stop & Save Draft"
                variant="danger"
            />

            {/* Delete Exercise Confirmation */}
            <ConfirmationModal
                isOpen={isDeleteExerciseModalOpen}
                onClose={() => setIsDeleteExerciseModalOpen(false)}
                onConfirm={handleDeleteExercise}
                title="Remove Exercise?"
                message={`Are you sure you want to remove ${currentExercise?.name} from this workout ? This cannot be undone.`}
                confirmText="Remove"
                variant="danger"
            />

            {/* Tracking Settings Modal */}
            <Modal isOpen={isTrackingSettingsModalOpen} onClose={() => setIsTrackingSettingsModalOpen(false)} title="Configure Columns">
                <div className="p-4">
                    <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">Select what to track for {currentExercise?.name}:</h3>
                    <div className="space-y-3">
                        <button
                            onClick={() => handleUpdateTrackingType('reps_weight')}
                            className={`w - full p - 4 rounded - xl border - 2 flex items - center justify - between ${currentExercise?.trackingType === 'reps_weight' || !currentExercise?.trackingType
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                } `}
                        >
                            <span className="font-bold">Weight & Reps</span>
                            {(currentExercise?.trackingType === 'reps_weight' || !currentExercise?.trackingType) && <Check size={20} />}
                        </button>
                        <button
                            onClick={() => handleUpdateTrackingType('reps_only')}
                            className={`w - full p - 4 rounded - xl border - 2 flex items - center justify - between ${currentExercise?.trackingType === 'reps_only'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                } `}
                        >
                            <span className="font-bold">Reps Only</span>
                            <span className="text-xs opacity-70">Bodyweight</span>
                            {currentExercise?.trackingType === 'reps_only' && <Check size={20} />}
                        </button>

                        <button
                            onClick={() => handleUpdateTrackingType('duration')}
                            className={`w - full p - 4 rounded - xl border - 2 flex items - center justify - between ${currentExercise?.trackingType === 'duration'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                } `}
                        >
                            <span className="font-bold">Duration</span>
                            <span className="text-xs opacity-70">Time (min)</span>
                            {currentExercise?.trackingType === 'duration' && <Check size={20} />}
                        </button>

                        <button
                            onClick={() => handleUpdateTrackingType('distance_duration')}
                            className={`w - full p - 4 rounded - xl border - 2 flex items - center justify - between ${currentExercise?.trackingType === 'distance_duration'
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                                : 'border-transparent bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                } `}
                        >
                            <span className="font-bold">Cardio</span>
                            <span className="text-xs opacity-70">Dist (km) + Time</span>
                            {currentExercise?.trackingType === 'distance_duration' && <Check size={20} />}
                        </button>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button variant="ghost" onClick={() => setIsTrackingSettingsModalOpen(false)}>Cancel</Button>
                    </div>
                </div>
            </Modal>

            {/* Add Exercise Modal */}
            <Modal isOpen={isAddExerciseModalOpen} onClose={() => setIsAddExerciseModalOpen(false)} title="Add Exercise">
                <div className="h-[60vh] overflow-y-auto">
                    {/* Custom Exercise Input */}
                    <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Can't find it? Add Custom</label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Exercise Name..."
                                className="flex-1 bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                value={customExerciseName}
                                onChange={(e) => setCustomExerciseName(e.target.value)}
                            />
                            <Button
                                size="sm"
                                disabled={!customExerciseName.trim()}
                                onClick={() => {
                                    if (customExerciseName.trim()) {
                                        handleAddExercise(customExerciseName.trim(), customTrackingType, 'Custom');
                                        setCustomExerciseName('');
                                    }
                                }}
                            >
                                Add
                            </Button>
                        </div>
                        {/* Tracking Type Functionality */}
                        <div className="mt-4 mb-4">
                            <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Tracking Type</label>
                            <div className="bg-white dark:bg-dark-card rounded-lg p-1 flex gap-1 border border-gray-200 dark:border-gray-700">
                                <button onClick={() => setCustomTrackingType('reps_weight')} className={`flex - 1 py - 1.5 text - xs font - medium rounded ${customTrackingType === 'reps_weight' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'text-gray-500'} `}>
                                    Weight & Reps
                                </button>
                                <button onClick={() => setCustomTrackingType('reps_only')} className={`flex - 1 py - 1.5 text - xs font - medium rounded ${customTrackingType === 'reps_only' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'text-gray-500'} `}>
                                    Reps Only
                                </button>
                                <button onClick={() => setCustomTrackingType('duration')} className={`flex - 1 py - 1.5 text - xs font - medium rounded ${customTrackingType === 'duration' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'text-gray-500'} `}>
                                    Duration
                                </button>
                                <button onClick={() => setCustomTrackingType('distance_duration')} className={`flex - 1 py - 1.5 text - xs font - medium rounded ${customTrackingType === 'distance_duration' ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300' : 'text-gray-500'} `}>
                                    Cardio
                                </button>
                            </div>
                        </div>
                    </div>

                    {!selectedMuscle ? (
                        <div className="grid grid-cols-2 gap-3">
                            {Object.keys(COMMON_EXERCISES).map(muscle => (
                                <button
                                    key={muscle}
                                    onClick={() => setSelectedMuscle(muscle)}
                                    className="p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-primary-50 dark:hover:bg-gray-700 text-center font-bold text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 hover:border-primary-200 transition-all"
                                >
                                    {muscle}
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div>
                            <button
                                onClick={() => setSelectedMuscle(null)}
                                className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-primary-500"
                            >
                                <ChevronLeft size={16} /> Back to Categories
                            </button>
                            <h3 className="font-bold text-lg mb-3 text-gray-900 dark:text-white">{selectedMuscle}</h3>
                            <div className="space-y-2">
                                {COMMON_EXERCISES[selectedMuscle].map(ex => (
                                    <button
                                        key={ex.name}
                                        onClick={() => handleAddExercise(ex.name, ex.defaultTrackingType || 'reps_weight', selectedMuscle)}
                                        className="w-full text-left p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 flex justify-between items-center group"
                                    >
                                        <div>
                                            <div className="font-semibold text-gray-800 dark:text-gray-200">{ex.name}</div>
                                            <div className="text-xs text-gray-400">{ex.target}</div>
                                        </div>
                                        <Plus size={18} className="text-gray-300 group-hover:text-primary-500" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </Modal>
            {/* Add to Routine Confirmation */}
            <ConfirmationModal
                isOpen={isAddToRoutineModalOpen}
                onClose={() => confirmAddExercise(false)}
                onConfirm={() => confirmAddExercise(true)}
                title="Update Routine?"
                message={`Do you want to add "${pendingExercise?.name}" to your "${routine.name}" routine permanently ? `}
                confirmText="Yes, Update Routine"
                cancelText="No, Just This Workout"
            />
        </div>
    );
};