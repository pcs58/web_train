<!-- src/views/HomeView.vue (Sin Tailwind) -->
<template>
  <div class="page">
    <nav class="navbar">
      <div class="nav-container">
        <div class="nav-content">
          <h1 class="logo">Web Train</h1>
          <div class="nav-buttons">
            <template v-if="authStore.isAuthenticated">
              <router-link to="/dashboard" class="nav-link">
                Dashboard
              </router-link>
              <button @click="handleLogout" class="btn btn-danger">
                Cerrar Sesión
              </button>
            </template>
            <template v-else>
              <router-link to="/login" class="nav-link">
                Iniciar Sesión
              </router-link>
              <router-link to="/register" class="btn btn-primary">
                Registrarse
              </router-link>
            </template>
          </div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <div class="hero">
        <h1 class="title">
          Bienvenido a <span class="highlight">Web Train</span>
        </h1>
        <p class="subtitle">
          Una aplicación Vue 3 con autenticación de usuarios usando Supabase.
        </p>
        <div class="cta">
          <router-link to="/register" class="btn btn-large btn-primary">
            Comenzar
          </router-link>
        </div>
      </div>

      <div class="features">
        <div class="feature-card">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 class="feature-title">Autenticación Segura</h3>
          <p class="feature-text">Sistema de login y registro con Supabase</p>
        </div>

        <div class="feature-card">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 class="feature-title">Rápido y Eficiente</h3>
          <p class="feature-text">Construido con Vue 3 y TypeScript</p>
        </div>

        <div class="feature-card">
          <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <h3 class="feature-title">Rutas Protegidas</h3>
          <p class="feature-text">Guards de navegación automáticos</p>
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
    router.push('/')
  } catch (error) {
    console.error('Error al cerrar sesión:', error)
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: linear-gradient(to bottom right, #eff6ff, #e0e7ff);
}

.navbar {
  background: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
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

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-link {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  text-decoration: none;
  transition: color 0.2s;
}

.nav-link:hover {
  color: #111827;
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

.btn-danger {
  background: #dc2626;
  color: white;
}

.btn-danger:hover {
  background: #b91c1c;
}

.btn-large {
  padding: 0.75rem 2.5rem;
  font-size: 1rem;
}

.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 3rem 1rem;
}

.hero {
  text-align: center;
}

.title {
  font-size: 3rem;
  font-weight: bold;
  color: #111827;
  margin: 0 0 1rem;
}

.highlight {
  color: #2563eb;
}

.subtitle {
  max-width: 48rem;
  margin: 0 auto 2rem;
  font-size: 1.125rem;
  color: #6b7280;
}

.cta {
  margin-top: 2rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 4rem;
}

.feature-card {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.icon {
  width: 3rem;
  height: 3rem;
  color: #2563eb;
  margin: 0 auto 1rem;
}

.feature-title {
  font-size: 1.125rem;
  font-weight: 500;
  color: #111827;
  margin: 1rem 0 0.5rem;
}

.feature-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0.5rem 0 0;
}

@media (min-width: 640px) {
  .title {
    font-size: 3.75rem;
  }
}

@media (min-width: 768px) {
  .title {
    font-size: 4.5rem;
  }
  
  .subtitle {
    font-size: 1.25rem;
  }
  
  .btn-large {
    padding: 1rem 2.5rem;
    font-size: 1.125rem;
  }
}
</style>