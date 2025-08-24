import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Profile as ProfileType, WeightLog } from '../types';
import toast from 'react-hot-toast';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

const Profile: React.FC = () => {
    const [profile, setProfile] = useState<ProfileType | null>(null);
    const [calorieGoal, setCalorieGoal] = useState<number>(2000);
    const [currentWeight, setCurrentWeight] = useState<string>('');
    const [weightLog, setWeightLog] =useState<WeightLog[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchProfile = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setLoading(false); return; }

        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        
        if (error) {
            console.error("Error fetching profile", error);
            toast.error('Could not fetch your profile.');
        } else if (data) {
            setProfile(data);
            setCalorieGoal(data.calorie_goal || 2000);
        }
        setLoading(false);
    }, []);

    const fetchWeightLog = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from('weight_log').select('*').eq('user_id', user.id).order('log_date', { ascending: true });
        if(error) console.error("Error fetching weight log", error);
        else setWeightLog(data || []);
    }, []);

    useEffect(() => {
        fetchProfile();
        fetchWeightLog();
    }, [fetchProfile, fetchWeightLog]);

    const handleUpdateProfile = async () => {
        if (!profile) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({ calorie_goal: calorieGoal })
            .eq('id', user.id);
        
        if(error) toast.error(error.message);
        else toast.success('Profile updated successfully!');
    };

    const handleLogWeight = async () => {
        if (!currentWeight) {
            toast.error('Please enter your current weight.');
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('weight_log').insert({
            weight_kg: parseFloat(currentWeight),
            log_date: format(new Date(), 'yyyy-MM-dd'),
            user_id: user.id
        });

        if(error) toast.error(error.message);
        else {
            toast.success('Weight logged!');
            setCurrentWeight('');
            fetchWeightLog();
        }
    };
    
    const chartData = weightLog.map(log => ({
        date: format(parseISO(log.log_date), 'MMM d'),
        weight: log.weight_kg
    }));

    if (loading) {
        return <div className="flex justify-center items-center h-full"><span className="loading loading-spinner loading-lg"></span></div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Profile & Stats</h1>
            <p className="text-gray-400">Welcome, {profile?.email || 'User'}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <div className="bg-base-200 p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Your Settings</h2>
                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label" htmlFor="calorie-goal"><span className="label-text">Daily Calorie Goal</span></label>
                            <input
                                id="calorie-goal"
                                type="number"
                                value={calorieGoal}
                                onChange={(e) => setCalorieGoal(parseInt(e.target.value))}
                                className="input input-bordered w-full"
                            />
                        </div>
                        <button onClick={handleUpdateProfile} className="btn btn-primary">
                            Update Profile
                        </button>
                    </div>
                </div>

                {/* Weight Logging */}
                <div className="bg-base-200 p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Log Your Weight</h2>
                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label" htmlFor="current-weight"><span className="label-text">Current Weight (kg)</span></label>
                            <input
                                id="current-weight"
                                type="number"
                                value={currentWeight}
                                onChange={(e) => setCurrentWeight(e.target.value)}
                                placeholder="e.g., 75.5"
                                className="input input-bordered w-full"
                            />
                        </div>
                        <button onClick={handleLogWeight} className="btn btn-secondary">
                            Log Weight
                        </button>
                    </div>
                </div>
            </div>

            {/* Weight Chart */}
            <div className="bg-base-200 p-4 rounded-lg min-h-96">
                <h2 className="text-xl font-bold mb-4">Weight Progress</h2>
                {chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" tick={{ fill: '#9ca3af' }} />
                            <YAxis domain={['dataMin - 2', 'dataMax + 2']} tick={{ fill: '#9ca3af' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                            <Legend />
                            <Line type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} name="Weight (kg)" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                        </LineChart>
                    </ResponsiveContainer>
                ) : <p className="text-center text-gray-400 h-full flex items-center justify-center">Log your weight at least twice to see a progress chart.</p>}
            </div>
        </div>
    );
};

export default Profile;