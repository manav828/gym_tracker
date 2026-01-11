import React, { useState, useEffect } from 'react';
import { Users, Plus, Link2, Copy, Check, UserMinus, Calendar, Dumbbell, TrendingUp, AlertTriangle, ChevronRight, Search, MoreVertical, Mail, Clock } from 'lucide-react';
import { Button, Card, Modal, Input } from './Shared';
import { TrainerService } from '../services/trainerService';
import { Trainee, TrainerStats, TrainerInvite } from '../types';

// ============================================
// Trainer Dashboard Component
// ============================================

export const TrainerDashboard: React.FC = () => {
    const [trainees, setTrainees] = useState<Trainee[]>([]);
    const [stats, setStats] = useState<TrainerStats | null>(null);
    const [invites, setInvites] = useState<TrainerInvite[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modals
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        const [traineesData, statsData, invitesData] = await Promise.all([
            TrainerService.getTrainees(),
            TrainerService.getTrainerStats(),
            TrainerService.getInviteCodes(),
        ]);
        setTrainees(traineesData);
        setStats(statsData);
        setInvites(invitesData);
        setLoading(false);
    };

    const handleGenerateInvite = async () => {
        const invite = await TrainerService.generateInviteCode('New invite');
        if (invite) {
            setInvites([invite, ...invites]);
        }
    };

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const handleRemoveTrainee = async (traineeId: string) => {
        const success = await TrainerService.removeTrainee(traineeId);
        if (success) {
            setTrainees(trainees.filter(t => t.traineeId !== traineeId));
            setSelectedTrainee(null);
        }
    };

    const filteredTrainees = trainees.filter(t =>
        t.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const inactiveTrainees = trainees.filter(t => {
        if (!t.lastWorkoutDate) return true;
        const lastDate = new Date(t.lastWorkoutDate);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return lastDate < threeDaysAgo;
    });

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="p-4 pb-32 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Trainees</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage your training clients</p>
                </div>
                <Button onClick={() => setIsInviteModalOpen(true)} className="gap-2">
                    <Plus size={18} /> Add Trainee
                </Button>
            </div>

            {/* Stats Row */}
            {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard
                        label="Total Trainees"
                        value={stats.totalTrainees}
                        icon={Users}
                        color="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                    />
                    <StatCard
                        label="Active (3 days)"
                        value={stats.activeTrainees}
                        icon={TrendingUp}
                        color="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                    />
                    <StatCard
                        label="Inactive"
                        value={stats.inactiveTrainees}
                        icon={AlertTriangle}
                        color="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
                    />
                    <StatCard
                        label="Plans Created"
                        value={stats.totalPlansCreated}
                        icon={Dumbbell}
                        color="bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400"
                    />
                </div>
            )}

            {/* Inactive Alert */}
            {inactiveTrainees.length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                        <AlertTriangle size={18} />
                        <span className="font-semibold">{inactiveTrainees.length} trainee(s) haven't worked out in 3+ days</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {inactiveTrainees.slice(0, 3).map(t => (
                            <span key={t.id} className="text-xs bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 px-2 py-1 rounded-full">
                                {t.displayName}
                            </span>
                        ))}
                        {inactiveTrainees.length > 3 && (
                            <span className="text-xs text-amber-600 dark:text-amber-400">+{inactiveTrainees.length - 3} more</span>
                        )}
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search trainees..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800 rounded-xl border-0 focus:ring-2 focus:ring-primary-500 text-gray-900 dark:text-white"
                />
            </div>

            {/* Trainees List */}
            {filteredTrainees.length === 0 ? (
                <Card className="text-center py-12">
                    <Users size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        {searchQuery ? 'No trainees match your search' : 'No trainees yet'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={() => setIsInviteModalOpen(true)} variant="outline">
                            Generate Invite Link
                        </Button>
                    )}
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredTrainees.map(trainee => (
                        <TraineeCard
                            key={trainee.id}
                            trainee={trainee}
                            onClick={() => setSelectedTrainee(trainee)}
                        />
                    ))}
                </div>
            )}

            {/* Invite Modal */}
            <Modal isOpen={isInviteModalOpen} onClose={() => setIsInviteModalOpen(false)} title="Invite Trainee">
                <div className="space-y-4">
                    <p className="text-gray-600 dark:text-gray-300 text-sm">
                        Share this code with your trainee. They can enter it in the app to connect with you.
                    </p>

                    {invites.length === 0 ? (
                        <Button onClick={handleGenerateInvite} className="w-full">
                            <Link2 size={18} className="mr-2" /> Generate Invite Code
                        </Button>
                    ) : (
                        <div className="space-y-3">
                            {invites.filter(i => i.isActive).slice(0, 3).map(invite => (
                                <div
                                    key={invite.id}
                                    className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded-xl p-4"
                                >
                                    <div>
                                        <p className="font-mono text-xl font-bold text-primary-600 dark:text-primary-400 tracking-widest">
                                            {invite.code}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {invite.usedCount}/{invite.maxUses} uses • Expires {new Date(invite.expiresAt!).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        onClick={() => handleCopyCode(invite.code)}
                                        className="p-2"
                                    >
                                        {copiedCode === invite.code ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
                                    </Button>
                                </div>
                            ))}
                            <Button onClick={handleGenerateInvite} variant="outline" className="w-full">
                                Generate New Code
                            </Button>
                        </div>
                    )}
                </div>
            </Modal>

            {/* Trainee Detail Modal */}
            <Modal
                isOpen={!!selectedTrainee}
                onClose={() => setSelectedTrainee(null)}
                title={selectedTrainee?.displayName || 'Trainee'}
            >
                {selectedTrainee && (
                    <div className="space-y-4">
                        {/* Avatar & Info */}
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-2xl font-bold">
                                {selectedTrainee.displayName?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">{selectedTrainee.displayName}</h3>
                                {selectedTrainee.email && (
                                    <p className="text-sm text-gray-500 flex items-center gap-1">
                                        <Mail size={14} /> {selectedTrainee.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedTrainee.weeklyWorkouts || 0}</p>
                                <p className="text-xs text-gray-500">This Week</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {selectedTrainee.totalVolume ? (selectedTrainee.totalVolume / 1000).toFixed(0) + 'k' : '0'}
                                </p>
                                <p className="text-xs text-gray-500">Total Vol (kg)</p>
                            </div>
                            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-3 text-center">
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    {selectedTrainee.lastWorkoutDate
                                        ? new Date(selectedTrainee.lastWorkoutDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                                        : '--'}
                                </p>
                                <p className="text-xs text-gray-500">Last Workout</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="space-y-2 pt-4 border-t dark:border-gray-700">
                            <Button className="w-full justify-start" variant="ghost" onClick={() => window.location.hash = '#plan-builder'}>
                                <Dumbbell size={18} className="mr-3" /> Assign Workout Plan
                            </Button>
                            <Button className="w-full justify-start" variant="ghost">
                                <Calendar size={18} className="mr-3" /> View Workout History
                            </Button>
                            <Button
                                className="w-full justify-start text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                                variant="ghost"
                                onClick={() => handleRemoveTrainee(selectedTrainee.traineeId)}
                            >
                                <UserMinus size={18} className="mr-3" /> Remove Trainee
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

// ============================================
// Sub-Components
// ============================================

const StatCard: React.FC<{
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
}> = ({ label, value, icon: Icon, color }) => (
    <div className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-800">
        <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
            <Icon size={20} />
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
    </div>
);

const TraineeCard: React.FC<{
    trainee: Trainee;
    onClick: () => void;
}> = ({ trainee, onClick }) => {
    const isInactive = () => {
        if (!trainee.lastWorkoutDate) return true;
        const lastDate = new Date(trainee.lastWorkoutDate);
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        return lastDate < threeDaysAgo;
    };

    return (
        <div
            onClick={onClick}
            className="bg-white dark:bg-dark-card rounded-xl p-4 border border-gray-100 dark:border-gray-800 flex items-center gap-4 cursor-pointer hover:shadow-md transition-shadow active:scale-[0.99]"
        >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-lg flex-shrink-0">
                {trainee.displayName?.charAt(0).toUpperCase() || '?'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white truncate">{trainee.displayName}</h4>
                    {isInactive() && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-amber-500"></span>
                    )}
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                        <Dumbbell size={12} /> {trainee.weeklyWorkouts || 0} this week
                    </span>
                    <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {trainee.lastWorkoutDate
                            ? new Date(trainee.lastWorkoutDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                            : 'Never'}
                    </span>
                </div>
            </div>

            <ChevronRight size={20} className="text-gray-400 flex-shrink-0" />
        </div>
    );
};

export default TrainerDashboard;
