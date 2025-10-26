<!-- src/views/TrainerStudentsView.vue -->
<template>
  <div class="page">
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-content">
          <h1 class="logo">Mis Estudiantes</h1>
          <div class="nav-right">
            <router-link to="/trainer/templates" class="nav-link">Rutinas</router-link>
            <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          </div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <div class="container">
        <div class="header-section">
          <h2 class="page-title">Gestión de Estudiantes</h2>
          <div class="stats">
            <div class="stat-box">
              <span class="stat-value">{{ students.length }}</span>
              <span class="stat-label">Estudiantes</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">{{ templates.length }}</span>
              <span class="stat-label">Rutinas</span>
            </div>
          </div>
        </div>

        <div v-if="loading && students.length === 0" class="loading">
          Cargando estudiantes...
        </div>

        <div v-else-if="students.length === 0" class="empty-state">
          <h3>No tienes estudiantes aún</h3>
          <p>Los usuarios deben configurar tu ID de entrenador en su perfil para aparecer aquí.</p>
          <div class="info-box">
            <p><strong>Tu ID de entrenador:</strong></p>
            <code class="trainer-id">{{ authStore.user?.id }}</code>
            <button @click="copyTrainerId" class="btn btn-secondary btn-sm">
              📋 Copiar ID
            </button>
          </div>
        </div>

        <div v-else class="students-grid">
          <div 
            v-for="student in students" 
            :key="student.id"
            class="student-card"
          >
            <div class="student-header">
              <div class="student-avatar">
                {{ student.email[0].toUpperCase() }}
              </div>
              <div class="student-info">
                <h3 class="student-name">{{ student.email }}</h3>
                <span class="student-role">Estudiante</span>
              </div>
            </div>

            <div class="student-stats">
              <div class="stat-item">
                <span class="stat-icon">📋</span>
                <span class="stat-text">
                  {{ getStudentAssignmentsCount(student.id) }} rutinas asignadas
                </span>
              </div>
            </div>

            <div class="student-actions">
              <button 
                @click="viewStudentDetail(student.id)" 
                class="btn btn-secondary btn-sm btn-full"
              >
                Ver Detalles
              </button>
              <button 
                @click="openAssignModal(student)" 
                class="btn btn-primary btn-sm btn-full"
              >
                Asignar Rutina
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal detalles del estudiante -->
    <div v-if="selectedStudent" class="modal-overlay" @click="selectedStudent = null">
      <div class="modal modal-large" @click.stop>
        <button class="modal-close" @click="selectedStudent = null">×</button>
        <h3 class="modal-title">{{ selectedStudent.email }}</h3>

        <div v-if="loadingAssignments" class="loading-detail">
          Cargando información...
        </div>

        <div v-else>
          <div class="section">
            <h4 class="section-title">Rutinas Asignadas</h4>
            
            <div v-if="studentAssignments.length === 0" class="empty-section">
              <p>Este estudiante no tiene rutinas asignadas aún.</p>
            </div>

            <div v-else class="assignments-list">
              <div 
                v-for="assignment in studentAssignments" 
                :key="assignment.id"
                class="assignment-item"
              >
                <div class="assignment-info">
                  <h5 class="assignment-name">{{ assignment.template?.name }}</h5>
                  <p class="assignment-date">
                    Asignada: {{ formatDate(assignment.assigned_at) }}
                  </p>
                  <p v-if="assignment.notes" class="assignment-notes">
                    {{ assignment.notes }}
                  </p>
                </div>
                <button 
                  @click="unassignTemplate(assignment.id)"
                  class="btn-icon btn-danger"
                  title="Quitar asignación"
                >
                  🗑️
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal asignar rutina -->
    <div v-if="showAssign" class="modal-overlay" @click="showAssign = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">Asignar Rutina</h3>
        <p class="modal-subtitle">{{ studentToAssign?.email }}</p>

        <div v-if="templates.length === 0" class="empty-section">
          <p>No tienes rutinas creadas aún.</p>
          <router-link to="/trainer/templates" class="btn btn-primary">
            Crear Primera Rutina
          </router-link>
        </div>

        <div v-else>
          <div class="templates-select">
            <div 
              v-for="template in templates" 
              :key="template.id"
              @click="selectTemplate(template.id)"
              :class="['template-option', { selected: selectedTemplateId === template.id }]"
            >
              <div>
                <p class="template-option-name">{{ template.name }}</p>
                <p v-if="template.description" class="template-option-desc">
                  {{ template.description }}
                </p>
              </div>
              <span v-if="selectedTemplateId === template.id" class="check">✓</span>
            </div>
          </div>

          <div class="form-group">
            <label class="label">Notas para el estudiante (opcional)</label>
            <textarea 
              v-model="assignmentNotes" 
              class="input" 
              rows="3"
              placeholder="Instrucciones, objetivos, etc..."
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showAssign = false" class="btn btn-secondary">
              Cancelar
            </button>
            <button 
              @click="handleAssignTemplate" 
              :disabled="!selectedTemplateId"
              class="btn btn-primary"
            >
              Asignar Rutina
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useTrainer } from '../composables/useTrainer'
import type { TrainingTemplate, TemplateAssignment } from '../types/training'

const authStore = useAuthStore()
const { 
  getTrainerStudents, 
  getTrainerTemplates,
  getStudentAssignments,
  assignTemplateToStudent
} = useTrainer()

const loading = ref(false)
const loadingAssignments = ref(false)
const students = ref<any[]>([])
const templates = ref<TrainingTemplate[]>([])
const selectedStudent = ref<any | null>(null)
const studentAssignments = ref<TemplateAssignment[]>([])
const showAssign = ref(false)
const studentToAssign = ref<any | null>(null)
const selectedTemplateId = ref<string | null>(null)
const assignmentNotes = ref('')

const assignmentsMap = ref<Record<string, number>>({})

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth && authStore.user && authStore.isTrainer) {
    loadData()
  }
}, { immediate: true })

async function loadData() {
  if (!authStore.user) return
  loading.value = true
  
  students.value = await getTrainerStudents(authStore.user.id)
  templates.value = await getTrainerTemplates(authStore.user.id)
  
  // Cargar asignaciones para cada estudiante
  for (const student of students.value) {
    const assignments = await getStudentAssignments(student.id)
    assignmentsMap.value[student.id] = assignments.length
  }
  
  loading.value = false
}

function getStudentAssignmentsCount(studentId: string): number {
  return assignmentsMap.value[studentId] || 0
}

async function viewStudentDetail(studentId: string) {
  const student = students.value.find(s => s.id === studentId)
  if (!student) return
  
  selectedStudent.value = student
  loadingAssignments.value = true
  studentAssignments.value = await getStudentAssignments(studentId)
  loadingAssignments.value = false
}

function openAssignModal(student: any) {
  studentToAssign.value = student
  selectedTemplateId.value = null
  assignmentNotes.value = ''
  showAssign.value = true
}

function selectTemplate(templateId: string) {
  selectedTemplateId.value = templateId
}

async function handleAssignTemplate() {
  if (!authStore.user || !studentToAssign.value || !selectedTemplateId.value) return

  try {
    await assignTemplateToStudent(
      selectedTemplateId.value,
      studentToAssign.value.id,
      authStore.user.id,
      assignmentNotes.value
    )

    showAssign.value = false
    alert('Rutina asignada correctamente')
    await loadData()
  } catch (error) {
    console.error('Error:', error)
    alert('Error al asignar la rutina')
  }
}

async function unassignTemplate(assignmentId: string) {
  if (!confirm('¿Quitar esta asignación?')) return
  
  // Aquí necesitarías una función deleteAssignment en useTrainer
  // Por ahora solo recargamos
  alert('Funcionalidad pendiente de implementar')
}

function copyTrainerId() {
  if (authStore.user?.id) {
    navigator.clipboard.writeText(authStore.user.id)
    alert('ID copiado al portapapeles')
  }
}

function formatDate(dateString: string) {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(date)
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

.header-section {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  margin: 0 0 1rem;
}

.stats {
  display: flex;
  gap: 1rem;
}

.stat-box {
  background: white;
  padding: 1rem 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: #2563eb;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-state h3 {
  margin: 0 0 0.5rem;
  color: #111827;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

.info-box {
  background: #eff6ff;
  padding: 1.5rem;
  border-radius: 0.5rem;
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

.info-box p {
  margin: 0;
  color: #1e40af;
  font-weight: 500;
}

.trainer-id {
  background: white;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-family: monospace;
  font-size: 0.875rem;
  color: #111827;
  border: 1px solid #dbeafe;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.student-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.student-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.student-avatar {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: bold;
}

.student-info {
  flex: 1;
}

.student-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem;
}

.student-role {
  font-size: 0.875rem;
  color: #6b7280;
}

.student-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.75rem 0;
  border-top: 1px solid #f3f4f6;
  border-bottom: 1px solid #f3f4f6;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-icon {
  font-size: 1.125rem;
}

.stat-text {
  font-size: 0.875rem;
  color: #6b7280;
}

.student-actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: none;
  font-size: 0.875rem;
  font-weight: 500;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-sm {
  padding: 0.375rem 0.75rem;
  font-size: 0.8125rem;
}

.btn-full {
  flex: 1;
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
  margin: 0 0 0.5rem;
}

.modal-subtitle {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0 0 1.5rem;
}

.loading-detail {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem;
}

.empty-section {
  text-align: center;
  padding: 2rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  color: #6b7280;
}

.assignments-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.assignment-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
}

.assignment-info {
  flex: 1;
}

.assignment-name {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem;
}

.assignment-date {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.assignment-notes {
  font-size: 0.875rem;
  color: #374151;
  margin: 0.5rem 0 0;
  font-style: italic;
}

.templates-select {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.template-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.template-option:hover {
  background: #f3f4f6;
}

.template-option.selected {
  background: #dbeafe;
  border-color: #2563eb;
}

.template-option-name {
  font-weight: 500;
  color: #111827;
  margin: 0 0 0.25rem;
}

.template-option-desc {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.check {
  color: #2563eb;
  font-weight: bold;
  font-size: 1.25rem;
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

@media (max-width: 768px) {
  .students-grid {
    grid-template-columns: 1fr;
  }

  .stats {
    flex-direction: column;
  }
}
</style>