<!-- src/views/TrainerTemplatesView.vue -->
<template>
  <div class="page">
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-content">
          <h1 class="logo">Mis Rutinas</h1>
          <div class="nav-right">
            <router-link to="/trainer/students" class="nav-link">Estudiantes</router-link>
            <router-link to="/dashboard" class="nav-link">Dashboard</router-link>
          </div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <div class="container">
        <div class="header-section">
          <h2 class="page-title">Rutinas de Entrenamiento</h2>
          <button @click="showCreateTemplate = true" class="btn btn-primary">
            + Nueva Rutina
          </button>
        </div>

        <div v-if="loading && templates.length === 0" class="loading">
          Cargando rutinas...
        </div>

        <div v-else-if="templates.length === 0" class="empty-state">
          <p>No has creado ninguna rutina aún.</p>
          <button @click="showCreateTemplate = true" class="btn btn-primary">
            Crear Primera Rutina
          </button>
        </div>

        <div v-else class="templates-grid">
          <div 
            v-for="template in templates" 
            :key="template.id"
            class="template-card"
          >
            <div class="template-header">
              <h3 class="template-title">{{ template.name }}</h3>
              <div class="template-actions">
                <button @click="editTemplate(template.id)" class="btn-icon" title="Editar">
                  ✏️
                </button>
                <button @click="deleteTemplateConfirm(template.id)" class="btn-icon btn-danger" title="Eliminar">
                  🗑️
                </button>
              </div>
            </div>
            
            <p v-if="template.description" class="template-description">
              {{ template.description }}
            </p>

            <div class="template-footer">
              <button @click="viewTemplate(template.id)" class="btn btn-secondary btn-sm">
                Ver Detalles
              </button>
              <button @click="showAssignModal(template)" class="btn btn-success btn-sm">
                Asignar
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal crear rutina -->
    <div v-if="showCreateTemplate" class="modal-overlay" @click="showCreateTemplate = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">Crear Nueva Rutina</h3>
        <form @submit.prevent="handleCreateTemplate">
          <div class="form-group">
            <label class="label">Nombre de la rutina</label>
            <input 
              v-model="newTemplate.name" 
              type="text" 
              required 
              class="input"
              placeholder="Ej: Rutina Hipertrofia 4 días"
            />
          </div>
          <div class="form-group">
            <label class="label">Descripción (opcional)</label>
            <textarea 
              v-model="newTemplate.description" 
              class="input" 
              rows="3"
              placeholder="Describe el objetivo de esta rutina..."
            ></textarea>
          </div>
          <div class="modal-actions">
            <button type="button" @click="showCreateTemplate = false" class="btn btn-secondary">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary">
              Crear Rutina
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal asignar a estudiante -->
    <div v-if="showAssign" class="modal-overlay" @click="showAssign = false">
      <div class="modal" @click.stop>
        <h3 class="modal-title">Asignar Rutina</h3>
        <p class="modal-subtitle">{{ selectedTemplate?.name }}</p>
        
        <div v-if="loadingStudents" class="loading-detail">Cargando estudiantes...</div>
        
        <div v-else-if="students.length === 0" class="empty-state-modal">
          <p>No tienes estudiantes aún.</p>
          <p class="text-sm">Los usuarios deben tener tu ID de entrenador en su perfil.</p>
        </div>

        <div v-else>
          <div class="students-list">
            <div 
              v-for="student in students" 
              :key="student.id"
              @click="selectStudent(student.id)"
              :class="['student-item', { selected: selectedStudentId === student.id }]"
            >
              <span>{{ student.email }}</span>
              <span v-if="selectedStudentId === student.id" class="check">✓</span>
            </div>
          </div>

          <div class="form-group">
            <label class="label">Notas (opcional)</label>
            <textarea 
              v-model="assignmentNotes" 
              class="input" 
              rows="2"
              placeholder="Instrucciones o comentarios..."
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="showAssign = false" class="btn btn-secondary">
              Cancelar
            </button>
            <button 
              @click="handleAssignTemplate" 
              :disabled="!selectedStudentId"
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
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useTrainer } from '../composables/useTrainer'
import type { TrainingTemplate } from '../types/training'

const router = useRouter()
const authStore = useAuthStore()
const { 
  loading, 
  createTemplate, 
  getTrainerTemplates, 
  getTrainerStudents,
  assignTemplateToStudent,
  deleteTemplate
} = useTrainer()

const templates = ref<TrainingTemplate[]>([])
const students = ref<any[]>([])
const showCreateTemplate = ref(false)
const showAssign = ref(false)
const loadingStudents = ref(false)
const selectedTemplate = ref<TrainingTemplate | null>(null)
const selectedStudentId = ref<string | null>(null)
const assignmentNotes = ref('')

const newTemplate = ref({
  name: '',
  description: ''
})

watch(() => authStore.isAuthenticated, (isAuth) => {
  if (isAuth && authStore.user && authStore.isTrainer) {
    loadTemplates()
  }
}, { immediate: true })

async function loadTemplates() {
  if (!authStore.user) return
  templates.value = await getTrainerTemplates(authStore.user.id)
}

async function handleCreateTemplate() {
  if (!authStore.user) return

  try {
    const template = await createTemplate(
      authStore.user.id,
      newTemplate.value.name,
      newTemplate.value.description
    )
    
    showCreateTemplate.value = false
    newTemplate.value = { name: '', description: '' }
    
    // Redirigir a editar la rutina recién creada
    router.push(`/trainer/templates/${template.id}`)
  } catch (error) {
    console.error('Error creating template:', error)
  }
}

function editTemplate(templateId: string) {
  router.push(`/trainer/templates/${templateId}`)
}

function viewTemplate(templateId: string) {
  router.push(`/trainer/templates/${templateId}`)
}

async function showAssignModal(template: TrainingTemplate) {
  selectedTemplate.value = template
  selectedStudentId.value = null
  assignmentNotes.value = ''
  showAssign.value = true
  
  // Cargar estudiantes
  if (authStore.user) {
    loadingStudents.value = true
    students.value = await getTrainerStudents(authStore.user.id)
    loadingStudents.value = false
  }
}

function selectStudent(studentId: string) {
  selectedStudentId.value = studentId
}

async function handleAssignTemplate() {
  if (!authStore.user || !selectedTemplate.value || !selectedStudentId.value) return

  try {
    await assignTemplateToStudent(
      selectedTemplate.value.id,
      selectedStudentId.value,
      authStore.user.id,
      assignmentNotes.value
    )

    showAssign.value = false
    alert('Rutina asignada correctamente')
  } catch (error) {
    console.error('Error assigning template:', error)
    alert('Error al asignar la rutina')
  }
}

async function deleteTemplateConfirm(templateId: string) {
  if (!confirm('¿Eliminar esta rutina? Esta acción no se puede deshacer.')) return

  try {
    await deleteTemplate(templateId)
    await loadTemplates()
  } catch (error) {
    console.error('Error deleting template:', error)
  }
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

.loading, .empty-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.template-card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.template-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.template-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  flex: 1;
}

.template-actions {
  display: flex;
  gap: 0.5rem;
}

.template-description {
  color: #6b7280;
  font-size: 0.875rem;
  margin: 0;
  line-height: 1.5;
}

.template-footer {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
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

.btn-success {
  background: #16a34a;
  color: white;
}

.btn-success:hover {
  background: #15803d;
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

.loading-detail {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.empty-state-modal {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.text-sm {
  font-size: 0.875rem;
}

.students-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  max-height: 300px;
  overflow-y: auto;
}

.student-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.student-item:hover {
  background: #f3f4f6;
}

.student-item.selected {
  background: #dbeafe;
  border-color: #2563eb;
}

.check {
  color: #2563eb;
  font-weight: bold;
}

@media (max-width: 768px) {
  .templates-grid {
    grid-template-columns: 1fr;
  }
}
</style>