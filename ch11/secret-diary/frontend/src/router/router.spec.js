import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import MockAdapter from 'axios-mock-adapter'
import router from './index.js'
import httpClient from '../shared/api/httpClient.js'
import DiaryListPage from '../pages/DiaryListPage.vue'
import { useAuthStore } from '../stores/auth.js'

describe('router', () => {
  let mockHttp

  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
    mockHttp = new MockAdapter(httpClient)
    mockHttp.onGet('/diaries').reply(200, { items: [], pagination: { page: 1, limit: 20, total: 0, totalPages: 0 } })
  })

  afterEach(() => {
    mockHttp.restore()
  })

  it('미인증 상태로 / 에 진입하면 login으로 리다이렉트된다', async () => {
    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('인증 상태로 / 에 진입하면 route name이 home이고 DiaryListPage가 matched 된다', async () => {
    const authStore = useAuthStore()
    authStore.login({ accessToken: 'access-token', refreshToken: 'refresh-token' })

    await router.push('/')
    await router.isReady()

    expect(router.currentRoute.value.name).toBe('home')

    const matchedComponents = router.currentRoute.value.matched.map(
      (record) => record.components?.default
    )
    expect(matchedComponents).toContain(DiaryListPage)
  })

  describe('인증 가드', () => {
    const DummyComponent = { template: '<div>dummy</div>' }

    beforeEach(async () => {
      router.addRoute({
        path: '/protected-dummy',
        name: 'protected-dummy',
        component: DummyComponent,
        meta: { requiresAuth: true },
      })
      router.addRoute({
        path: '/guest-only-dummy',
        name: 'guest-only-dummy',
        component: DummyComponent,
        meta: { guestOnly: true },
      })
    })

    afterEach(() => {
      router.removeRoute('protected-dummy')
      router.removeRoute('guest-only-dummy')
    })

    it('requiresAuth 라우트에 미인증 상태로 진입하면 login으로 리다이렉트된다', async () => {
      await router.push({ name: 'protected-dummy' })

      expect(router.currentRoute.value.name).toBe('login')
    })

    it('guestOnly 라우트에 인증된 상태로 진입하면 home으로 리다이렉트된다', async () => {
      const authStore = useAuthStore()
      authStore.login({ accessToken: 'access-token', refreshToken: 'refresh-token' })

      await router.push({ name: 'guest-only-dummy' })

      expect(router.currentRoute.value.name).toBe('home')
    })

    it('guestOnly인 로그인 화면은 미인증 상태에서 정상 진입된다', async () => {
      await router.push({ name: 'login' })

      expect(router.currentRoute.value.name).toBe('login')
    })
  })
})
