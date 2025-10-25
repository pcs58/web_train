import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import AboutView from '../views/AboutView.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/about', name: 'About', component: AboutView },
]

const router = createRouter({
  history: createWebHistory('/web_train/'), // 👈 MUY IMPORTANTE para GitHub Pages
  routes,
})

export default router
