<!-- src/views/RegisterView.vue (Sin Tailwind) -->
<template>
  <div class="page">
    <div class="container">
      <div class="card">
        <div class="header">
          <h2 class="title">Crear Cuenta</h2>
        </div>
        
        <form @submit.prevent="handleRegister" class="form">
          <div v-if="error" class="alert alert-error">
            {{ error }}
          </div>

          <div v-if="success" class="alert alert-success">
            ¡Cuenta creada! Revisa tu email para confirmar.
          </div>

          <div class="form-group">
            <label for="email" class="label">Email</label>
            <input
              id="email"
              v-model="email"
              type="email"
              required
              class="input"
              placeholder="tu@email.com"
            />
          </div>

          <div class="form-group">
            <label for="password" class="label">
              Contraseña (mínimo 6 caracteres)
            </label>
            <input
              id="password"
              v-model="password"
              type="password"
              required
              minlength="6"
              class="input"
              placeholder="••••••••"
            />
          </div>

          <div class="form-group">
            <label for="confirmPassword" class="label">
              Confirmar Contraseña
            </label>
            <input
              id="confirmPassword"
              v-model="confirmPassword"
              type="password"
              required
              class="input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="btn btn-primary btn-full"
          >
            {{ loading ? 'Registrando...' : 'Crear Cuenta' }}
          </button>

          <div class="footer-link">
            <router-link to="/login" class="link">
              ¿Ya tienes cuenta? Inicia sesión
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'

const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const success = ref(false)
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  success.value = false

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden'
    return
  }

  if (password.value.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }

  loading.value = true

  try {
    await authStore.signUp(email.value, password.value)
    success.value = true
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
  } catch (err: any) {
    error.value = err.message || 'Error al crear cuenta'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f9fafb;
  padding: 1rem;
}

.container {
  max-width: 28rem;
  width: 100%;
}

.card {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.header {
  margin-bottom: 2rem;
}

.title {
  text-align: center;
  font-size: 1.875rem;
  font-weight: bold;
  color: #111827;
  margin: 0;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.alert {
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.alert-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.alert-success {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #15803d;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
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
  transition: all 0.2s;
  box-sizing: border-box;
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

.btn-full {
  width: 100%;
  padding: 0.625rem 1rem;
}

.footer-link {
  text-align: center;
}

.link {
  font-size: 0.875rem;
  color: #2563eb;
  text-decoration: none;
  transition: color 0.2s;
}

.link:hover {
  color: #1d4ed8;
}
</style>