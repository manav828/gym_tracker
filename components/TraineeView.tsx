import React, { useState, useEffect } from 'react';
import { User, Dumbbell, Calendar, ChevronRight, Award, TrendingUp, Star, Mail, Phone, Clock, Target, CheckCircle } from 'lucide-react';
import { Button, Card, Modal } from './Shared';
import { TrainerService } from '../services/trainerService';
import { AssignedPlan, WorkoutPlan, PlanExercise } from '../types';

// ============================================
// Trainee View Component
// Shows trainer info and assigned plan for trainees
// ============================================

export const TraineeView: React.FC = () => {
    const [trainer, setTrainer] = useState<{ id: string; name: string; email?: string; avatarUrl?: string } | null>(null);
    const [assignedPlan, setAssignedPlan] = useState<AssignedPlan | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(0);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [trainerData, planData] = await Promise.all([
            TrainerService.getMyTrainer(),
            TrainerService.getMyAssignedPlan(),
        ]);
        setTrainer(trainerData);
        setAssignedPlan(planData);
        setLoading(false);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // Group exercises by day
    const exercisesByDay: PlanExercise[][] = [];
    if (assignedPlan?.plan?.exercises) {
        const daysPerWeek = assignedPlan.plan.daysPerWeek || 4;
        for (let i = 0; i < daysPerWeek; i++) {
            exercisesByDay.push(
                assignedPlan.plan.exercises.filter(e => (e.dayIndex ?? 0) === i || (!e.dayIndex && i === 0))
            );
        }
        // If no day assignments, put all in first day
        if (exercisesByDay[0].length === 0 && assignedPlan.plan.exercises.length > 0) {
            exercisesByDay[0] = assignedPlan.plan.exercises;
        }
    }

    return (
        <div className="p-4 pb-32 space-y-6">
            {/* Trainer Card */}
            {trainer ? (
                <Card className="bg-gradient-to-br from-primary-500 to-primary-700 text-white border-0">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                            {trainer.avatarUrl ? (
                                <img src={trainer.avatarUrl} alt={trainer.name} className="w-full h-full rounded-full object-cover" />
                            ) : (
                                <User size={32} />
                            )}
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-white/70 uppercase tracking-wider font-semibold">Your Personal Trainer</p>
                            <h2 className="text-xl font-bold">{trainer.name}</h2>
                            {trainer.email && (
                                <p className="text-sm text-white/80 flex items-center gap-1 mt-1">
                                    <Mail size={14} /> {trainer.email}
                                </p>
                            )}
                        </div>
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Star size={20} />
                        </div>
                    </div>
                    <div className="mt-4 pt-4 border-t border-white/20">
                        <p className="text-sm text-white/80">
                            <CheckCircle size={14} className="inline mr-1" />
                            Your trainer can view your workout progress and adjust your plan
                        </p>
                    </div>
                </Card>
            ) : (
                <Card className="text-center py-8">
                    <User size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">No trainer connected</p>
                    <JoinTrainerButton onJoined={loadData} />
                </Card>
            )}

            {/* Assigned Plan */}
            {assignedPlan?.plan ? (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Your Workout Plan</h2>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${assignedPlan.plan.difficulty === 'beginner' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                assignedPlan.plan.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                            {assignedPlan.plan.difficulty}
                        </span>
                    </div>

                    {/* Plan Info Card */}
                    <Card>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{assignedPlan.plan.name}</h3>
                        {assignedPlan.plan.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{assignedPlan.plan.description}</p>
                        )}
                        <div className="flex gap-4 text-sm">
                            <div className="flex items-center gap-1 text-gray-500">
                                <Calendar size={16} />
                                <span>{assignedPlan.plan.durationWeeks} weeks</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                                <Dumbbell size={16} />
                                <span>{assignedPlan.plan.daysPerWeek} days/week</span>
                            </div>
                            <div className="flex items-center gap-1 text-gray-500">
                                <Target size={16} />
                                <span>{assignedPlan.plan.exercises.length} exercises</span>
                            </div>
                        </div>
                    </Card>

                    {/* Day Tabs */}
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {Array.from({ length: assignedPlan.plan.daysPerWeek }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setSelectedDay(i)}
                                className={`px-4 py-2 rounded-xl font-semibold transition-colors flex-shrink-0 ${selectedDay === i
                                        ? 'bg-primary-500 text-white'
                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                    }`}
                            >
                                Day {i + 1}
                            </button>
                        ))}
                    </div>

                    {/* Exercises for Selected Day */}
                    <div className="space-y-3">
                        {exercisesByDay[selectedDay]?.length > 0 ? (
                            exercisesByDay[selectedDay].map((exercise, index) => (
                                <ExerciseCard key={exercise.id} exercise={exercise} index={index} />
                            ))
                        ) : (
                            <Card className="text-center py-8">
                                <p className="text-gray-500">No exercises for this day</p>
                            </Card>
                        )}
                    </div>

                    {/* Start Workout Button */}
                    <Button className="w-full" onClick={() => window.location.hash = '#workouts'}>
                        <Dumbbell size={18} className="mr-2" /> Start Today's Workout
                    </Button>
                </div>
            ) : trainer ? (
                <Card className="text-center py-12">
                    <Dumbbell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <h3 className="font-bold text-gray-900 dark:text-white mb-2">No Active Plan</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                        Your trainer hasn't assigned a workout plan yet. They'll add one soon!
                    </p>
                </Card>
            ) : null}
        </div>
    );
};

// ============================================
// Exercise Card for Trainee View
// ============================================

const ExerciseCard: React.FC<{
    exercise: PlanExercise;
    index: number;
}> = ({ exercise, index }) => (
    <Card className="flex items-center gap-4">
        <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/30 rounded-xl flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold">
            {index + 1}
        </div>
        <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{exercise.name}</h4>
            <p className="text-xs text-gray-500">{exercise.muscleGroup}</p>
        </div>
        <div className="text-right">
            <p className="font-bold text-gray-900 dark:text-white">{exercise.targetSets} × {exercise.targetReps}</p>
            {exercise.restSeconds && (
                <p className="text-xs text-gray-500 flex items-center justify-end gap-1">
                    <Clock size={12} /> {exercise.restSeconds}s rest
                </p>
            )}
        </div>
        <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
    </Card>
);

// ============================================
// Join Trainer Button & Modal
// ============================================

const JoinTrainerButton: React.FC<{ onJoined: () => void }> = ({ onJoined }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async () => {
        if (!code.trim()) return;

        setLoading(true);
        setError(null);

        const result = await TrainerService.joinTrainer(code.trim());

        setLoading(false);

        if (result.success) {
            alert(`Successfully connected with ${result.trainerName}!`);
            setIsOpen(false);
            setCode('');
            onJoined();
        } else {
            setError(result.error || 'Failed to join trainer');
        }
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>
                Join a Trainer
            </Button>

            <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Join a Trainer">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Enter the invite code your trainer shared with you:
                    </p>

                    {error && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg">
                            {error}
                        </div>
                    )}

                    <input
                        type="text"
                        placeholder="Enter code (e.g., ABCD1234)"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="w-full text-center font-mono text-2xl tracking-widest bg-gray-100 dark:bg-gray-800 border-0 rounded-xl p-4 focus:ring-2 focus:ring-primary-500"
                        maxLength={8}
                    />

                    <Button onClick={handleJoin} className="w-full" disabled={!code.trim() || loading}>
                        {loading ? 'Joining...' : 'Join Trainer'}
                    </Button>
                </div>
            </Modal>
        </>
    );
};

export default TraineeView;
