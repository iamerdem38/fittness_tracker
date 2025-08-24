import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { Exercise } from '../types';
import { Plus, Trash2, X } from './Icons';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { ResponsiveContainer, ScatterChart, XAxis, YAxis, ZAxis, Scatter, Tooltip, CartesianGrid } from 'recharts';

// Modal Component
const Modal = ({ isOpen, onClose, children, title }: { isOpen: boolean, onClose: () => void, children: React.ReactNode, title: string }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-base-200 rounded-lg p-6 w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold mb-4">{title}</h3>
                <button onClick={onClose} className="btn btn-sm btn-circle btn-ghost absolute top-2 right-2">
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
    
    const [newExerciseName, setNewExerciseName] = useState('');
    const [newExerciseDesc, setNewExerciseDesc] = useState('');
    const [newExerciseMuscle, setNewExerciseMuscle] = useState('');

    const [selectedExerciseId, setSelectedExerciseId] = useState<string>('');
    const [sets, setSets] = useState<{ weight: string, reps: string }[]>([{ weight: '', reps: '' }]);

    const fetchExercises = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase.from('exercises').select('*').eq('user_id', user.id);
        if (error) console.error('Error fetching exercises', error);
        else setExercises(data || []);
    }, []);

    const fetchWorkouts = useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data, error } = await supabase
            .from('workouts')
            .select('*, workout_sets(*, exercises(name))')
            .eq('user_id', user.id);
            
        if (error) console.error('Error fetching workouts', error);
        else {
            const formattedData = data.flatMap(w => 
                w.workout_sets.map((s: any) => ({
                    date: w.workout_date,
                    exercise: s.exercises.name,
                    value: 1
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
        if (!newExerciseName) {
            toast.error("Exercise name cannot be empty.");
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('exercises').insert({
            name: newExerciseName,
            description: newExerciseDesc,
            muscle_group: newExerciseMuscle,
            user_id: user.id
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const formattedDate = format(selectedDate, 'yyyy-MM-dd');
        
        let { data: workout, error: workoutError } = await supabase
            .from('workouts')
            .select('id')
            .eq('workout_date', formattedDate)
            .eq('user_id', user.id)
            .single();

        if (workoutError && workoutError.code !== 'PGRST116') {
             toast.error(`Error finding workout: ${workoutError.message}`);
             return;
        }
        
        if (!workout) {
            const { data: newWorkout, error: newWorkoutError } = await supabase
                .from('workouts')
                .insert({ workout_date: formattedDate, user_id: user.id })
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
                reps: parseInt(s.reps),
                user_id: user.id
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
    
    const uniqueExercises = [...new Set(workouts.map(w => w.exercise))].sort();

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-center space-y-4 md:space-y-0">
                <h1 className="text-3xl font-bold">Fitness</h1>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                    <button onClick={() => setWorkoutModalOpen(true)} className="btn btn-primary text-primary-content flex items-center justify-center">
                        <Plus className="mr-2" size={20} /> Log Workout
                    </button>
                    <button onClick={() => setExerciseModalOpen(true)} className="btn btn-secondary text-secondary-content flex items-center justify-center">
                        <Plus className="mr-2" size={20} /> Add Exercise
                    </button>
                </div>
            </div>

            <Modal isOpen={isWorkoutModalOpen} onClose={() => setWorkoutModalOpen(false)} title="Log a new Workout">
                <div className="space-y-4">
                    <div className="flex justify-center bg-base-300 rounded-lg p-2">
                        <DayPicker mode="single" selected={selectedDate} onSelect={(date) => date && setSelectedDate(date)} />
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Exercise</span></label>
                        <select
                            value={selectedExerciseId}
                            onChange={(e) => setSelectedExerciseId(e.target.value)}
                            className="select select-bordered w-full"
                        >
                            <option value="">Select an exercise</option>
                            {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                        </select>
                    </div>
                    <div className="form-control">
                        <label className="label"><span className="label-text">Sets</span></label>
                        {sets.map((set, index) => (
                            <div key={index} className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-2 mt-2">
                                <span className="w-full sm:w-12 text-center font-semibold">Set {index + 1}</span>
                                <input type="number" placeholder="Weight (kg)" value={set.weight} onChange={(e) => handleSetChange(index, 'weight', e.target.value)} className="input input-bordered w-full" />
                                <input type="number" placeholder="Reps" value={set.reps} onChange={(e) => handleSetChange(index, 'reps', e.target.value)} className="input input-bordered w-full" />
                                <button onClick={() => handleRemoveSet(index)} className="btn btn-ghost btn-square text-error"><Trash2 size={18} /></button>
                            </div>
                        ))}
                        <button onClick={handleAddSet} className="btn btn-link no-underline hover:no-underline p-0 justify-start mt-2 text-primary">+ Add Set</button>
                    </div>
                    <button onClick={handleLogWorkout} className="btn btn-primary w-full">Log Workout</button>
                </div>
            </Modal>
            
             <Modal isOpen={isExerciseModalOpen} onClose={() => setExerciseModalOpen(false)} title="Add a new Exercise">
                <div className="space-y-4">
                    <input type="text" placeholder="Exercise Name" value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} className="input input-bordered w-full" />
                    <textarea placeholder="Description (optional)" value={newExerciseDesc} onChange={(e) => setNewExerciseDesc(e.target.value)} className="textarea textarea-bordered w-full"></textarea>
                    <input type="text" placeholder="Muscle Group (optional)" value={newExerciseMuscle} onChange={(e) => setNewExerciseMuscle(e.target.value)} className="input input-bordered w-full" />
                    <button onClick={handleAddExercise} className="btn btn-primary w-full">Add Exercise</button>
                </div>
            </Modal>

            <div className="bg-base-200 p-4 rounded-lg">
                <h2 className="text-xl font-bold mb-4">Exercise Library</h2>
                <div className="max-h-60 overflow-y-auto">
                    <table className="table w-full table-zebra">
                        <thead className="sticky top-0 bg-base-300">
                            <tr>
                                <th>Name</th>
                                <th>Muscle Group</th>
                                <th className="hidden md:table-cell">Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {exercises.map(ex => (
                                <tr key={ex.id} className="hover">
                                    <td>{ex.name}</td>
                                    <td>{ex.muscle_group}</td>
                                    <td className="hidden md:table-cell">{ex.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="bg-base-200 p-4 rounded-lg min-h-96">
                <h2 className="text-xl font-bold mb-4">Workout History</h2>
                {workouts.length > 0 ? (
                    <ResponsiveContainer width="100%" height={300}>
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 60, left: 10 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                                dataKey="date" 
                                name="Date" 
                                type="category" 
                                tick={{ fill: '#9ca3af' }}
                                angle={-45}
                                textAnchor="end"
                                height={80}
                                interval={0}
                            />
                            <YAxis 
                                dataKey="exercise" 
                                name="Exercise" 
                                type="category" 
                                ticks={uniqueExercises} 
                                tick={{ fill: '#9ca3af' }}
                                width={100}
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
