<!-- src/views/AdminExercisesView.vue -->
<template>
  <div class="page">
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-content">
          <h1 class="logo">🔧 Panel de Administración</h1>
          <div class="nav-right">
            <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
            <router-link to="/training" class="nav-link">Entrenamientos</router-link>
          </div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <div class="container">
        <div class="header-section">
          <h2 class="page-title">Gestión de Ejercicios</h2>
          <button @click="openCreateModal" class="btn btn-primary">
            + Nuevo Ejercicio
          </button>
        </div>

        <div v-if="loading && exercises.length === 0" class="loading">
          Cargando ejercicios...
        </div>

        <div v-else class="exercises-table-container">
          <table class="exercises-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Grupo Muscular</th>
                <th>Dificultad</th>
                <th>Descripción</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="exercise in exercises" :key="exercise.id">
                <td class="font-medium">{{ exercise.name }}</td>
                <td>{{ exercise.muscle_group || '-' }}</td>
                <td>
                  <span 
                    v-if="exercise.difficulty" 
                    :class="['badge', `badge-${exercise.difficulty}`]"
                  >
                    {{ exercise.difficulty }}
                  </span>
                  <span v-else>-</span>
                </td>
                <td class="description-cell">
                  {{ exercise.description ? truncate(exercise.description, 50) : '-' }}
                </td>
                <td>
                  <div class="actions">
                    <button @click="openEditModal(exercise)" class="btn-icon" title="Editar">
                      ✏️
                    </button>
                    <button @click="handleDelete(exercise.id)" class="btn-icon btn-danger" title="Eliminar">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

          <div v-if="exercises.length === 0 && !loading" class="empty-state">
            No hay ejercicios creados aún
          </div>
        </div>
      </div>
    </main>

    <!-- Modal para crear/editar ejercicio -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal modal-large" @click.stop>
        <button class="modal-close" @click="closeModal">×</button>
        <h3 class="modal-title">
          {{ editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio' }}
        </h3>

        <form @submit.prevent="handleSubmit">
          <div class="form-grid">
            <div class="form-group">
              <label class="label">Nombre del ejercicio *</label>
              <input 
                v-model="form.name" 
                type="text" 
                required 
                class="input"
                placeholder="Press de banca"
              />
            </div>

            <div class="form-group">
              <label class="label">Grupo muscular</label>
              <select v-model="form.muscle_group" class="input">
                <option value="">Seleccionar...</option>
                <option value="Pecho">Pecho</option>
                <option value="Espalda">Espalda</option>
                <option value="Piernas">Piernas</option>
                <option value="Hombros">Hombros</option>
                <option value="Brazos">Brazos</option>
                <option value="Core">Core</option>
                <option value="Full Body">Full Body</option>
              </select>
            </div>

            <div class="form-group">
              <label class="label">Dificultad</label>
              <select v-model="form.difficulty" class="input">
                <option value="">Seleccionar...</option>
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>

            <div class="form-group form-group-full">
              <label class="label">Descripción</label>
              <textarea 
                v-model="form.description" 
                class="input" 
                rows="3"
                placeholder="Descripción breve del ejercicio"
              ></textarea>
            </div>

            <div class="form-group form-group-full">
              <label class="label">Instrucciones</label>
              <textarea 
                v-model="form.instructions" 
                class="input" 
                rows="4"
                placeholder="Paso a paso de cómo realizar el ejercicio"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="label">URL de video (opcional)</label>
              <input 
                v-model="form.video_url" 
                type="url" 
                class="input"
                placeholder="https://youtube.com/..."
              />
            </div>

            <div class="form-group">
              <label class="label">URL de imagen (opcional)</label>
              <input 
                v-model="form.image_url" 
                type="url" 
                class="input"
                placeholder="https://..."
              />
            </div>
          </div>

          <div v-if="error" class="alert alert-error">
            {{ error }}
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" :disabled="loading" class="btn btn-primary">
              {{ loading ? 'Guardando...' : (editingExercise ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useTraining } from '../composables/useTraining'
import type { Exercise } from '../types/training'

const { 
  loading, 
  error, 
  getAllExercises, 
  createExercise, 
  updateExercise, 
  deleteExercise 
} = useTraining()

const exercises = ref<Exercise[]>([])
const showModal = ref(false)
const editingExercise = ref<Exercise | null>(null)

const form = ref({
  name: '',
  description: '',
  muscle_group: '',
  difficulty: '',
  instructions: '',
  video_url: '',
  image_url: ''
})

async function loadExercises() {
  exercises.value = await getAllExercises()
}

function openCreateModal() {
  editingExercise.value = null
  form.value = {
    name: '',
    description: '',
    muscle_group: '',
    difficulty: '',
    instructions: '',
    video_url: '',
    image_url: ''
  }
  showModal.value = true
}

function openEditModal(exercise: Exercise) {
  editingExercise.value = exercise
  form.value = {
    name: exercise.name,
    description: exercise.description || '',
    muscle_group: exercise.muscle_group || '',
    difficulty: exercise.difficulty || '',
    instructions: exercise.instructions || '',
    video_url: exercise.video_url || '',
    image_url: exercise.image_url || ''
  }
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  editingExercise.value = null
  error.value = null
}

async function handleSubmit() {
  try {
    const exerciseData = {
      name: form.value.name,
      description: form.value.description || null,
      muscle_group: form.value.muscle_group || null,
      difficulty: form.value.difficulty || null,
      instructions: form.value.instructions || null,
      video_url: form.value.video_url || null,
      image_url: form.value.image_url || null,
    }

    if (editingExercise.value) {
      await updateExercise(editingExercise.value.id, exerciseData)
    } else {
      await createExercise(exerciseData)
    }

    closeModal()
    await loadExercises()
  } catch (e) {
    console.error('Error saving exercise:', e)
  }
}

async function handleDelete(id: string) {
  if (!confirm('¿Estás seguro de eliminar este ejercicio?')) return

  try {
    await deleteExercise(id)
    await loadExercises()
  } catch (e) {
    console.error('Error deleting exercise:', e)
  }
}

function truncate(text: string, length: number) {
  return text.length > length ? text.substring(0, length) + '...' : text
}

onMounted(() => {
  loadExercises()
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f9fafb;
}

.navbar {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1400px;
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
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  margin: 0;
}

.loading {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.exercises-table-container {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.exercises-table {
  width: 100%;
  border-collapse: collapse;
}

.exercises-table thead {
  background: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

.exercises-table th {
  padding: 0.75rem 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.exercises-table td {
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  font-size: 0.875rem;
  color: #6b7280;
}

.exercises-table tbody tr:hover {
  background: #f9fafb;
}

.font-medium {
  font-weight: 500;
  color: #111827;
}

.description-cell {
  max-width: 300px;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn-icon {
  background: none;
  border: none;
  font-size: 1.25rem;
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

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #9ca3af;
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

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #1d4ed8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #e5e7eb;
  color: #374151;
}

.btn-secondary:hover {
  background: #d1d5db;
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

.modal-large {
  max-width: 800px;
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

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-group-full {
  grid-column: 1 / -1;
}

.label {
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

.input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

textarea.input {
  resize: vertical;
  font-family: inherit;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  margin-top: 1rem;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
  font-size: 0.875rem;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
  justify-content: flex-end;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
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
  .form-grid {
    grid-template-columns: 1fr;
  }

  .exercises-table {
    font-size: 0.8rem;
  }

  .exercises-table th,
  .exercises-table td {
    padding: 0.5rem;
  }

  .description-cell {
    max-width: 150px;
  }
}
</style>