<!-- src/views/ActiveTrainingView.vue -->
<template>
  <div class="page">
    <div class="training-header">
      <div class="header-content">
        <h1 class="training-title">{{ trainingDay?.day_name }}</h1>
        <div class="timer">⏱️ {{ formattedTime }}</div>
      </div>
    </div>

    <main class="main-content">
      <div v-if="!sessionStarted" class="start-screen">
        <h2>¿Listo para entrenar?</h2>
        <p>{{ exercises.length }} ejercicios • {{ totalSets }} series en total</p>
        <button @click="startSession" class="btn btn-primary btn-large">
          ▶ Iniciar Entrenamiento
        </button>
        <button @click="$router.back()" class="btn btn-secondary btn-large">
          ← Volver
        </button>
      </div>

      <div v-else-if="currentExercise && currentExerciseIndex < exercises.length" class="exercise-screen">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: progressPercentage + '%' }"
          ></div>
        </div>

                  <div class="exercise-info-card">
          <div class="exercise-header">
            <span class="exercise-number">{{ currentExerciseIndex + 1 }} / {{ exercises.length }}</span>
            <h2 class="current-exercise-name">{{ currentExercise?.exercise?.name }}</h2>
          </div>

          <div class="exercise-stats">
            <div class="stat">
              <span class="stat-label">Series</span>
              <span class="stat-value">{{ currentSet }} / {{ currentExercise?.sets || 0 }}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Objetivo</span>
              <span class="stat-value">{{ currentExercise?.reps || '-' }} reps</span>
            </div>
            <div class="stat">
              <span class="stat-label">Descanso</span>
              <span class="stat-value">{{ currentExercise?.rest_seconds || 0 }}s</span>
            </div>
          </div>

          <button 
            @click="openExerciseInfo" 
            class="btn btn-secondary btn-full"
          >
            ℹ️ Ver instrucciones
          </button>
        </div>

        <div class="set-input-card">
          <h3>Registrar Serie {{ currentSet }}</h3>
          <div class="input-grid">
            <div class="input-group">
              <label>Peso (kg)</label>
              <input 
                v-model.number="setData.weight" 
                type="number" 
                step="0.5"
                class="input input-large"
                placeholder="0"
              />
            </div>
            <div class="input-group">
              <label>Repeticiones</label>
              <input 
                v-model.number="setData.reps" 
                type="number" 
                class="input input-large"
                placeholder="0"
              />
            </div>
          </div>

          <button 
            @click="completeSet" 
            class="btn btn-success btn-large btn-full"
            :disabled="!setData.weight || !setData.reps"
          >
            ✓ Completar Serie
          </button>

          <div class="action-buttons">
            <button @click="skipExercise" class="btn btn-secondary">
              → Saltar Ejercicio
            </button>
            <button @click="confirmFinish" class="btn btn-danger">
              ⏹ Finalizar
            </button>
          </div>
        </div>

        <!-- Historial de series del ejercicio actual -->
        <div v-if="currentExerciseSets.length > 0" class="sets-history">
          <h4>Series completadas</h4>
          <div class="sets-list">
            <div v-for="(set, index) in currentExerciseSets" :key="set.id" class="set-item">
              <span class="set-number">Serie {{ index + 1 }}</span>
              <span class="set-data">{{ set.weight_kg }}kg × {{ set.reps }} reps</span>
            </div>
          </div>
        </div>

        <!-- Contador de descanso -->
        <div v-if="isResting" class="rest-overlay">
          <div class="rest-content">
            <h2>Descansa</h2>
            <div class="rest-timer">{{ restTimeRemaining }}s</div>
            <button @click="skipRest" class="btn btn-secondary">
              Saltar descanso
            </button>
          </div>
        </div>
      </div>

      <div v-else class="finish-screen">
        <div class="finish-icon">🎉</div>
        <h2>¡Entrenamiento Completado!</h2>
        <div class="finish-stats">
          <div class="finish-stat">
            <span class="finish-label">Duración</span>
            <span class="finish-value">{{ formattedTime }}</span>
          </div>
          <div class="finish-stat">
            <span class="finish-label">Ejercicios</span>
            <span class="finish-value">{{ completedExercises }}</span>
          </div>
          <div class="finish-stat">
            <span class="finish-label">Series</span>
            <span class="finish-value">{{ completedSets }}</span>
          </div>
        </div>
        <button @click="finishAndExit" class="btn btn-primary btn-large">
          Ver Resumen
        </button>
      </div>
    </main>

    <!-- Modal de instrucciones -->
    <div v-if="showExerciseInfo && currentExercise" class="modal-overlay" @click="showExerciseInfo = false">
      <div class="modal" @click.stop>
        <button class="modal-close" @click="showExerciseInfo = false">×</button>
        <h3 class="modal-title">{{ currentExercise?.exercise?.name }}</h3>
        <div class="exercise-detail">
          <div class="detail-section">
            <p class="detail-label">Grupo muscular</p>
            <p class="detail-value">{{ currentExercise?.exercise?.muscle_group || 'No especificado' }}</p>
          </div>
          <div class="detail-section" v-if="currentExercise?.exercise?.description">
            <p class="detail-label">Descripción</p>
            <p class="detail-value">{{ currentExercise?.exercise?.description }}</p>
          </div>
          <div class="detail-section" v-if="currentExercise?.exercise?.instructions">
            <p class="detail-label">Instrucciones</p>
            <p class="detail-value">{{ currentExercise?.exercise?.instructions }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTraining } from '../composables/useTraining'
import type { TrainingDayWithExercises, DayExercise, ExerciseSet } from '../types/training'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { 
  getTrainingDays, 
  createTrainingSession, 
  finishTrainingSession,
  createExerciseSet 
} = useTraining()

const trainingDay = ref<TrainingDayWithExercises | null>(null)
const exercises = ref<DayExercise[]>([])
const sessionStarted = ref(false)
const sessionId = ref<string | null>(null)
const startTime = ref<string | null>(null)

const currentExerciseIndex = ref(0)
const currentSet = ref(1)
const completedSets = ref(0)
const completedExercises = ref(0)
const allCompletedSets = ref<ExerciseSet[]>([])

const elapsedSeconds = ref(0)
const timerInterval = ref<number | null>(null)

const isResting = ref(false)
const restTimeRemaining = ref(0)
const restInterval = ref<number | null>(null)

const showExerciseInfo = ref(false)

const setData = ref({
  weight: null as number | null,
  reps: null as number | null
})

const currentExercise = computed(() => {
  if (currentExerciseIndex.value >= exercises.value.length) return null
  return exercises.value[currentExerciseIndex.value]
})

const currentExerciseSets = computed(() => {
  if (!currentExercise.value) return []
  return allCompletedSets.value.filter(
    set => set.day_exercise_id === currentExercise.value!.id
  )
})

const totalSets = computed(() => {
  return exercises.value.reduce((sum, ex) => sum + ex.sets, 0)
})

const progressPercentage = computed(() => {
  if (totalSets.value === 0) return 0
  return (completedSets.value / totalSets.value) * 100
})

const formattedTime = computed(() => {
  const hours = Math.floor(elapsedSeconds.value / 3600)
  const minutes = Math.floor((elapsedSeconds.value % 3600) / 60)
  const seconds = elapsedSeconds.value % 60
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
})

onMounted(async () => {
  const dayId = route.params.dayId as string
  if (!authStore.user) {
    router.push('/login')
    return
  }

  const days = await getTrainingDays(authStore.user.id)
  trainingDay.value = days.find(d => d.id === dayId) || null
  
  if (!trainingDay.value) {
    router.push('/training')
    return
  }

  exercises.value = trainingDay.value.exercises
})

onUnmounted(() => {
  stopTimer()
  stopRest()
})

async function startSession() {
  if (!authStore.user || !trainingDay.value) return

  try {
    const session = await createTrainingSession(authStore.user.id, trainingDay.value.id)
    sessionId.value = session.id
    startTime.value = session.start_time
    sessionStarted.value = true
    startTimer()
  } catch (error) {
    console.error('Error starting session:', error)
  }
}

function startTimer() {
  timerInterval.value = window.setInterval(() => {
    elapsedSeconds.value++
  }, 1000)
}

function stopTimer() {
  if (timerInterval.value) {
    clearInterval(timerInterval.value)
    timerInterval.value = null
  }
}

function startRest(seconds: number) {
  isResting.value = true
  restTimeRemaining.value = seconds
  
  restInterval.value = window.setInterval(() => {
    restTimeRemaining.value--
    if (restTimeRemaining.value <= 0) {
      skipRest()
    }
  }, 1000)
}

function stopRest() {
  if (restInterval.value) {
    clearInterval(restInterval.value)
    restInterval.value = null
  }
  isResting.value = false
}

function skipRest() {
  stopRest()
}

async function completeSet() {
  if (!sessionId.value || !currentExercise.value || !setData.value.weight || !setData.value.reps) return

  try {
    const set = await createExerciseSet(
      sessionId.value,
      currentExercise.value.id,
      currentExercise.value.exercise_id,
      currentSet.value,
      setData.value.weight,
      setData.value.reps,
      currentExercise.value.rest_seconds
    )

    allCompletedSets.value.push(set)
    completedSets.value++

    // Limpiar inputs
    setData.value = { weight: null, reps: null }

    if (currentSet.value < currentExercise.value.sets) {
      // Más series en este ejercicio
      currentSet.value++
      startRest(currentExercise.value.rest_seconds || 60)
    } else {
      // Ejercicio completado, pasar al siguiente
      completedExercises.value++
      currentExerciseIndex.value++
      currentSet.value = 1
    }
  } catch (error) {
    console.error('Error completing set:', error)
  }
}

function skipExercise() {
  if (!confirm('¿Saltar este ejercicio?')) return
  currentExerciseIndex.value++
  currentSet.value = 1
  setData.value = { weight: null, reps: null }
}

function confirmFinish() {
  if (confirm('¿Finalizar entrenamiento ahora?')) {
    currentExerciseIndex.value = exercises.value.length
  }
}

async function finishAndExit() {
  if (sessionId.value && startTime.value) {
    try {
      await finishTrainingSession(sessionId.value, startTime.value)
      stopTimer()
      router.push('/history')
    } catch (error) {
      console.error('Error finishing session:', error)
    }
  }
}

function openExerciseInfo() {
  showExerciseInfo.value = true
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f9fafb;
}

.training-header {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.training-title {
  font-size: 1.5rem;
  font-weight: bold;
  margin: 0;
}

.timer {
  font-size: 1.25rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.start-screen, .finish-screen {
  text-align: center;
  padding: 3rem 1.5rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.start-screen h2, .finish-screen h2 {
  font-size: 2rem;
  font-weight: bold;
  color: #111827;
  margin: 0 0 1rem;
}

.start-screen p {
  color: #6b7280;
  font-size: 1.125rem;
  margin-bottom: 2rem;
}

.exercise-screen {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.progress-bar {
  background: #e5e7eb;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
  height: 100%;
  transition: width 0.3s ease;
}

.exercise-info-card, .set-input-card, .sets-history {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.exercise-header {
  margin-bottom: 1rem;
}

.exercise-number {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.current-exercise-name {
  font-size: 1.75rem;
  font-weight: bold;
  color: #111827;
  margin: 0.5rem 0 0;
}

.exercise-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin: 1.5rem 0;
}

.stat {
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.set-input-card h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem;
}

.input-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.input-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  box-sizing: border-box;
}

.input-large {
  padding: 0.75rem 1rem;
  font-size: 1.5rem;
  font-weight: 600;
  text-align: center;
}

.input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-large {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}

.btn-full {
  width: 100%;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
}

.btn-success {
  background: #16a34a;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #15803d;
}

.btn-success:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.action-buttons .btn {
  flex: 1;
}

.sets-history h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem;
}

.sets-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.set-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
}

.set-number {
  font-weight: 500;
  color: #6b7280;
}

.set-data {
  font-weight: 600;
  color: #111827;
}

.rest-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.rest-content {
  text-align: center;
  color: white;
}

.rest-content h2 {
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 1rem;
}

.rest-timer {
  font-size: 6rem;
  font-weight: bold;
  margin: 2rem 0;
  font-variant-numeric: tabular-nums;
}

.finish-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.finish-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin: 2rem 0;
}

.finish-stat {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.finish-label {
  font-size: 0.875rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.finish-value {
  font-size: 2rem;
  font-weight: bold;
  color: #111827;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal {
  background: white;
  border-radius: 0.5rem;
  padding: 2rem;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  font-size: 2rem;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
}

.modal-close:hover {
  color: #374151;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1.5rem;
}

.exercise-detail {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin: 0;
}

.detail-value {
  font-size: 1rem;
  color: #111827;
  margin: 0;
  line-height: 1.6;
}

@media (max-width: 640px) {
  .training-title {
    font-size: 1.125rem;
  }

  .timer {
    font-size: 1rem;
  }

  .exercise-stats {
    grid-template-columns: 1fr;
  }

  .input-grid {
    grid-template-columns: 1fr;
  }

  .finish-stats {
    grid-template-columns: 1fr;
  }

  .rest-timer {
    font-size: 4rem;
  }
}
</style>