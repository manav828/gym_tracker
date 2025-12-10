import React, { useState, useEffect, useRef } from 'react';
import { WorkoutSession, Set, Routine } from '../types';
import { DatabaseService } from '../services/databaseService';
import { Button, Input, Card, ConfirmationModal } from './Shared';
import { Timer, Check, Plus, Trash2, Video, History, Scale, TrendingUp, ChevronLeft, X, Play, Pause } from 'lucide-react';

interface ActiveSessionProps {
    routine: Routine;
    onFinish: () => void;
    onBack: () => void;
    existingSession: WorkoutSession | null;
    onSessionUpdate: (session: WorkoutSession) => void;
}

export const ActiveSession: React.FC<ActiveSessionProps> = ({ routine, onFinish, onBack, existingSession, onSessionUpdate }) => {
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

    const timerIntervalRef = useRef<number | null>(null);
    const sessionTimerRef = useRef<number | null>(null);

    // Previous Session Data for comparison
    const [prevSession, setPrevSession] = useState<WorkoutSession | null>(null);

    useEffect(() => {
        // Find last session of this SPECIFIC routine to show "Day 1" history vs "Day 1"
        const fetchHistory = async () => {
            const allSessions = await DatabaseService.getSessions();
            const last = allSessions
                .filter(s => s.routineId === routine.id && s.id !== session.id)
                .sort((a, b) => b.startTime - a.startTime)[0];
            setPrevSession(last || null);
        };
        fetchHistory();
    }, [routine.id, session.id]);

    // Session Timer Logic (Wall-Clock Based)
    useEffect(() => {
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
    }, [isPaused]);

    // Save to local storage on every change
    useEffect(() => {
        DatabaseService.saveActiveSession(session);
        onSessionUpdate(session);
    }, [session]);

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

        // Logic: Copy previous set in current session, OR copy set from Last Session
        const currentPrevSet = updatedExercises[exerciseIndex].sets[updatedExercises[exerciseIndex].sets.length - 1];

        // If no sets yet, try to find from history
        let suggestedWeight = 0;
        let suggestedReps = 0;

        if (currentPrevSet) {
            suggestedWeight = currentPrevSet.weight;
            suggestedReps = currentPrevSet.reps;
        } else if (prevSession) {
            const prevEx = prevSession.exercises.find(e => e.exerciseId === session.exercises[exerciseIndex].exerciseId);
            if (prevEx && prevEx.sets.length > 0) {
                suggestedWeight = prevEx.sets[0].weight;
                suggestedReps = prevEx.sets[0].reps;
            }
        }

        const newSet: Set = {
            id: crypto.randomUUID(),
            reps: suggestedReps,
            weight: suggestedWeight,
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

    const finishSession = async () => {
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
            endTime: Date.now(),
            totalVolume: vol,
            bodyWeight: bodyWeight ? parseFloat(bodyWeight) : undefined
        };

        // 3. Save Session
        await DatabaseService.saveSession(finalSession);

        // 4. Also log weight to measurements table if provided
        if (bodyWeight) {
            await DatabaseService.logWeight(parseFloat(bodyWeight), finalSession.date);
        }

        DatabaseService.saveActiveSession(null);
        onFinish();
    };

    const currentExercise = session.exercises[activeExerciseIndex];
    const routineExerciseDef = routine.exercises.find(e => e.id === currentExercise.exerciseId);
    const prevSessionExercise = prevSession?.exercises.find(e => e.exerciseId === currentExercise.exerciseId);

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
                            {formatTime(session.durationSeconds)}
                            {isPaused && <span className="text-yellow-500 font-bold px-1 rounded bg-yellow-100 dark:bg-yellow-900/30">PAUSED</span>}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
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
                    <Button size="sm" onClick={finishSession} className="bg-green-600 hover:bg-green-700">Finish</Button>
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
                </div>

                {/* Active Exercise Card */}
                <div className="animate-in slide-in-from-right duration-300">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{currentExercise.name}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{routineExerciseDef?.muscleGroup}</p>
                        </div>
                        {routineExerciseDef?.videoUrl && (
                            <a href={routineExerciseDef.videoUrl} target="_blank" rel="noopener noreferrer" className="p-2 text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full">
                                <Video size={24} />
                            </a>
                        )}
                    </div>

                    {/* Comparison Logic */}
                    {prevSessionExercise ? (
                        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-900/30 text-sm">
                            <div className="flex items-center justify-between gap-2 text-blue-600 dark:text-blue-400 font-semibold mb-2">
                                <span className="flex items-center gap-1"><History size={14} /> Last Time ({new Date(prevSession?.startTime || 0).toLocaleDateString()})</span>
                                <span className="text-xs opacity-75">Beat these numbers!</span>
                            </div>
                            <div className="flex gap-2 overflow-x-auto no-scrollbar">
                                {prevSessionExercise.sets.map((s, i) => (
                                    <div key={i} className="flex-shrink-0 bg-white dark:bg-dark-card px-2 py-1 rounded border border-blue-200 dark:border-blue-800/50 text-xs">
                                        {s.weight}kg x {s.reps} {s.rpe ? `(RPE ${s.rpe})` : ''}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="mb-4 text-xs text-gray-400 italic">No previous data for this exercise in this routine.</div>
                    )}

                    {/* Sets Table */}
                    <div className="space-y-3">
                        <div className="grid grid-cols-12 gap-2 text-xs font-bold text-gray-400 uppercase tracking-wide text-center">
                            <div className="col-span-1">Set</div>
                            <div className="col-span-3">kg</div>
                            <div className="col-span-3">Reps</div>
                            <div className="col-span-2" title="Rate of Perceived Exertion (1-10)">RPE</div>
                            <div className="col-span-3">Done</div>
                        </div>

                        {currentExercise.sets.map((set, idx) => (
                            <div key={set.id} className={`grid grid-cols-12 gap-2 items-center transition-all ${set.completed ? 'opacity-50' : ''}`}>
                                <div className="col-span-1 flex justify-center">
                                    <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-500">
                                        {idx + 1}
                                    </div>
                                </div>
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
                    <Button
                        variant="secondary"
                        disabled={activeExerciseIndex === 0}
                        onClick={() => setActiveExerciseIndex(prev => prev - 1)}
                    >
                        Previous
                    </Button>
                    <Button
                        variant="primary"
                        disabled={activeExerciseIndex === session.exercises.length - 1}
                        onClick={() => setActiveExerciseIndex(prev => prev + 1)}
                    >
                        Next Exercise
                    </Button>
                </div>

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
            </div>
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
        </div>
    );
};