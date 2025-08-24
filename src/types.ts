
export interface AppSettings {
  id: number;
  calorie_goal: number;
}

export interface Exercise {
  id: number;
  name: string;
  description?: string;
  muscle_group?: string;
}

export interface Workout {
  id: number;
  workout_date: string; // YYYY-MM-DD
}

export interface WorkoutSet {
  id?: number;
  workout_id: number;
  exercise_id: number;
  set_number: number;
  weight?: number;
  reps?: number;
}

export interface FullWorkoutSet extends WorkoutSet {
    exercise?: Exercise;
}

export interface FoodItem {
    id: number;
    name: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    serving_size_g?: number;
}

export interface FoodLog {
    id: number;
    food_item_id: number;
    log_date: string; // YYYY-MM-DD
    quantity_g: number;
    food_item?: FoodItem;
}

export interface WeightLog {
    id: number;
    log_date: string; // YYYY-MM-DD
    weight_kg: number;
}
