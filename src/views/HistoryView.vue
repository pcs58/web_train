<!-- src/views/HistoryView.vue -->
<template>
  <div class="page">
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-content">
          <h1 class="logo">Historial de Entrenamientos</h1>
          <div class="nav-right">
            <router-link to="/training" class="nav-link">Entrenamientos</router-link>
            <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          </div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <div class="container">
        <div v-if="loading" class="loading">Cargando historial...</div>

        <div v-else-if="sessions.length === 0" class="empty-state">
          <p>No has completado ningún entrenamiento aún.</p>
          <router-link to="/training" class="btn btn-primary">
            Comenzar a Entrenar
          </router-link>
        </div>

        <div v-else class="sessions-list">
          <div 
            v-for="session in sessions" 
            :key="session.id"
            @click="viewSessionDetail(session.id)"
            class="session-card"
          >
            <div class="session-header">
              <div>
                <h3 class="session-title">{{ session.training_day?.day_name || 'Entrenamiento' }}</h3>
                <p class="session-date">{{ formatDate(session.start_time) }}</p>
              </div>
              <span :class="['session-status', session.completed ? 'completed' : 'incomplete']">
                {{ session.completed ? '✓ Completado' : 'Incompleto' }}
              </span>
            </div>

            <div class="session-stats">
              <div class="stat-item">
                <span class="stat-icon">⏱️</span>
                <span class="stat-value">{{ formatDuration(session.duration_seconds) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">💪</span>
                <span class="stat-value">{{ getSessionExerciseCount(session.id) }} ejercicios</span>
              </div>
              <div class="stat-item">
                <span class="stat-icon">📊</span>
                <span class="stat-value">{{ getSessionSetCount(session.id) }} series</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal detalle de sesión -->
    <div v-if="selectedSessionId" class="modal-overlay" @click="selectedSessionId = null">
      <div class="modal modal-large" @click.stop>
        <button class="modal-close" @click="selectedSessionId = null">×</button>
        <h3 class="modal-title">Detalle del Entrenamiento</h3>

        <div v-if="loadingDetail" class="loading-detail">Cargando...</div>

        <div v-else class="session-detail">
          <div class="detail-header">
            <div class="detail-info">
              <p class="detail-date">{{ formatDate(selectedSession?.start_time) }}</p>
              <h4 class="detail-title">{{ selectedSession?.training_day?.day_name }}</h4>
            </div>
            <div class="detail-stats-grid">
              <div class="detail-stat">
                <span class="detail-label">Duración</span>
                <span class="detail-value">{{ formatDuration(selectedSession?.duration_seconds) }}</span>
              </div>
              <div class="detail-stat">
                <span class="detail-label">Series</span>
                <span class="detail-value">{{ sessionSets.length }}</span>
              </div>
            </div>
          </div>

          <div class="exercises-performed">
            <h5 class="section-title">Ejercicios Realizados</h5>
            <div v-for="(exerciseSets, exerciseName) in groupedSets" :key="exerciseName" class="exercise-group">
              <h6 class="exercise-group-title">{{ exerciseName }}</h6>
              <div class="sets-table">
                <div class="sets-table-header">
                  <span>Serie</span>
                  <span>Peso</span>
                  <span>Reps</span>
                </div>
                <div 
                  v-for="(set, index) in exerciseSets" 
                  :key="set.id"
                  class="sets-table-row"
                >
                  <span>{{ index + 1 }}</span>
                  <span>{{ set.weight_kg }}kg</span>
                  <span>{{ set.reps }} reps</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useTraining } from '../composables/useTraining'
import type { TrainingSessionWithSets, ExerciseSet } from '../types/training'

const authStore = useAuthStore()
const { loading, getTrainingSessions, getSessionSets } = useTraining()

const sessions = ref<TrainingSessionWithSets[]>([])
const selectedSessionId = ref<string | null>(null)
const sessionSets = ref<ExerciseSet[]>([])
const loadingDetail = ref(false)

const selectedSession = computed(() => {
  return sessions.value.find(s => s.id === selectedSessionId.value)
})

const groupedSets = computed(() => {
  const grouped: Record<string, ExerciseSet[]> = {}
  
  sessionSets.value.forEach(set => {
    const exerciseName = (set as any).exercise?.name || 'Ejercicio desconocido'
    if (!grouped[exerciseName]) {
      grouped[exerciseName] = []
    }
    grouped[exerciseName].push(set)
  })
  
  return grouped
})

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth && authStore.user) {
    loadSessions()
  }
}, { immediate: true })

async function loadSessions() {
  if (!authStore.user) return
  sessions.value = await getTrainingSessions(authStore.user.id)
}

async function viewSessionDetail(sessionId: string) {
  selectedSessionId.value = sessionId
  loadingDetail.value = true
  
  try {
    sessionSets.value = await getSessionSets(sessionId)
  } catch (error) {
    console.error('Error loading session sets:', error)
  } finally {
    loadingDetail.value = false
  }
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return '0 min'
  
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }
  return `${minutes} min`
}

function getSessionSetCount(sessionId: string): number {
  // Esto requeriría cargar los sets por adelantado
  // Por ahora retornamos un placeholder
  return 0
}

function getSessionExerciseCount(sessionId: string): number {
  // Similar al anterior
  return 0
}
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

.sessions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.session-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.session-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.session-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem;
}

.session-date {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.session-status {
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.session-status.completed {
  background: #dcfce7;
  color: #15803d;
}

.session-status.incomplete {
  background: #fef3c7;
  color: #92400e;
}

.session-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-icon {
  font-size: 1.25rem;
}

.stat-value {
  font-size: 0.875rem;
  color: #6b7280;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  text-decoration: none;
  display: inline-block;
  transition: all 0.2s;
}

.btn-primary {
  background: #2563eb;
  color: white;
}

.btn-primary:hover {
  background: #1d4ed8;
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

.loading-detail {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.session-detail {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.detail-header {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-date {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.5rem;
}

.detail-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem;
}

.detail-stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.detail-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-value {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem;
}

.exercises-performed {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.exercise-group {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 0.375rem;
}

.exercise-group-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.75rem;
}

.sets-table {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.sets-table-header, .sets-table-row {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 1rem;
  padding: 0.5rem;
}

.sets-table-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 1px solid #e5e7eb;
}

.sets-table-row {
  font-size: 0.875rem;
  color: #111827;
}

@media (max-width: 640px) {
  .session-stats {
    flex-direction: column;
    gap: 0.5rem;
  }

  .detail-stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>