// src/types/training.ts

export interface Exercise {
  id: string
  name: string
  description: string | null
  muscle_group: string | null
  difficulty: 'principiante' | 'intermedio' | 'avanzado' | null
  instructions: string | null
  video_url: string | null
  image_url: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TrainingDay {
  id: string
  user_id: string
  day_number: number
  day_name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface DayExercise {
  id: string
  training_day_id: string
  exercise_id: string
  sets: number
  reps: string
  rest_seconds: number
  notes: string | null
  order_index: number
  created_at: string
  exercise?: Exercise // Relación con ejercicio
}

export interface TrainingDayWithExercises extends TrainingDay {
  exercises: DayExercise[]
}

export interface TrainingSession {
  id: string
  user_id: string
  training_day_id: string | null
  start_time: string
  end_time: string | null
  duration_seconds: number | null
  completed: boolean
  notes: string | null
  created_at: string
}

export interface ExerciseSet {
  id: string
  training_session_id: string
  day_exercise_id: string | null
  exercise_id: string | null
  set_number: number
  weight_kg: number | null
  reps: number | null
  completed: boolean
  rest_seconds: number | null
  notes: string | null
  created_at: string
}

export interface TrainingSessionWithSets extends TrainingSession {
  sets: ExerciseSet[]
  training_day?: TrainingDay
}