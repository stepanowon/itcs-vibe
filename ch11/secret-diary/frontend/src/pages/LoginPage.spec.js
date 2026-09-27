import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import httpClient from '../shared/api/httpClient.js'
import { useAuthStore } from '../stores/auth.js'
import LoginPage from './LoginPage.vue'

describe('LoginPage', () => {
  let mockHttp
  let mockAxios
  let router
  let pinia

  beforeEach(async () => {
    localStorage.clear()
    mockHttp = new MockAdapter(httpClient)
    mockAxios = new MockAdapter(axios)

    pinia = createPinia()
    setActivePinia(pinia)

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>home</div>' } },
        { path: '/login', name: 'login', component: LoginPage },
        { path: '/signup', name: 'signup', component: { template: '<div>signup</div>' } },
      ],
    })

    await router.push('/login')
    await router.isReady()
  })

  afterEach(() => {
    mockHttp.restore()
    mockAxios.restore()
  })

  function mountLoginPage() {
    const queryClient = new QueryClient()
    return mount(LoginPage, {
      global: {
        plugins: [pinia, router, [VueQueryPlugin, { queryClient }]],
      },
    })
  }

  it('로그인 성공 시 인증 상태가 true가 되고 home으로 이동한다', async () => {
    mockHttp.onPost('/auth/login').reply(200, {
      accessToken: 'a',
      refreshToken: 'r',
      tokenType: 'Bearer',
      expiresIn: 43200,
    })

    const wrapper = mountLoginPage()

    await wrapper.find('input[type="text"], input[type="email"], #identifier').setValue('user@example.com')
    await wrapper.find('input[type="password"]').setValue('password123')
    await wrapper.find('form').trigger('submit')

    await flushPromises()
    await flushPromises()

    const authStore = useAuthStore()
    expect(authStore.isAuthenticated).toBe(true)
    expect(router.currentRoute.value.name).toBe('home')
  })

  it('로그인 실패(401) 시 에러 메시지를 표시하고 화면을 이동하지 않는다', async () => {
    mockHttp.onPost('/auth/login').reply(401, {
      code: 'UNAUTHORIZED',
      message: '이메일 또는 비밀번호가 올바르지 않습니다',
    })
    mockAxios.onPost(/\/auth\/refresh$/).reply(401)

    const wrapper = mountLoginPage()

    await wrapper.find('input[type="text"], input[type="email"], #identifier').setValue('user@example.com')
    await wrapper.find('input[type="password"]').setValue('wrong-password')
    await wrapper.find('form').trigger('submit')

    await flushPromises()
    await flushPromises()

    expect(wrapper.text()).toContain('이메일 또는 비밀번호가 올바르지 않습니다')
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('회원가입 화면으로 이동하는 링크가 존재한다', async () => {
    const wrapper = mountLoginPage()

    const signupLink = wrapper.findComponent({ name: 'RouterLink' })
    expect(signupLink.exists()).toBe(true)

    await signupLink.trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.name).toBe('signup')
  })
})
