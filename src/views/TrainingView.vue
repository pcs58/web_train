<!-- src/views/TrainingView.vue -->
<template>
  <div class="page">
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-content">
          <h1 class="logo">Mis Entrenamientos</h1>
          <div class="nav-right">
            <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
            <router-link to="/history" class="nav-link">Historial</router-link>
          </div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <div class="container">
        <div v-if="loading && trainingDays.length === 0" class="loading">Cargando...</div>

        <div v-else-if="trainingDays.length === 0" class="empty-state">
          <p>No tienes días de entrenamiento configurados aún.</p>
          <button @click="showCreateDay = true" class="btn btn-primary">
            Crear Primer Día
          </button>
        </div>

        <div v-else class="days-grid">
          <div v-for="day in trainingDays" :key="day.id" class="day-card">
            <div class="day-header">
              <div>
                <h3 class="day-title">{{ day.day_name }}</h3>
                <span class="day-number">Día {{ day.day_number }}</span>
              </div>
              <button @click="startTraining(day)" class="btn btn-success btn-sm">
                ▶ Entrenar
              </button>
            </div>

            <p v-if="day.description" class="day-description">{{ day.description }}</p>

            <div class="exercises-list">
              <div 
                v-for="(dayEx, index) in day.exercises" 
                :key="dayEx.id"
                class="exercise-item"
              >
                <div class="exercise-order">
                  <button 
                    @click="moveExercise(day.id, dayEx.id, index, -1)"
                    :disabled="index === 0"
                    class="btn-order"
                    title="Mover arriba"
                  >↑</button>
                  <span class="order-number">{{ index + 1 }}</span>
                  <button 
                    @click="moveExercise(day.id, dayEx.id, index, 1)"
                    :disabled="index === day.exercises.length - 1"
                    class="btn-order"
                    title="Mover abajo"
                  >↓</button>
                </div>

                <div class="exercise-info" @click="openExerciseModal(dayEx.exercise)">
                  <h4 class="exercise-name">{{ dayEx.exercise?.name }}</h4>
                  <p class="exercise-details">
                    {{ dayEx.sets }} series × {{ dayEx.reps }} reps
                    <span v-if="dayEx.rest_seconds"> • {{ dayEx.rest_seconds }}s</span>
                  </p>
                </div>

                <button 
                  @click="removeExercise(dayEx.id, day.id)"
                  class="btn-remove"
                  title="Eliminar"
                >
                  ×
                </button>
              </div>

              <button 
                @click="openAddExerciseModal(day)" 
                class="btn btn-secondary btn-full"
              >
                + Agregar Ejercicio
              </button>
            </div>
          </div>
        </div>

        <button @click="showCreateDay = true" class="btn btn-primary btn-floating">
          + Nuevo Día
        </button>
      </div>
    </main>

    <!-- Modal crear día -->
    <div v-if="showCreateDay" class="modal-overlay" @click="showCreateDay = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">Crear Nuevo Día</h3>
        <form @submit.prevent="handleCreateDay">
          <div class="form-group">
            <label class="label">Número del día</label>
            <input v-model.number="newDay.dayNumber" type="number" min="1" required class="input" />
          </div>
          <div class="form-group">
            <label class="label">Nombre</label>
            <input v-model="newDay.name" type="text" required class="input" placeholder="Ej: Pecho y Tríceps" />
          </div>
          <div class="form-group">
            <label class="label">Descripción (opcional)</label>
            <textarea v-model="newDay.description" class="input" rows="3"></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showCreateDay = false" class="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">Crear</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal agregar ejercicio -->
    <div v-if="showAddExercise" class="modal-overlay" @click="showAddExercise = false">
      <div class="modal modal-large" @click.stop>
        <h3 class="modal-title">Agregar Ejercicio</h3>
        <div class="exercise-search">
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="Buscar ejercicio..."
            class="input"
          />
        </div>
        <div class="exercise-list-modal">
          <div 
            v-for="ex in filteredExercises" 
            :key="ex.id"
            @click="selectExercise(ex)"
            class="exercise-list-item"
          >
            <div>
              <p class="ex-name">{{ ex.name }}</p>
              <p class="ex-meta">{{ ex.muscle_group }} • {{ ex.difficulty }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal configurar ejercicio -->
    <div v-if="showConfigExercise" class="modal-overlay" @click="showConfigExercise = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">Configurar: {{ selectedExForAdd?.name }}</h3>
        <form @submit.prevent="handleAddExercise">
          <div class="form-group">
            <label class="label">Series</label>
            <input v-model.number="exerciseConfig.sets" type="number" min="1" required class="input" />
          </div>
          <div class="form-group">
            <label class="label">Repeticiones</label>
            <input v-model="exerciseConfig.reps" type="text" required class="input" placeholder="10-12" />
          </div>
          <div class="form-group">
            <label class="label">Descanso (segundos)</label>
            <input v-model.number="exerciseConfig.rest" type="number" min="0" required class="input" />
          </div>
          <div class="modal-actions">
            <button type="button" @click="showConfigExercise = false" class="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">Agregar</button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal detalle ejercicio -->
    <div v-if="selectedExercise" class="modal-overlay" @click="selectedExercise = null">
      <div class="modal modal-large" @click.stop>
        <button class="modal-close" @click="selectedExercise = null">×</button>
        <h3 class="modal-title">{{ selectedExercise.name }}</h3>
        <div class="exercise-detail">
          <div class="detail-section">
            <p class="detail-label">Grupo muscular:</p>
            <p class="detail-value">{{ selectedExercise.muscle_group || 'No especificado' }}</p>
          </div>
          <div class="detail-section">
            <p class="detail-label">Dificultad:</p>
            <span :class="['badge', `badge-${selectedExercise.difficulty}`]">
              {{ selectedExercise.difficulty || 'No especificado' }}
            </span>
          </div>
          <div class="detail-section" v-if="selectedExercise.description">
            <p class="detail-label">Descripción:</p>
            <p class="detail-value">{{ selectedExercise.description }}</p>
          </div>
          <div class="detail-section" v-if="selectedExercise.instructions">
            <p class="detail-label">Instrucciones:</p>
            <p class="detail-value">{{ selectedExercise.instructions }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTraining } from '../composables/useTraining'
import type { TrainingDayWithExercises, Exercise, TrainingDay } from '../types/training'

const router = useRouter()
const authStore = useAuthStore()
const { 
  loading, 
  getTrainingDays, 
  createTrainingDay, 
  getAllExercises,
  addExerciseToDay,
  removeExerciseFromDay,
  updateExerciseOrder
} = useTraining()

const trainingDays = ref<TrainingDayWithExercises[]>([])
const allExercises = ref<Exercise[]>([])
const showCreateDay = ref(false)
const showAddExercise = ref(false)
const showConfigExercise = ref(false)
const selectedExercise = ref<Exercise | null>(null)
const selectedExForAdd = ref<Exercise | null>(null)
const selectedDay = ref<TrainingDay | null>(null)
const searchQuery = ref('')

const newDay = ref({
  dayNumber: 1,
  name: '',
  description: ''
})

const exerciseConfig = ref({
  sets: 3,
  reps: '10-12',
  rest: 60
})

const filteredExercises = computed(() => {
  if (!searchQuery.value) return allExercises.value
  const query = searchQuery.value.toLowerCase()
  return allExercises.value.filter(ex => 
    ex.name.toLowerCase().includes(query) ||
    ex.muscle_group?.toLowerCase().includes(query)
  )
})

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth && authStore.user) {
    loadTrainingDays()
    loadAllExercises()
  }
}, { immediate: true })

async function loadTrainingDays() {
  if (!authStore.user) return
  trainingDays.value = await getTrainingDays(authStore.user.id)
}

async function loadAllExercises() {
  allExercises.value = await getAllExercises()
}

async function handleCreateDay() {
  if (!authStore.user) return
  try {
    await createTrainingDay(
      authStore.user.id,
      newDay.value.dayNumber,
      newDay.value.name,
      newDay.value.description
    )
    showCreateDay.value = false
    newDay.value = { dayNumber: 1, name: '', description: '' }
    await loadTrainingDays()
  } catch (error) {
    console.error('Error:', error)
  }
}

function openAddExerciseModal(day: TrainingDay) {
  selectedDay.value = day
  searchQuery.value = ''
  showAddExercise.value = true
}

function selectExercise(exercise: Exercise) {
  selectedExForAdd.value = exercise
  showAddExercise.value = false
  showConfigExercise.value = true
}

async function handleAddExercise() {
  if (!selectedExForAdd.value || !selectedDay.value) return
  
  try {
    const currentDay = trainingDays.value.find(d => d.id === selectedDay.value!.id)
    const nextOrder = currentDay ? currentDay.exercises.length : 0
    
    await addExerciseToDay(
      selectedDay.value.id,
      selectedExForAdd.value.id,
      exerciseConfig.value.sets,
      exerciseConfig.value.reps,
      exerciseConfig.value.rest,
      nextOrder
    )
    
    showConfigExercise.value = false
    selectedExForAdd.value = null
    exerciseConfig.value = { sets: 3, reps: '10-12', rest: 60 }
    await loadTrainingDays()
  } catch (error) {
    console.error('Error:', error)
  }
}

async function removeExercise(dayExerciseId: string, dayId: string) {
  if (!confirm('¿Eliminar este ejercicio del día?')) return
  
  try {
    await removeExerciseFromDay(dayExerciseId)
    await loadTrainingDays()
  } catch (error) {
    console.error('Error:', error)
  }
}

async function moveExercise(dayId: string, dayExerciseId: string, currentIndex: number, direction: number) {
  const day = trainingDays.value.find(d => d.id === dayId)
  if (!day) return
  
  const newIndex = currentIndex + direction
  if (newIndex < 0 || newIndex >= day.exercises.length) return
  
  try {
    // Actualizar el orden del ejercicio actual
    await updateExerciseOrder(dayExerciseId, newIndex)
    
    // Actualizar el orden del ejercicio que se intercambia
    const otherExercise = day.exercises[newIndex]
    await updateExerciseOrder(otherExercise.id, currentIndex)
    
    await loadTrainingDays()
  } catch (error) {
    console.error('Error:', error)
  }
}

function openExerciseModal(exercise: Exercise | undefined) {
  if (exercise) {
    selectedExercise.value = exercise
  }
}

function startTraining(day: TrainingDayWithExercises) {
  router.push({
    name: 'ActiveTraining',
    params: { dayId: day.id }
  })
}
</script>

<style scoped>
/* Reutilizamos la mayoría de estilos anteriores */
.page {
  min-height: 100vh;
  background: #f9fafb;
}

.navbar {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1.5rem;
}

.nav-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 4rem;
}

.logo {
  font-size: 1.25rem;
  font-weight: bold;
  color: #111827;
  margin: 0;
}

.nav-right {
  display: flex;
  gap: 1rem;
}

.nav-link {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  color: #374151;
  text-decoration: none;
  border-radius: 0.375rem;
  transition: background 0.2s;
}

.nav-link:hover {
  background: #f3f4f6;
}

.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.days-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.day-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.day-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.5rem;
}

.day-number {
  background: #eff6ff;
  color: #2563eb;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.day-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 1rem;
}

.exercises-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.exercise-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.exercise-order {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.btn-order {
  background: white;
  border: 1px solid #d1d5db;
  padding: 0.125rem 0.5rem;
  font-size: 0.75rem;
  cursor: pointer;
  border-radius: 0.25rem;
  color: #6b7280;
}

.btn-order:hover:not(:disabled) {
  background: #f3f4f6;
  color: #111827;
}

.btn-order:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.order-number {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-align: center;
}

.exercise-info {
  flex: 1;
  cursor: pointer;
}

.exercise-name {
  font-size: 1rem;
  font-weight: 500;
  color: #111827;
  margin: 0 0 0.25rem;
}

.exercise-details {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.btn-remove {
  background: #fee2e2;
  border: none;
  color: #dc2626;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fecaca;
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

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
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

.btn-success:hover {
  background: #15803d;
}

.btn-full {
  width: 100%;
  margin-top: 0.5rem;
}

.btn-floating {
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  padding: 1rem 1.5rem;
  font-size: 1rem;
  border-radius: 2rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
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
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.modal-large {
  max-width: 700px;
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

.form-group {
  margin-bottom: 1rem;
}

.label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.25rem;
}

.input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 1rem;
  box-sizing: border-box;
}

.input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

textarea.input {
  resize: vertical;
  font-family: inherit;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.exercise-search {
  margin-bottom: 1rem;
}

.exercise-list-modal {
  max-height: 400px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.exercise-list-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #e5e7eb;
}

.exercise-list-item:hover {
  background: #f3f4f6;
  border-color: #2563eb;
}

.ex-name {
  font-weight: 500;
  color: #111827;
  margin: 0 0 0.25rem;
}

.ex-meta {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
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

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.badge-principiante {
  background: #dcfce7;
  color: #15803d;
}

.badge-intermedio {
  background: #fef3c7;
  color: #92400e;
}

.badge-avanzado {
  background: #fee2e2;
  color: #991b1b;
}

@media (max-width: 768px) {
  .days-grid {
    grid-template-columns: 1fr;
  }

  .btn-floating {
    bottom: 1rem;
    right: 1rem;
  }
}
</style>