// src/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  role: 'user' | 'trainer' | 'admin'
  trainer_id: string | null
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<UserProfile | null>(null)
  const loading = ref(true)

  const isAuthenticated = computed(() => !!user.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isTrainer = computed(() => profile.value?.role === 'trainer')
  const isTrainerOrAdmin = computed(() => 
    profile.value?.role === 'trainer' || profile.value?.role === 'admin'
  )

  // Cargar perfil del usuario
  async function loadProfile() {
    if (!user.value) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.value.id)
        .single()

      if (error) throw error
      profile.value = data
    } catch (error) {
      console.error('Error loading profile:', error)
    }
  }

  // Inicializar sesión al cargar la app
  async function initialize() {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null

      if (user.value) {
        await loadProfile()
      }

      // Escuchar cambios de autenticación
      supabase.auth.onAuthStateChange(async (_event, session) => {
        user.value = session?.user ?? null
        if (user.value) {
          await loadProfile()
        } else {
          profile.value = null
        }
      })
    } catch (error) {
      console.error('Error initializing auth:', error)
    } finally {
      loading.value = false
    }
  }

  // Registro
  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })
    if (error) throw error
    return data
  }

  // Login
  async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
    user.value = data.user
    await loadProfile()
    return data
  }

  // Logout
  async function signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    user.value = null
    profile.value = null
  }

  // Actualizar rol
  async function updateRole(userId: string, newRole: 'user' | 'trainer' | 'admin') {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId)

    if (error) throw error
    if (userId === user.value?.id) {
      await loadProfile()
    }
  }

  return {
    user,
    profile,
    loading,
    isAuthenticated,
    isAdmin,
    isTrainer,
    isTrainerOrAdmin,
    initialize,
    signUp,
    signIn,
    signOut,
    updateRole,
  }
})