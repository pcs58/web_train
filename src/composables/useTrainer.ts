// src/composables/useTrainer.ts
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { 
  TrainingTemplate, 
  TemplateDay, 
  TemplateDayExercise,
  TrainingTemplateComplete,
  TemplateAssignment,
  Exercise 
} from '../types/training'

export function useTrainer() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // TEMPLATES - Crear plantilla
  async function createTemplate(trainerId: string, name: string, description?: string) {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('training_templates')
        .insert({
          trainer_id: trainerId,
          name,
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

  // Obtener plantillas del entrenador
  async function getTrainerTemplates(trainerId: string): Promise<TrainingTemplate[]> {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('training_templates')
        .select('*')
        .eq('trainer_id', trainerId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      return data || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  // Obtener plantilla completa con días y ejercicios
  async function getTemplateComplete(templateId: string): Promise<TrainingTemplateComplete | null> {
    loading.value = true
    error.value = null

    try {
      // Obtener plantilla
      const { data: template, error: templateError } = await supabase
        .from('training_templates')
        .select('*')
        .eq('id', templateId)
        .single()

      if (templateError) throw templateError

      // Obtener días
      const { data: days, error: daysError } = await supabase
        .from('template_days')
        .select('*')
        .eq('template_id', templateId)
        .order('day_number')

      if (daysError) throw daysError

      // Para cada día, obtener ejercicios
      const daysWithExercises = await Promise.all(
        (days || []).map(async (day) => {
          const { data: exercises, error: exError } = await supabase
            .from('template_day_exercises')
            .select(`
              *,
              exercise:exercises(*)
            `)
            .eq('template_day_id', day.id)
            .order('order_index')

          if (exError) throw exError

          return {
            ...day,
            exercises: exercises || []
          }
        })
      )

      return {
        ...template,
        days: daysWithExercises
      }
    } catch (e: any) {
      error.value = e.message
      return null
    } finally {
      loading.value = false
    }
  }

  // TEMPLATE DAYS - Crear día en plantilla
  async function createTemplateDay(
    templateId: string,
    dayNumber: number,
    dayName: string,
    description?: string
  ) {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('template_days')
        .insert({
          template_id: templateId,
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

  // Agregar ejercicio a día de plantilla
  async function addExerciseToTemplateDay(
    templateDayId: string,
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
        .from('template_day_exercises')
        .insert({
          template_day_id: templateDayId,
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

  // EJERCICIOS - Crear ejercicio de entrenador
  async function createTrainerExercise(trainerId: string, exercise: Partial<Exercise>) {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('exercises')
        .insert({
          ...exercise,
          scope: 'trainer',
          owner_id: trainerId
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

  // Crear ejercicio personal (usuario)
  async function createPersonalExercise(userId: string, exercise: Partial<Exercise>) {
    loading.value = true
    error.value = null

    try {
      const { data, error: createError } = await supabase
        .from('exercises')
        .insert({
          ...exercise,
          scope: 'personal',
          owner_id: userId
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

  // Obtener ejercicios disponibles para usuario (global + trainer + personal)
  async function getAvailableExercises(userId: string, trainerId?: string): Promise<Exercise[]> {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('exercises')
        .select('*')
        .or(`scope.eq.global,and(scope.eq.trainer,owner_id.eq.${trainerId || 'null'}),and(scope.eq.personal,owner_id.eq.${userId})`)
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

  // ASIGNACIONES - Asignar plantilla a estudiante
  async function assignTemplateToStudent(
    templateId: string,
    studentId: string,
    trainerId: string,
    notes?: string
  ) {
    loading.value = true
    error.value = null

    try {
      // Crear asignación
      const { data: assignment, error: assignError } = await supabase
        .from('template_assignments')
        .insert({
          template_id: templateId,
          student_id: studentId,
          trainer_id: trainerId,
          notes: notes || null
        })
        .select()
        .single()

      if (assignError) throw assignError

      // Copiar plantilla al usuario usando función SQL
      const { error: copyError } = await supabase
        .rpc('copy_template_to_user', {
          p_template_id: templateId,
          p_user_id: studentId
        })

      if (copyError) throw copyError

      return assignment
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Obtener estudiantes del entrenador
  async function getTrainerStudents(trainerId: string) {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('trainer_id', trainerId)
        .order('email')

      if (fetchError) throw fetchError
      return data || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  // Obtener asignaciones de un estudiante
  async function getStudentAssignments(studentId: string): Promise<TemplateAssignment[]> {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('template_assignments')
        .select(`
          *,
          template:training_templates(*)
        `)
        .eq('student_id', studentId)
        .order('assigned_at', { ascending: false })

      if (fetchError) throw fetchError
      return data || []
    } catch (e: any) {
      error.value = e.message
      return []
    } finally {
      loading.value = false
    }
  }

  // Eliminar plantilla
  async function deleteTemplate(templateId: string) {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('training_templates')
        .delete()
        .eq('id', templateId)

      if (deleteError) throw deleteError
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Eliminar día de plantilla
  async function deleteTemplateDay(templateDayId: string) {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('template_days')
        .delete()
        .eq('id', templateDayId)

      if (deleteError) throw deleteError
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Eliminar ejercicio de día de plantilla
  async function removeExerciseFromTemplateDay(templateDayExerciseId: string) {
    loading.value = true
    error.value = null

    try {
      const { error: deleteError } = await supabase
        .from('template_day_exercises')
        .delete()
        .eq('id', templateDayExerciseId)

      if (deleteError) throw deleteError
    } catch (e: any) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  // Actualizar plantilla
  async function updateTemplate(templateId: string, updates: Partial<TrainingTemplate>) {
    loading.value = true
    error.value = null

    try {
      const { data, error: updateError } = await supabase
        .from('training_templates')
        .update(updates)
        .eq('id', templateId)
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

  return {
    loading,
    error,
    createTemplate,
    getTrainerTemplates,
    getTemplateComplete,
    createTemplateDay,
    addExerciseToTemplateDay,
    createTrainerExercise,
    createPersonalExercise,
    getAvailableExercises,
    assignTemplateToStudent,
    getTrainerStudents,
    getStudentAssignments,
    deleteTemplate,
    deleteTemplateDay,
    removeExerciseFromTemplateDay,
    updateTemplate,
  }
}