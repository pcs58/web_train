<!-- src/views/TrainerTemplateEditView.vue -->
<template>
  <div class="page">
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-content">
          <div class="nav-left">
            <button @click="$router.back()" class="btn-back">← Volver</button>
            <h1 class="logo">{{ template?.name || 'Cargando...' }}</h1>
          </div>
          <button @click="showInfo = true" class="btn btn-secondary btn-sm">
            ℹ️ Info
          </button>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <div class="container">
        <div v-if="loading && !template" class="loading">Cargando rutina...</div>

        <div v-else-if="!template" class="empty-state">
          <p>No se encontró la rutina</p>
        </div>

        <div v-else>
          <div v-if="template.days.length === 0" class="empty-state">
            <p>Esta rutina no tiene días configurados aún.</p>
            <button @click="showCreateDay = true" class="btn btn-primary">
              Crear Primer Día
            </button>
          </div>

          <div v-else class="days-grid">
            <div v-for="day in template.days" :key="day.id" class="day-card">
              <div class="day-header">
                <div>
                  <h3 class="day-title">{{ day.day_name }}</h3>
                  <span class="day-number">Día {{ day.day_number }}</span>
                </div>
                <button @click="deleteDayConfirm(day.id)" class="btn-icon btn-danger" title="Eliminar día">
                  🗑️
                </button>
              </div>

              <p v-if="day.description" class="day-description">{{ day.description }}</p>

              <div class="exercises-list">
                <div 
                  v-for="(dayEx, index) in day.exercises" 
                  :key="dayEx.id"
                  class="exercise-item"
                >
                  <div class="exercise-info" @click="openExerciseModal(dayEx.exercise)">
                    <h4 class="exercise-name">{{ dayEx.exercise?.name }}</h4>
                    <p class="exercise-details">
                      {{ dayEx.sets }} series × {{ dayEx.reps }} reps
                      <span v-if="dayEx.rest_seconds"> • {{ dayEx.rest_seconds }}s</span>
                    </p>
                  </div>

                  <button 
                    @click="removeExercise(dayEx.id)"
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
      </div>
    </main>

    <!-- Modal info de rutina -->
    <div v-if="showInfo" class="modal-overlay" @click="showInfo = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">Información de la Rutina</h3>
        <div class="info-section">
          <p><strong>Nombre:</strong> {{ template?.name }}</p>
          <p v-if="template?.description"><strong>Descripción:</strong> {{ template?.description }}</p>
          <p><strong>Días:</strong> {{ template?.days.length || 0 }}</p>
          <p><strong>Total ejercicios:</strong> {{ totalExercises }}</p>
        </div>
        <button @click="showInfo = false" class="btn btn-primary btn-full">
          Cerrar
        </button>
      </div>
    </div>

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
        
        <div class="tabs">
          <button 
            :class="['tab', { active: exerciseTab === 'existing' }]"
            @click="exerciseTab = 'existing'"
          >
            Ejercicios Existentes
          </button>
          <button 
            :class="['tab', { active: exerciseTab === 'create' }]"
            @click="exerciseTab = 'create'"
          >
            Crear Nuevo (Entrenador)
          </button>
        </div>

        <div v-if="exerciseTab === 'existing'">
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
                <p class="ex-meta">
                  {{ ex.muscle_group }} • {{ ex.difficulty }}
                  <span v-if="ex.scope !== 'global'" class="badge-scope">{{ ex.scope }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <div v-else>
          <form @submit.prevent="handleCreateTrainerExercise">
            <div class="form-group">
              <label class="label">Nombre del ejercicio *</label>
              <input v-model="newExercise.name" type="text" required class="input" />
            </div>
            <div class="form-group">
              <label class="label">Grupo muscular</label>
              <select v-model="newExercise.muscle_group" class="input">
                <option value="">Seleccionar...</option>
                <option value="Pecho">Pecho</option>
                <option value="Espalda">Espalda</option>
                <option value="Piernas">Piernas</option>
                <option value="Hombros">Hombros</option>
                <option value="Brazos">Brazos</option>
                <option value="Core">Core</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">Dificultad</label>
              <select v-model="newExercise.difficulty" class="input">
                <option value="">Seleccionar...</option>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
            <div class="form-group">
              <label class="label">Instrucciones</label>
              <textarea v-model="newExercise.instructions" class="input" rows="4"></textarea>
            </div>
            <button type="submit" class="btn btn-primary btn-full">
              Crear y Agregar
            </button>
          </form>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTrainer } from '../composables/useTrainer'
import { useTraining } from '../composables/useTraining'
import type { TrainingTemplateComplete, TemplateDay, Exercise } from '../types/training'

const route = useRoute()
const authStore = useAuthStore()
const { 
  getTemplateComplete, 
  createTemplateDay, 
  addExerciseToTemplateDay,
  createTrainerExercise,
  deleteTemplateDay,
  removeExerciseFromTemplateDay,
  getAvailableExercises
} = useTrainer()
const { getAllExercises } = useTraining()

const loading = ref(false)
const template = ref<TrainingTemplateComplete | null>(null)
const allExercises = ref<Exercise[]>([])
const showInfo = ref(false)
const showCreateDay = ref(false)
const showAddExercise = ref(false)
const showConfigExercise = ref(false)
const selectedExercise = ref<Exercise | null>(null)
const selectedExForAdd = ref<Exercise | null>(null)
const selectedDay = ref<TemplateDay | null>(null)
const searchQuery = ref('')
const exerciseTab = ref<'existing' | 'create'>('existing')

const newDay = ref({
  dayNumber: 1,
  name: '',
  description: ''
})

const newExercise = ref({
  name: '',
  muscle_group: '',
  difficulty: '',
  instructions: ''
})

const exerciseConfig = ref({
  sets: 3,
  reps: '10-12',
  rest: 60
})

const totalExercises = computed(() => {
  return template.value?.days.reduce((sum, day) => sum + day.exercises.length, 0) || 0
})

const filteredExercises = computed(() => {
  if (!searchQuery.value) return allExercises.value
  const query = searchQuery.value.toLowerCase()
  return allExercises.value.filter(ex => 
    ex.name.toLowerCase().includes(query) ||
    ex.muscle_group?.toLowerCase().includes(query)
  )
})

onMounted(async () => {
  const templateId = route.params.templateId as string
  await loadTemplate(templateId)
  await loadExercises()
})

async function loadTemplate(templateId: string) {
  loading.value = true
  template.value = await getTemplateComplete(templateId)
  loading.value = false
}

async function loadExercises() {
  if (!authStore.user) return
  // Cargar ejercicios disponibles (globales + del entrenador)
  allExercises.value = await getAvailableExercises(authStore.user.id, authStore.user.id)
}

async function handleCreateDay() {
  if (!template.value) return
  
  try {
    await createTemplateDay(
      template.value.id,
      newDay.value.dayNumber,
      newDay.value.name,
      newDay.value.description
    )
    
    showCreateDay.value = false
    newDay.value = { dayNumber: 1, name: '', description: '' }
    await loadTemplate(template.value.id)
  } catch (error) {
    console.error('Error:', error)
  }
}

function openAddExerciseModal(day: TemplateDay) {
  selectedDay.value = day
  searchQuery.value = ''
  exerciseTab.value = 'existing'
  showAddExercise.value = true
}

function selectExercise(exercise: Exercise) {
  selectedExForAdd.value = exercise
  showAddExercise.value = false
  showConfigExercise.value = true
}

async function handleCreateTrainerExercise() {
  if (!authStore.user) return
  
  try {
    const exercise = await createTrainerExercise(authStore.user.id, {
      name: newExercise.value.name,
      muscle_group: newExercise.value.muscle_group || null,
      difficulty: (newExercise.value.difficulty as any) || null,
      instructions: newExercise.value.instructions || null
    })
    
    // Agregar directamente
    selectedExForAdd.value = exercise
    showAddExercise.value = false
    showConfigExercise.value = true
    newExercise.value = { name: '', muscle_group: '', difficulty: '', instructions: '' }
    await loadExercises()
  } catch (error) {
    console.error('Error:', error)
  }
}

async function handleAddExercise() {
  if (!selectedExForAdd.value || !selectedDay.value || !template.value) return
  
  try {
    const currentDay = template.value.days.find(d => d.id === selectedDay.value!.id)
    const nextOrder = currentDay ? currentDay.exercises.length : 0
    
    await addExerciseToTemplateDay(
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
    await loadTemplate(template.value.id)
  } catch (error) {
    console.error('Error:', error)
  }
}

async function removeExercise(templateDayExerciseId: string) {
  if (!confirm('¿Eliminar este ejercicio del día?') || !template.value) return
  
  try {
    await removeExerciseFromTemplateDay(templateDayExerciseId)
    await loadTemplate(template.value.id)
  } catch (error) {
    console.error('Error:', error)
  }
}

async function deleteDayConfirm(templateDayId: string) {
  if (!confirm('¿Eliminar este día completo?') || !template.value) return
  
  try {
    await deleteTemplateDay(templateDayId)
    await loadTemplate(template.value.id)
  } catch (error) {
    console.error('Error:', error)
  }
}

function openExerciseModal(exercise: Exercise | undefined) {
  if (exercise) {
    selectedExercise.value = exercise
  }
}
</script>

<style scoped>
/* Reutilizamos los estilos de TrainingView */
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

.nav-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-back {
  background: none;
  border: none;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 0.375rem;
  transition: background 0.2s;
}

.btn-back:hover {
  background: #f3f4f6;
}

.logo {
  font-size: 1.25rem;
  font-weight: bold;
  color: #111827;
  margin: 0;
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

.btn-icon {
  background: none;
  border: none;
  font-size: 1.125rem;
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.btn-icon.btn-danger:hover {
  background: #fee2e2;
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

.info-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.info-section p {
  margin: 0;
  color: #374151;
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

.tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.tab {
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: #374151;
}

.tab.active {
  color: #2563eb;
  border-bottom-color: #2563eb;
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

.badge-scope {
  background: #fef3c7;
  color: #92400e;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.75rem;
  margin-left: 0.5rem;
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