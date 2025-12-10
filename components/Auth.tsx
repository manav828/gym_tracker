import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Button, Input, Card } from './Shared';
import { Dumbbell, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export const Auth: React.FC = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                if (error) throw error;
            } else {
                const { error } = await supabase.auth.signUp({
                    email,
                    password
                });
                if (error) throw error;
                else {
                    // Auto login usually happens on signup, but sometimes requires email verification
                    // Supabase default is auto-confirm: false usually, but developer default for testing is often true.
                    // We'll see.
                    alert("Account created! You are now logged in.");
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary-600 text-white mb-4 shadow-lg shadow-primary-600/30">
                        <Dumbbell size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">IronLog</h1>
                    <p className="text-gray-500 dark:text-gray-400">Track your strength, visualize your progress.</p>
                </div>

                <Card className="bg-white dark:bg-dark-card shadow-xl border-0 p-8">
                    <div className="flex bg-gray-100 dark:bg-dark-bg rounded-lg p-1 mb-6">
                        <button
                            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${isLogin ? 'bg-white dark:bg-dark-card shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            onClick={() => setIsLogin(true)}
                        >
                            Log In
                        </button>
                        <button
                            className={`flex-1 py-2 rounded-md text-sm font-semibold transition-all ${!isLogin ? 'bg-white dark:bg-dark-card shadow text-gray-900 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                            onClick={() => setIsLogin(false)}
                        >
                            Sign Up
                        </button>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-4">
                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg flex items-start gap-2">
                                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        <Input
                            label="Email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            minLength={6}
                            required
                        />

                        <Button className="w-full text-base py-6 mt-4" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : (
                                <span className="flex items-center gap-2">
                                    {isLogin ? 'Sign In' : 'Create Account'} <ArrowRight size={18} />
                                </span>
                            )}
                        </Button>
                    </form>
                </Card>
                <p className="text-center text-xs text-gray-400 mt-8">
                    By confirming, you access the IronLog gym tracker system.
                </p>
            </div>
        </div>
    );
};
