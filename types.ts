
export interface Profile {
  id: string;
  username: string;
  calorie_goal: number;
}

export interface Exercise {
  id: number;
  user_id: string;
  name: string;
  description?: string;
  muscle_group?: string;
}

export interface Workout {
  id: number;
  user_id: string;
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
    user_id: string;
    name: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    serving_size_g?: number;
}

export interface FoodLog {
    id: number;
    user_id: string;
    food_item_id: number;
    log_date: string; // YYYY-MM-DD
    quantity_g: number;
    food_item?: FoodItem;
}

export interface WeightLog {
    id: number;
    user_id: string;
    log_date: string; // YYYY-MM-DD
    weight_kg: number;
}
