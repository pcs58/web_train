// src/composables/useTraining.ts
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { TrainingDay, Exercise, DayExercise, TrainingDayWithExercises } from '../types/training'

export function useTraining() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Obtener todos los días de entrenamiento del usuario
  async function getTrainingDays(userId: string): Promise<TrainingDayWithExercises[]> {
    loading.value = true
    error.value = null

    try {
      // Obtener días
      const { data: days, error: daysError } = await supabase
        .from('training_days')
        .select('*')
        .eq('user_id', userId)
        .order('day_number')

      if (daysError) throw daysError

      // Para cada día, obtener sus ejercicios
      const daysWithExercises = await Promise.all(
        (days || []).map(async (day) => {
          const { data: dayExercises, error: exError } = await supabase
            .from('day_exercises')
            .select(`
              *,
              exercise:exercises(*)
            `)
            .eq('training_day_id', day.id)
            .order('order_index')

          if (exError) throw exError

          return {
            ...day,
            exercises: dayExercises || []
          }
        })
      )

      return daysWithExercises
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  // Crear día de entrenamiento
  async function createTrainingDay(userId: string, dayNumber: number, dayName: string, description?: string) {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('training_days')
        .insert({
          user_id: userId,
          day_number: dayNumber,
          day_name: dayName,
          description: description || null
        })
        .select()
        .single()

      if (createError) throw createError
      return data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Agregar ejercicio a un día
  async function addExerciseToDay(
    trainingDayId: string,
    exerciseId: string,
    sets: number = 3,
    reps: string = '10-12',
    restSeconds: number = 60,
    orderIndex: number = 0
  ) {
    loading.value = true
    error.value = null

    try {
      const { data, error: insertError } = await supabase
        .from('day_exercises')
        .insert({
          training_day_id: trainingDayId,
          exercise_id: exerciseId,
          sets,
          reps,
          rest_seconds: restSeconds,
          order_index: orderIndex
        })
        .select()
        .single()

      if (insertError) throw insertError
      return data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Eliminar ejercicio de un día
  async function removeExerciseFromDay(dayExerciseId: string) {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('day_exercises')
        .delete()
        .eq('id', dayExerciseId)

      if (deleteError) throw deleteError
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Obtener todos los ejercicios disponibles
  async function getAllExercises(): Promise<Exercise[]> {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('exercises')
        .select('*')
        .order('name')

      if (fetchError) throw fetchError
      return data || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  // Crear ejercicio (solo admin)
  async function createExercise(exercise: Partial<Exercise>) {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('exercises')
        .insert(exercise)
        .select()
        .single()

      if (createError) throw createError
      return data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Actualizar ejercicio (solo admin)
  async function updateExercise(id: string, updates: Partial<Exercise>) {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (updateError) throw updateError
      return data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Eliminar ejercicio (solo admin)
  async function deleteExercise(id: string) {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('exercises')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Actualizar orden de ejercicios en un día
  async function updateExerciseOrder(dayExerciseId: string, newOrder: number) {
    loading.value = true
    error.value = null

    try {
      const { error: updateError } = await supabase
        .from('day_exercises')
        .update({ order_index: newOrder })
        .eq('id', dayExerciseId)

      if (updateError) throw updateError
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // NUEVAS FUNCIONES PARA SESIONES DE ENTRENAMIENTO

  // Crear sesión de entrenamiento
  async function createTrainingSession(userId: string, trainingDayId: string) {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('training_sessions')
        .insert({
          user_id: userId,
          training_day_id: trainingDayId,
          start_time: new Date().toISOString()
        })
        .select()
        .single()

      if (createError) throw createError
      return data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Finalizar sesión de entrenamiento
  async function finishTrainingSession(sessionId: string, startTime: string) {
    loading.value = true
    error.value = null

    try {
      const endTime = new Date()
      const start = new Date(startTime)
      const durationSeconds = Math.floor((endTime.getTime() - start.getTime()) / 1000)

      const { error: updateError } = await supabase
        .from('training_sessions')
        .update({
          end_time: endTime.toISOString(),
          duration_seconds: durationSeconds,
          completed: true
        })
        .eq('id', sessionId)

      if (updateError) throw updateError
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Registrar un set
  async function createExerciseSet(
    sessionId: string,
    dayExerciseId: string,
    exerciseId: string,
    setNumber: number,
    weight: number | null,
    reps: number | null,
    restSeconds: number | null
  ) {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('exercise_sets')
        .insert({
          training_session_id: sessionId,
          day_exercise_id: dayExerciseId,
          exercise_id: exerciseId,
          set_number: setNumber,
          weight_kg: weight,
          reps: reps,
          rest_seconds: restSeconds,
          completed: true
        })
        .select()
        .single()

      if (createError) throw createError
      return data
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Obtener historial de sesiones
  async function getTrainingSessions(userId: string) {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('training_sessions')
        .select(`
          *,
          training_day:training_days(*)
        `)
        .eq('user_id', userId)
        .order('start_time', { ascending: false })

      if (fetchError) throw fetchError
      return data || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  // Obtener sets de una sesión
  async function getSessionSets(sessionId: string) {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('exercise_sets')
        .select(`
          *,
          exercise:exercises(*)
        `)
        .eq('training_session_id', sessionId)
        .order('created_at')

      if (fetchError) throw fetchError
      return data || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    getTrainingDays,
    createTrainingDay,
    addExerciseToDay,
    removeExerciseFromDay,
    getAllExercises,
    createExercise,
    updateExercise,
    deleteExercise,
    updateExerciseOrder,
    createTrainingSession,
    finishTrainingSession,
    createExerciseSet,
    getTrainingSessions,
    getSessionSets,
  }
}