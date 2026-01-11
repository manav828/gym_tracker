import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Search, ChevronDown, ChevronUp, Save, X, Dumbbell, Clock, Layers, GripVertical, Users } from 'lucide-react';
import { Button, Card, Modal, Input } from './Shared';
import { TrainerService } from '../services/trainerService';
import { WorkoutPlan, PlanExercise, Trainee, PlanDifficulty } from '../types';
import { COMMON_EXERCISES } from './exercisesData';

// ============================================
// Plan Builder Component
// ============================================

export const PlanBuilder: React.FC<{
    onBack?: () => void;
}> = ({ onBack }) => {
    // Form State
    const [planName, setPlanName] = useState('');
    const [description, setDescription] = useState('');
    const [difficulty, setDifficulty] = useState<PlanDifficulty>('intermediate');
    const [durationWeeks, setDurationWeeks] = useState(4);
    const [daysPerWeek, setDaysPerWeek] = useState(4);
    const [exercises, setExercises] = useState<PlanExercise[]>([]);

    // UI State
    const [isExercisePickerOpen, setIsExercisePickerOpen] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [savedPlan, setSavedPlan] = useState<WorkoutPlan | null>(null);

    // Trainees for assignment
    const [trainees, setTrainees] = useState<Trainee[]>([]);
    const [selectedTraineeIds, setSelectedTraineeIds] = useState<string[]>([]);

    useEffect(() => {
        TrainerService.getTrainees().then(setTrainees);
    }, []);

    const handleAddExercise = (name: string, muscleGroup: string) => {
        const newExercise: PlanExercise = {
            id: crypto.randomUUID(),
            name,
            muscleGroup,
            targetSets: 3,
            targetReps: 10,
            restSeconds: 90,
        };
        setExercises([...exercises, newExercise]);
        setIsExercisePickerOpen(false);
    };

    const handleRemoveExercise = (id: string) => {
        setExercises(exercises.filter(e => e.id !== id));
    };

    const handleUpdateExercise = (id: string, field: keyof PlanExercise, value: any) => {
        setExercises(exercises.map(e =>
            e.id === id ? { ...e, [field]: value } : e
        ));
    };

    const handleSavePlan = async () => {
        if (!planName.trim() || exercises.length === 0) {
            alert('Please add a name and at least one exercise');
            return;
        }

        setSaving(true);
        const plan = await TrainerService.createPlan({
            name: planName,
            description,
            difficulty,
            durationWeeks,
            daysPerWeek,
            exercises,
            isCommon: false,
            isPublic: false,
            tags: [],
        });
        setSaving(false);

        if (plan) {
            setSavedPlan(plan);
            setIsAssignModalOpen(true);
        }
    };

    const handleAssignPlan = async () => {
        if (!savedPlan || selectedTraineeIds.length === 0) return;

        for (const traineeId of selectedTraineeIds) {
            await TrainerService.assignPlan(savedPlan.id, traineeId);
        }

        alert(`Plan assigned to ${selectedTraineeIds.length} trainee(s)`);
        setIsAssignModalOpen(false);

        // Reset form
        setPlanName('');
        setDescription('');
        setExercises([]);
        setSavedPlan(null);
        setSelectedTraineeIds([]);
    };

    const toggleTraineeSelection = (traineeId: string) => {
        if (selectedTraineeIds.includes(traineeId)) {
            setSelectedTraineeIds(selectedTraineeIds.filter(id => id !== traineeId));
        } else {
            setSelectedTraineeIds([...selectedTraineeIds, traineeId]);
        }
    };

    return (
        <div className="p-4 pb-32 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                {onBack && (
                    <button onClick={onBack} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                        <X size={24} />
                    </button>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Workout Plan</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Build a plan for your trainees</p>
                </div>
            </div>

            {/* Plan Info */}
            <Card>
                <div className="space-y-4">
                    <Input
                        label="Plan Name"
                        placeholder="e.g., Push Pull Legs - Beginner"
                        value={planName}
                        onChange={(e) => setPlanName(e.target.value)}
                    />

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Description</label>
                        <textarea
                            placeholder="Describe this workout plan..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 min-h-[80px]"
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Difficulty</label>
                            <select
                                value={difficulty}
                                onChange={(e) => setDifficulty(e.target.value as PlanDifficulty)}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Duration</label>
                            <select
                                value={durationWeeks}
                                onChange={(e) => setDurationWeeks(Number(e.target.value))}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                            >
                                {[2, 4, 6, 8, 12].map(w => (
                                    <option key={w} value={w}>{w} weeks</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Days/Week</label>
                            <select
                                value={daysPerWeek}
                                onChange={(e) => setDaysPerWeek(Number(e.target.value))}
                                className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white"
                            >
                                {[2, 3, 4, 5, 6, 7].map(d => (
                                    <option key={d} value={d}>{d} days</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Exercises Section */}
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="font-bold text-gray-900 dark:text-white">Exercises ({exercises.length})</h2>
                    <Button onClick={() => setIsExercisePickerOpen(true)} size="sm">
                        <Plus size={16} className="mr-1" /> Add Exercise
                    </Button>
                </div>

                {exercises.length === 0 ? (
                    <Card className="text-center py-12">
                        <Dumbbell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <p className="text-gray-500 dark:text-gray-400 mb-4">No exercises added yet</p>
                        <Button onClick={() => setIsExercisePickerOpen(true)} variant="outline">
                            Add First Exercise
                        </Button>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {exercises.map((exercise, index) => (
                            <ExerciseCard
                                key={exercise.id}
                                exercise={exercise}
                                index={index}
                                onUpdate={(field, value) => handleUpdateExercise(exercise.id, field, value)}
                                onRemove={() => handleRemoveExercise(exercise.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Save Button */}
            <div className="fixed bottom-20 left-0 right-0 p-4 bg-white dark:bg-dark-bg border-t dark:border-gray-800">
                <div className="max-w-3xl mx-auto">
                    <Button
                        onClick={handleSavePlan}
                        className="w-full"
                        disabled={!planName.trim() || exercises.length === 0 || saving}
                    >
                        {saving ? 'Saving...' : <><Save size={18} className="mr-2" /> Save Plan</>}
                    </Button>
                </div>
            </div>

            {/* Exercise Picker Modal */}
            <ExercisePickerModal
                isOpen={isExercisePickerOpen}
                onClose={() => setIsExercisePickerOpen(false)}
                onSelect={handleAddExercise}
                existingExercises={exercises.map(e => e.name)}
            />

            {/* Assign Modal */}
            <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} title="Assign Plan to Trainees">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Plan "{savedPlan?.name}" saved! Select trainees to assign this plan to:
                    </p>

                    {trainees.length === 0 ? (
                        <div className="text-center py-8">
                            <Users size={32} className="mx-auto text-gray-400 mb-2" />
                            <p className="text-gray-500">No trainees yet. Share your invite code first!</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {trainees.map(trainee => (
                                <div
                                    key={trainee.id}
                                    onClick={() => toggleTraineeSelection(trainee.traineeId)}
                                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${selectedTraineeIds.includes(trainee.traineeId)
                                            ? 'bg-primary-100 dark:bg-primary-900/30 border-primary-500'
                                            : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'
                                        } border-2 ${selectedTraineeIds.includes(trainee.traineeId) ? 'border-primary-500' : 'border-transparent'}`}
                                >
                                    <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 font-bold">
                                        {trainee.displayName?.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900 dark:text-white">{trainee.displayName}</p>
                                        <p className="text-xs text-gray-500">{trainee.email}</p>
                                    </div>
                                    <div className={`w-5 h-5 rounded-full border-2 ${selectedTraineeIds.includes(trainee.traineeId)
                                            ? 'bg-primary-500 border-primary-500'
                                            : 'border-gray-300'
                                        } flex items-center justify-center`}>
                                        {selectedTraineeIds.includes(trainee.traineeId) && (
                                            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 12 12">
                                                <path d="M10.28 2.28L3.989 8.575 1.695 6.28A1 1 0 00.28 7.695l3 3a1 1 0 001.414 0l7-7A1 1 0 0010.28 2.28z" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button variant="ghost" onClick={() => setIsAssignModalOpen(false)} className="flex-1">
                            Skip for Now
                        </Button>
                        <Button
                            onClick={handleAssignPlan}
                            disabled={selectedTraineeIds.length === 0}
                            className="flex-1"
                        >
                            Assign to {selectedTraineeIds.length} Trainee(s)
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

// ============================================
// Exercise Card (Editable)
// ============================================

const ExerciseCard: React.FC<{
    exercise: PlanExercise;
    index: number;
    onUpdate: (field: keyof PlanExercise, value: any) => void;
    onRemove: () => void;
}> = ({ exercise, index, onUpdate, onRemove }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <Card className="overflow-hidden">
            <div className="flex items-center gap-3">
                <div className="text-gray-400 cursor-grab">
                    <GripVertical size={20} />
                </div>
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center text-primary-600 font-bold text-sm">
                    {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-white truncate">{exercise.name}</p>
                    <p className="text-xs text-gray-500">{exercise.muscleGroup}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                    <span>{exercise.targetSets}×{exercise.targetReps}</span>
                    <button onClick={() => setIsExpanded(!isExpanded)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                        {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                    <button onClick={onRemove} className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        <Trash2 size={18} />
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-4 pt-4 border-t dark:border-gray-700 grid grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Sets</label>
                        <input
                            type="number"
                            value={exercise.targetSets}
                            onChange={(e) => onUpdate('targetSets', Number(e.target.value))}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-center font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Reps</label>
                        <input
                            type="number"
                            value={exercise.targetReps}
                            onChange={(e) => onUpdate('targetReps', Number(e.target.value))}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-center font-bold"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Rest (sec)</label>
                        <input
                            type="number"
                            value={exercise.restSeconds || 90}
                            onChange={(e) => onUpdate('restSeconds', Number(e.target.value))}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-center font-bold"
                        />
                    </div>
                    <div className="col-span-3">
                        <label className="text-xs font-semibold text-gray-500 uppercase block mb-1">Notes</label>
                        <input
                            type="text"
                            placeholder="e.g., Focus on form, slow eccentric"
                            value={exercise.notes || ''}
                            onChange={(e) => onUpdate('notes', e.target.value)}
                            className="w-full bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2"
                        />
                    </div>
                </div>
            )}
        </Card>
    );
};

// ============================================
// Exercise Picker Modal
// ============================================

const ExercisePickerModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (name: string, muscleGroup: string) => void;
    existingExercises: string[];
}> = ({ isOpen, onClose, onSelect, existingExercises }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

    const muscleGroups = Object.keys(COMMON_EXERCISES);

    const filteredExercises = selectedMuscle
        ? COMMON_EXERCISES[selectedMuscle].filter(e =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            !existingExercises.includes(e.name)
        )
        : [];

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Exercise">
            <div className="space-y-4">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search exercises..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-primary-500"
                    />
                </div>

                {/* Muscle Group Tabs */}
                <div className="flex flex-wrap gap-2">
                    {muscleGroups.map(muscle => (
                        <button
                            key={muscle}
                            onClick={() => setSelectedMuscle(muscle === selectedMuscle ? null : muscle)}
                            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedMuscle === muscle
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                                }`}
                        >
                            {muscle}
                        </button>
                    ))}
                </div>

                {/* Exercise List */}
                {selectedMuscle && (
                    <div className="max-h-64 overflow-y-auto space-y-2">
                        {filteredExercises.length === 0 ? (
                            <p className="text-center text-gray-500 py-4">No exercises found</p>
                        ) : (
                            filteredExercises.map(exercise => (
                                <button
                                    key={exercise.name}
                                    onClick={() => onSelect(exercise.name, selectedMuscle)}
                                    className="w-full text-left p-3 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <p className="font-medium text-gray-900 dark:text-white">{exercise.name}</p>
                                    <p className="text-xs text-gray-500">{exercise.target}</p>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {!selectedMuscle && (
                    <p className="text-center text-gray-500 py-8">Select a muscle group above</p>
                )}
            </div>
        </Modal>
    );
};

export default PlanBuilder;
