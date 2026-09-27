import { createRouter, createWebHistory } from 'vue-router'
import DiaryListPage from '../pages/DiaryListPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import SignupPage from '../pages/SignupPage.vue'
import MyPage from '../pages/MyPage.vue'
import DiaryFormPage from '../pages/DiaryFormPage.vue'
import DiaryDetailPage from '../pages/DiaryDetailPage.vue'
import { useAuthStore } from '../stores/auth.js'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: DiaryListPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      name: 'login',
      component: LoginPage,
      meta: { guestOnly: true },
    },
    {
      path: '/signup',
      name: 'signup',
      component: SignupPage,
      meta: { guestOnly: true },
    },
    {
      path: '/me',
      name: 'me',
      component: MyPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/diaries/new',
      name: 'diary-new',
      component: DiaryFormPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/diaries/:id/edit',
      name: 'diary-edit',
      component: DiaryFormPage,
      meta: { requiresAuth: true },
    },
    {
      path: '/diaries/:id',
      name: 'diary-detail',
      component: DiaryDetailPage,
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore()

  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login' }
  }

  if (to.meta.guestOnly && authStore.isAuthenticated) {
    return { name: 'home' }
  }
})

window.addEventListener('auth:logout', () => {
  if (router.currentRoute.value.meta.requiresAuth) {
    router.push({ name: 'login' })
  }
})

export default router
