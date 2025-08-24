
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

    const fetchProfile = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            if (error && error.code !== 'PGRST116') {
                console.error("Error fetching profile", error);
            } else if (data) {
                setProfile(data);
                setCalorieGoal(data.calorie_goal);
            } else {
                // Create a profile if it doesn't exist
                const { data: newProfile, error: insertError } = await supabase.from('profiles').insert({ id: user.id, username: user.email }).select().single();
                if(insertError) console.error("Error creating profile", insertError);
                else {
                    setProfile(newProfile);
                    setCalorieGoal(newProfile.calorie_goal);
                }
            }
        }
    }, []);

    const fetchWeightLog = useCallback(async () => {
        const { data, error } = await supabase.from('weight_log').select('*').order('log_date', { ascending: true });
        if(error) console.error("Error fetching weight log", error);
        else setWeightLog(data || []);
    }, []);


    useEffect(() => {
        fetchProfile();
        fetchWeightLog();
    }, [fetchProfile, fetchWeightLog]);

    const handleUpdateProfile = async () => {
        if (!profile) return;
        const { error } = await supabase
            .from('profiles')
            .update({ calorie_goal: calorieGoal })
            .eq('id', profile.id);
        
        if(error) toast.error(error.message);
        else toast.success('Profile updated successfully!');
    };

    const handleLogWeight = async () => {
        if (!currentWeight) {
            toast.error('Please enter your current weight.');
            return;
        }
        const { error } = await supabase.from('weight_log').insert({
            weight_kg: parseFloat(currentWeight),
            log_date: format(new Date(), 'yyyy-MM-dd')
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

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Profile & Stats</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <div className="bg-base-200 p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Settings</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-300">Email</label>
                            <p className="text-lg text-gray-400">{profile?.id ? supabase.auth.getUser().then(u => u.data.user?.email) && profile.username : 'Loading...'}</p>
                        </div>
                        <div>
                            <label htmlFor="calorie-goal" className="block text-sm font-medium text-gray-300">Daily Calorie Goal</label>
                            <input
                                id="calorie-goal"
                                type="number"
                                value={calorieGoal}
                                onChange={(e) => setCalorieGoal(parseInt(e.target.value))}
                                className="input w-full bg-base-300 border-gray-600 mt-1"
                            />
                        </div>
                        <button onClick={handleUpdateProfile} className="btn btn-primary bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">
                            Update Profile
                        </button>
                    </div>
                </div>

                {/* Weight Logging */}
                <div className="bg-base-200 p-6 rounded-lg">
                    <h2 className="text-xl font-bold mb-4">Log Your Weight</h2>
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="current-weight" className="block text-sm font-medium text-gray-300">Current Weight (kg)</label>
                            <input
                                id="current-weight"
                                type="number"
                                value={currentWeight}
                                onChange={(e) => setCurrentWeight(e.target.value)}
                                placeholder="e.g., 75.5"
                                className="input w-full bg-base-300 border-gray-600 mt-1"
                            />
                        </div>
                        <button onClick={handleLogWeight} className="btn btn-secondary bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg">
                            Log Weight
                        </button>
                    </div>
                </div>
            </div>

            {/* Weight Chart */}
            <div className="bg-base-200 p-4 rounded-lg h-96">
                <h2 className="text-xl font-bold mb-4">Weight Progress</h2>
                {chartData.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
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
