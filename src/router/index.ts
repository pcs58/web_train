// src/router/index.ts
import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import DashboardView from '../views/DashboardView.vue'
import TrainingView from '../views/TrainingView.vue'
import AdminExercisesView from '../views/AdminExercisesView.vue'
import ActiveTrainingView from '../views/ActiveTrainingView.vue'
import HistoryView from '../views/HistoryView.vue'
import TrainerTemplatesView from '../views/TrainerTemplatesView.vue'
import TrainerTemplateEditView from '../views/TrainerTemplateEditView.vue'
import TrainerStudentsView from '../views/TrainerStudentsView.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: HomeView,
    meta: { requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: LoginView,
    meta: { requiresAuth: false }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterView,
    meta: { requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: DashboardView,
    meta: { requiresAuth: true }
  },
  {
    path: '/training',
    name: 'Training',
    component: TrainingView,
    meta: { requiresAuth: true }
  },
  {
    path: '/training/:dayId',
    name: 'ActiveTraining',
    component: ActiveTrainingView,
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'History',
    component: HistoryView,
    meta: { requiresAuth: true }
  },
  {
    path: '/admin/exercises',
    name: 'AdminExercises',
    component: AdminExercisesView,
    meta: { requiresAuth: true, requiresAdmin: true }
  },
  {
    path: '/trainer/templates',
    name: 'TrainerTemplates',
    component: TrainerTemplatesView,
    meta: { requiresAuth: true, requiresTrainer: true }
  },
  {
    path: '/trainer/templates/:templateId',
    name: 'TrainerTemplateEdit',
    component: TrainerTemplateEditView,
    meta: { requiresAuth: true, requiresTrainer: true }
  },
  {
    path: '/trainer/students',
    name: 'TrainerStudents',
    component: TrainerStudentsView,
    meta: { requiresAuth: true, requiresTrainer: true }
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

// Guard de navegación para proteger rutas
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const requiresAuth = to.meta.requiresAuth
  const requiresAdmin = to.meta.requiresAdmin
  const requiresTrainer = to.meta.requiresTrainer

  // Esperar a que el auth store esté inicializado
  if (authStore.loading) {
    const checkAuth = setInterval(() => {
      if (!authStore.loading) {
        clearInterval(checkAuth)
        checkRoute()
      }
    }, 100)
    return
  }

  checkRoute()

  function checkRoute() {
    if (requiresAuth && !authStore.isAuthenticated) {
      // Redirigir al login si la ruta requiere auth
      next({ name: 'Login', query: { redirect: to.fullPath } })
    } else if (requiresAdmin && !authStore.isAdmin) {
      // Redirigir al dashboard si la ruta requiere admin y no lo es
      alert('No tienes permisos de administrador para acceder a esta página')
      next({ name: 'Dashboard' })
    } else if (requiresTrainer && !authStore.isTrainerOrAdmin) {
      // Redirigir al dashboard si la ruta requiere trainer y no lo es
      alert('Necesitas ser entrenador para acceder a esta página')
      next({ name: 'Dashboard' })
    } else if ((to.name === 'Login' || to.name === 'Register') && authStore.isAuthenticated) {
      // Si ya está autenticado y va a login/register, redirigir a dashboard
      next({ name: 'Dashboard' })
    } else {
      next()
    }
  }
})

export default router