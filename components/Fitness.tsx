
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Exercise, Workout, WorkoutSet } from '../types';
import { Plus, Trash2, CalendarIcon, ChevronLeft, ChevronRight, X } from './Icons';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { ResponsiveContainer, ScatterChart, XAxis, YAxis, ZAxis, Scatter, Tooltip, CartesianGrid } from 'recharts';

// Modal Component defined within Fitness.tsx
const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children: React.ReactNode, title: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-base-200 rounded-lg p-6 w-full max-w-lg relative">
                <h3 className="text-lg font-bold mb-4">{title}</h3>
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
                    <X size={24} />
                </button>
                {children}
            </div>
        </div>
    );
};

const Fitness: React.FC = () => {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [isExerciseModalOpen, setExerciseModalOpen] = useState(false);
    const [isWorkoutModalOpen, setWorkoutModalOpen] = useState(false);
    
    // States for Exercise Modal
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseDesc, setNewExerciseDesc] = useState('');
    const [newExerciseMuscle, setNewExerciseMuscle] = useState('');

    // States for Workout Log Modal
    const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
    const [sets, setSets] = useState<{ weight: string, reps: string }[]>([{ weight: '', reps: '' }]);

    const fetchExercises = useCallback(async () => {
        const { data, error } = await supabase.from('exercises').select('*');
        if (error) console.error('Error fetching exercises', error);
        else setExercises(data || []);
    }, []);

    const fetchWorkouts = useCallback(async () => {
        const { data, error } = await supabase
            .from('workouts')
            .select('*, workout_sets(*, exercises(name))')
        if (error) console.error('Error fetching workouts', error);
        else {
            const formattedData = data.flatMap(w => 
                w.workout_sets.map((s: any) => ({
                    date: w.workout_date,
                    exercise: s.exercises.name,
                    value: 1 // for heatmap color
                }))
            );
            setWorkouts(formattedData);
        }
    }, []);

    useEffect(() => {
        fetchExercises();
        fetchWorkouts();
    }, [fetchExercises, fetchWorkouts]);

    const handleAddExercise = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user || !newExerciseName) return;

        const { error } = await supabase.from('exercises').insert({
            user_id: user.id,
            name: newExerciseName,
            description: newExerciseDesc,
            muscle_group: newExerciseMuscle
        });

        if (error) {
            toast.error(error.message);
        } else {
            toast.success('Exercise added!');
            setNewExerciseName('');
            setNewExerciseDesc('');
            setNewExerciseMuscle('');
            setExerciseModalOpen(false);
            fetchExercises();
        }
    };
    
    const handleAddSet = () => setSets([...sets, { weight: '', reps: '' }]);
    const handleRemoveSet = (index: number) => setSets(sets.filter((_, i) => i !== index));
    const handleSetChange = (index: number, field: 'weight' | 'reps', value: string) => {
        const newSets = [...sets];
        newSets[index][field] = value;
        setSets(newSets);
    };

    const handleLogWorkout = async () => {
        if (!selectedExerciseId) {
            toast.error('Please select an exercise.');
            return;
        }

        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        
        let { data: workout, error: workoutError } = await supabase
            .from('workouts')
            .select('id')
            .eq('workout_date', formattedDate)
            .single();

        if (workoutError && workoutError.code !== 'PGRST116') { // PGRST116: no rows found
             toast.error(`Error finding workout: ${workoutError.message}`);
             return;
        }
        
        if (!workout) {
            const { data: newWorkout, error: newWorkoutError } = await supabase
                .from('workouts')
                .insert({ workout_date: formattedDate })
                .select('id')
                .single();
            if (newWorkoutError) {
                toast.error(`Error creating workout: ${newWorkoutError.message}`);
                return;
            }
            workout = newWorkout;
        }

        const setsToInsert = sets
            .filter(s => s.reps && s.weight)
            .map((s, i) => ({
                workout_id: workout.id,
                exercise_id: parseInt(selectedExerciseId),
                set_number: i + 1,
                weight: parseFloat(s.weight),
                reps: parseInt(s.reps)
            }));
            
        if (setsToInsert.length === 0) {
            toast.error('Please fill in at least one set.');
            return;
        }

        const { error: setsError } = await supabase.from('workout_sets').insert(setsToInsert);

        if (setsError) {
            toast.error(`Error logging sets: ${setsError.message}`);
        } else {
            toast.success('Workout logged successfully!');
            setWorkoutModalOpen(false);
            setSelectedExerciseId('');
            setSets([{ weight: '', reps: '' }]);
            fetchWorkouts();
        }
    };
    
    const uniqueExercises = [...new Set(workouts.map(w => w.exercise))];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Fitness</h1>
                <div className="flex space-x-2">
                    <button onClick={() => setWorkoutModalOpen(true)} className="btn btn-primary bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        <Plus className="mr-2" size={20} /> Log Workout
                    </button>
                    <button onClick={() => setExerciseModalOpen(true)} className="btn bg-secondary hover:bg-secondary-focus text-white font-bold py-2 px-4 rounded-lg flex items-center">
                        <Plus className="mr-2" size={20} /> Add Exercise
                    </button>
                </div>
            </div>

            {/* Workout Logger */}
            <Modal isOpen={isWorkoutModalOpen} onClose={() => setWorkoutModalOpen(false)} title="Log a new Workout">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Date</label>
                        <DayPicker mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} 
                         styles={{
                            root: { backgroundColor: '#374151', color: 'white', borderRadius: '0.5rem', padding: '1rem' },
                            caption: { color: '#10b981' },
                            day: { color: 'white' },
                            day_selected: { backgroundColor: '#10b981', color: 'white' },
                            day_today: { color: '#f59e0b' },
                         }}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Exercise</label>
                        <select
                            value={selectedExerciseId}
                            onChange={(e) => setSelectedExerciseId(e.target.value)}
                            className="mt-1 block w-full bg-base-300 border border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary focus:border-primary"
                        >
                            <option value="">Select an exercise</option>
                            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300">Sets</label>
                        {sets.map((set, index) => (
                            <div key={index} className="flex items-center space-x-2 mt-2">
                                <span className="text-gray-400">Set {index + 1}</span>
                                <input type="number" placeholder="Weight (kg)" value={set.weight} onChange={(e) => handleSetChange(index, 'weight', e.target.value)} className="input w-full bg-base-300 border-gray-600 rounded-md p-2" />
                                <input type="number" placeholder="Reps" value={set.reps} onChange={(e) => handleSetChange(index, 'reps', e.target.value)} className="input w-full bg-base-300 border-gray-600 rounded-md p-2" />
                                <button onClick={() => handleRemoveSet(index)} className="text-red-500 hover:text-red-400 p-1"><Trash2 size={18} /></button>
                            </div>
                        ))}
                        <button onClick={handleAddSet} className="mt-2 text-sm text-primary hover:text-primary-focus">+ Add Set</button>
                    </div>
                    <button onClick={handleLogWorkout} className="w-full btn btn-primary bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">Log Workout</button>
                </div>
            </Modal>
            
            {/* Exercise Library Modal */}
             <Modal isOpen={isExerciseModalOpen} onClose={() => setExerciseModalOpen(false)} title="Add a new Exercise">
                <div className="space-y-4">
                    <input type="text" placeholder="Exercise Name" value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} className="input w-full bg-base-300 border-gray-600" />
                    <textarea placeholder="Description" value={newExerciseDesc} onChange={(e) => setNewExerciseDesc(e.target.value)} className="textarea w-full bg-base-300 border-gray-600"></textarea>
                    <input type="text" placeholder="Muscle Group" value={newExerciseMuscle} onChange={(e) => setNewExerciseMuscle(e.target.value)} className="input w-full bg-base-300 border-gray-600" />
                    <button onClick={handleAddExercise} className="w-full btn btn-primary bg-primary hover:bg-primary-focus text-white font-bold py-2 px-4 rounded-lg">Add Exercise</button>
                </div>
            </Modal>

            {/* Exercise List */}
            <div className="bg-base-200 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Exercise Library</h2>
                <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left">
                        <thead className="sticky top-0 bg-base-300">
                            <tr>
                                <th className="p-2">Name</th>
                                <th className="p-2">Muscle Group</th>
                                <th className="p-2">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exercises.map(ex => (
                                <tr key={ex.id} className="border-b border-base-300">
                                    <td className="p-2">{ex.name}</td>
                                    <td className="p-2">{ex.muscle_group}</td>
                                    <td className="p-2">{ex.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Workout Heatmap */}
            <div className="bg-base-200 p-4 rounded-lg h-96">
                <h2 className="text-xl font-bold mb-4">Workout History</h2>
                {workouts.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 40, left: 100 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                                dataKey="date" 
                                name="Date" 
                                type="category" 
                                tick={{ fill: '#9ca3af' }}
                                angle={-45}
                                textAnchor="end"
                            />
                            <YAxis 
                                dataKey="exercise" 
                                name="Exercise" 
                                type="category" 
                                ticks={uniqueExercises} 
                                tick={{ fill: '#9ca3af' }}
                                width={120}
                            />
                            <ZAxis dataKey="value" range={[100, 100]} />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }} />
                            <Scatter name="Workouts" data={workouts} fill="#10b981" shape="square" />
                        </ScatterChart>
                    </ResponsiveContainer>
                ) : <p className="text-center text-gray-400">No workout data available. Log a workout to see it here.</p>}
            </div>
        </div>
    );
};

export default Fitness;
