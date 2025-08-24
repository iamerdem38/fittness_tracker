import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { FoodItem, FoodLog, Profile } from '../types';
import { Plus, ScanLine, X } from './Icons';
import { fetchFoodProductByBarcode } from '../services/foodApi';
import { Html5QrcodeScanner } from 'html5-qrcode';
import toast from 'react-hot-toast';
import { DayPicker } from 'react-day-picker';
import { format, subDays, parseISO } from 'date-fns';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';

// Modal Component
const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children: React.ReactNode, title: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-base-200 rounded-lg p-6 w-full max-w-lg relative">
                <h3 className="text-lg font-bold mb-4">{title}</h3>
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
                    <X size={24} />
                </button>
                {children}
            </div>
        </div>
    );
};

// BarcodeScanner Component
const BarcodeScanner = ({ onScanSuccess, onScanError }: { onScanSuccess: (decodedText: string) => void, onScanError: (errorMessage: string) => void }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            false
        );

        scanner.render(onScanSuccess, onScanError);

        return () => {
            scanner.clear().catch(error => {
                console.error("Failed to clear html5QrcodeScanner.", error);
            });
        };
    }, [onScanSuccess, onScanError]);

    return <div id="reader" className="w-full"></div>;
};

const Nutrition: React.FC = () => {
    const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
    const [foodLog, setFoodLog] = useState<FoodLog[]>([]);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isAddFoodModalOpen, setAddFoodModalOpen] = useState(false);
    const [isLogFoodModalOpen, setLogFoodModalOpen] = useState(false);
    const [isScannerModalOpen, setScannerModalOpen] = useState(false);
    
    const [newFood, setNewFood] = useState<Partial<FoodItem>>({});
    const [selectedFoodId, setSelectedFoodId] = useState<string>('');
    const [quantity, setQuantity] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    
    const [timeRange, setTimeRange] = useState(7);

    const fetchProfile = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (error) console.error("Error fetching profile", error);
        else setProfile(data);
    }, []);

    const fetchFoodItems = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from('food_items').select('*').eq('user_id', user.id);
        if (error) console.error('Error fetching food items', error);
        else setFoodItems(data || []);
    }, []);

    const fetchFoodLog = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const startDate = format(subDays(new Date(), timeRange), 'yyyy-MM-dd');
        const { data, error } = await supabase
            .from('food_log')
            .select('*, food_items(*)')
            .eq('user_id', user.id)
            .gte('log_date', startDate);
        if (error) console.error('Error fetching food log', error);
        else setFoodLog(data as any[] || []);
    }, [timeRange]);

    useEffect(() => {
        fetchProfile();
        fetchFoodItems();
        fetchFoodLog();
    }, [fetchProfile, fetchFoodItems, fetchFoodLog]);

    const onScanSuccess = async (decodedText: string) => {
        setScannerModalOpen(false);
        toast.loading('Fetching product info...');
        const product = await fetchFoodProductByBarcode(decodedText);
        toast.dismiss();
        if (product) {
            setNewFood({
                name: product.name,
                calories: product.calories,
                protein: product.protein,
                carbs: product.carbs,
                fat: product.fat,
                serving_size_g: 100
            });
            setAddFoodModalOpen(true);
            toast.success('Product info found!');
        } else {
            toast.error('Product not found. Please add it manually.');
            setNewFood({});
            setAddFoodModalOpen(true);
        }
    };
    
    const handleAddFoodItem = async () => {
        if (!newFood.name) {
            toast.error('Food name is required.');
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('food_items').insert({...newFood, user_id: user.id});
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Food item added to your library!');
            setAddFoodModalOpen(false);
            setNewFood({});
            fetchFoodItems();
        }
    };
    
    const handleLogFood = async () => {
        if (!selectedFoodId || !quantity) {
            toast.error('Please select a food and enter quantity.');
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('food_log').insert({
            food_item_id: parseInt(selectedFoodId),
            quantity_g: parseFloat(quantity),
            log_date: format(selectedDate, 'yyyy-MM-dd'),
            user_id: user.id
        });
        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Food logged!');
            setLogFoodModalOpen(false);
            setSelectedFoodId('');
            setQuantity('');
            fetchFoodLog();
        }
    };

    const calorieData = foodLog.reduce((acc, log) => {
        const date = log.log_date;
        if (!log.food_items) return acc;
        const calories = ((log.food_items.calories || 0) / (log.food_items.serving_size_g || 100)) * log.quantity_g;
        acc[date] = (acc[date] || 0) + calories;
        return acc;
    }, {} as Record<string, number>);

    const chartData = Object.entries(calorieData).map(([date, calories]) => ({
        originalDate: date,
        date: format(parseISO(date), 'MMM d'),
        calories: Math.round(Number(calories))
    })).sort((a, b) => parseISO(a.originalDate).getTime() - parseISO(b.originalDate).getTime());

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Nutrition</h1>
                <div className="flex space-x-2">
                    <button onClick={() => setLogFoodModalOpen(true)} className="btn btn-primary text-primary-content flex items-center">
                        <Plus className="mr-2" size={20} /> Log Food
                    </button>
                    <button onClick={() => { setNewFood({}); setAddFoodModalOpen(true); }} className="btn btn-secondary text-secondary-content flex items-center">
                        <Plus className="mr-2" size={20} /> Add Food Item
                    </button>
                    <button onClick={() => setScannerModalOpen(true)} className="btn btn-accent text-accent-content flex items-center">
                        <ScanLine className="mr-2" size={20} /> Scan Barcode
                    </button>
                </div>
            </div>

            {/* Log Food Modal */}
            <Modal isOpen={isLogFoodModalOpen} onClose={() => setLogFoodModalOpen(false)} title="Log Food Intake">
                 <div className="space-y-4">
                     <div className="flex justify-center bg-base-300 rounded-lg p-2">
                        <DayPicker mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Food Item</span></label>
                        <select
                            value={selectedFoodId}
                            onChange={(e) => setSelectedFoodId(e.target.value)}
                            className="select select-bordered w-full"
                        >
                            <option value="">Select a food</option>
                            {foodItems.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
                        </select>
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Quantity (grams)</span></label>
                        <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} placeholder="e.g., 200" className="input input-bordered w-full" />
                    </div>
                    <button onClick={handleLogFood} className="btn btn-primary w-full">Log Food</button>
                 </div>
            </Modal>
            
            {/* Add Food Modal */}
            <Modal isOpen={isAddFoodModalOpen} onClose={() => setAddFoodModalOpen(false)} title="Add Food to Library">
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" placeholder="Name" value={newFood.name || ''} onChange={(e) => setNewFood({...newFood, name: e.target.value})} className="input input-bordered col-span-2" />
                    <input type="number" placeholder="Calories per 100g" value={newFood.calories || ''} onChange={(e) => setNewFood({...newFood, calories: parseFloat(e.target.value)})} className="input input-bordered" />
                    <input type="number" placeholder="Protein per 100g" value={newFood.protein || ''} onChange={(e) => setNewFood({...newFood, protein: parseFloat(e.target.value)})} className="input input-bordered" />
                    <input type="number" placeholder="Carbs per 100g" value={newFood.carbs || ''} onChange={(e) => setNewFood({...newFood, carbs: parseFloat(e.target.value)})} className="input input-bordered" />
                    <input type="number" placeholder="Fat per 100g" value={newFood.fat || ''} onChange={(e) => setNewFood({...newFood, fat: parseFloat(e.target.value)})} className="input input-bordered" />
                    <button onClick={handleAddFoodItem} className="btn btn-primary col-span-2">Add Food</button>
                </div>
            </Modal>
            
            {/* Barcode Scanner Modal */}
            <Modal isOpen={isScannerModalOpen} onClose={() => setScannerModalOpen(false)} title="Scan Barcode">
                <BarcodeScanner onScanSuccess={onScanSuccess} onScanError={(err) => { /* console.log(err) */ }} />
            </Modal>

            {/* Daily Calories Chart */}
            <div className="bg-base-200 p-4 rounded-lg min-h-96">
                 <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Daily Calorie Intake</h2>
                    <select value={timeRange} onChange={e => setTimeRange(parseInt(e.target.value))} className="select select-bordered">
                        <option value={7}>Last 7 Days</option>
                        <option value={30}>Last 30 Days</option>
                        <option value={90}>Last 90 Days</option>
                    </select>
                 </div>
                 {chartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis dataKey="date" tick={{ fill: '#9ca3af' }} />
                            <YAxis tick={{ fill: '#9ca3af' }} />
                            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                            <Legend />
                            <Bar dataKey="calories" fill="#3b82f6" name="Total Calories" />
                            {profile?.calorie_goal && (
                                <ReferenceLine y={profile.calorie_goal} label={{ value: 'Goal', fill: '#f59e0b', position: 'insideTopLeft' }} stroke="#f59e0b" strokeDasharray="3 3" />
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                 ) : <p className="text-center text-gray-400">No nutrition data available. Log your food to see it here.</p>}
            </div>
        </div>
    );
};

export default Nutrition;
