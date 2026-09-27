import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import MockAdapter from 'axios-mock-adapter'
import App from './App.vue'
import router from './router/index.js'
import httpClient from './shared/api/httpClient.js'
import { useAuthStore } from './stores/auth.js'

describe('App', () => {
  let pinia
  let mockHttp

  beforeEach(async () => {
    localStorage.clear()
    pinia = createPinia()
    setActivePinia(pinia)

    mockHttp = new MockAdapter(httpClient)
    mockHttp.onGet('/diaries').reply(200, {
      items: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    })
  })

  afterEach(() => {
    mockHttp.restore()
  })

  function mountApp() {
    const queryClient = new QueryClient()
    return mount(App, {
      global: {
        plugins: [pinia, router, [VueQueryPlugin, { queryClient }]],
      },
    })
  }

  it('미인증 상태로 진입 시 로그인 화면(router-view)이 에러 없이 렌더된다', async () => {
    await router.push('/')
    await router.isReady()

    const wrapper = mountApp()

    expect(wrapper.exists()).toBe(true)
  })

  it('인증 상태로 / 진입 시 router-view를 통해 홈(비밀일기 레이아웃) 내용이 렌더된다', async () => {
    useAuthStore().login({ accessToken: 'access-token', refreshToken: 'refresh-token' })

    await router.push('/')
    await router.isReady()

    const wrapper = mountApp()
    await flushPromises()

    expect(wrapper.text()).toContain('비밀일기')
  })
})
