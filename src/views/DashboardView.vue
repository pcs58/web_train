<!-- src/views/DashboardView.vue -->
<template>
  <div class="page">
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-content">
          <h1 class="logo">Dashboard</h1>
          <div class="nav-right">
            <span class="user-email">{{ authStore.user?.email }}</span>
            <button @click="handleLogout" class="btn btn-danger">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <div class="container">
        <div class="card">
          <h2 class="welcome-title">¡Bienvenido!</h2>
          <p class="welcome-text">
            Has iniciado sesión correctamente. Esta es una ruta protegida que solo pueden ver usuarios autenticados.
          </p>
          
          <div class="info-box">
            <div class="info-box-content">
              <div class="info-icon">
                <svg viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
              </div>
              <div>
                <p class="info-text">
                  <strong>ID de usuario:</strong> {{ authStore.user?.id }}
                </p>
                <p class="info-text" style="margin-top: 0.5rem;">
                  <strong>Email:</strong> {{ authStore.user?.email }}
                </p>
              </div>
            </div>
          </div>

          <div class="quick-actions">
            <h3 class="section-title">Accesos Rápidos</h3>
            <div class="actions-grid">
              <router-link to="/training" class="action-card">
                <div class="action-icon action-icon-blue">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div class="action-content">
                  <p class="action-title">Mis Entrenamientos</p>
                  <p class="action-description">Ver y gestionar tus rutinas</p>
                </div>
              </router-link>

              <router-link v-if="authStore.isAdmin" to="/admin/exercises" class="action-card">
                <div class="action-icon action-icon-purple">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div class="action-content">
                  <p class="action-title">Administración</p>
                  <p class="action-description">Gestionar ejercicios</p>
                </div>
              </router-link>

              <div class="action-card action-card-static">
                <div class="action-icon action-icon-green">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div class="action-content">
                  <p class="action-title">Estado</p>
                  <p class="action-description">{{ authStore.profile?.role === 'admin' ? 'Administrador' : 'Usuario' }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

async function handleLogout() {
  try {
    await authStore.signOut()
    router.push('/login')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
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
  align-items: center;
  gap: 1rem;
}

.user-email {
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
  transition: all 0.2s;
}

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 1.5rem;
}

.container {
  padding: 1.5rem 0;
}

.card {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
}

.welcome-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #111827;
  margin: 0 0 1rem;
}

.welcome-text {
  color: #6b7280;
  margin: 0 0 1.5rem;
  line-height: 1.5;
}

.info-box {
  background: #eff6ff;
  border-left: 4px solid #3b82f6;
  padding: 1rem;
  border-radius: 0.375rem;
  margin-bottom: 2rem;
}

.info-box-content {
  display: flex;
  gap: 0.75rem;
}

.info-icon {
  flex-shrink: 0;
  width: 1.25rem;
  height: 1.25rem;
  color: #3b82f6;
}

.info-text {
  font-size: 0.875rem;
  color: #1e40af;
  margin: 0;
}

.quick-actions {
  margin-top: 2rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 1rem;
}

.actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  text-decoration: none;
  transition: all 0.2s;
  cursor: pointer;
}

.action-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #2563eb;
}

.action-card-static {
  cursor: default;
}

.action-card-static:hover {
  transform: none;
  box-shadow: none;
  border-color: #e5e7eb;
}

.action-icon {
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-icon svg {
  width: 1.5rem;
  height: 1.5rem;
}

.action-icon-blue {
  background: #dbeafe;
  color: #2563eb;
}

.action-icon-green {
  background: #dcfce7;
  color: #16a34a;
}

.action-icon-purple {
  background: #f3e8ff;
  color: #9333ea;
}

.action-content {
  flex: 1;
}

.action-title {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem;
}

.action-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

@media (max-width: 640px) {
  .user-email {
    display: none;
  }

  .actions-grid {
    grid-template-columns: 1fr;
  }
}
</style>