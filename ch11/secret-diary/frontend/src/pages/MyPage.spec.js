import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import MockAdapter from 'axios-mock-adapter'
import httpClient from '../shared/api/httpClient.js'
import { useAuthStore } from '../stores/auth.js'
import MyPage from './MyPage.vue'

describe('MyPage', () => {
  let mockHttp
  let router
  let pinia

  const meResponse = {
    id: 'u1',
    email: 'user@example.com',
    username: 'jimin',
    createdAt: '2026-01-01T00:00:00Z',
    diaryCount: 42,
  }

  beforeEach(async () => {
    localStorage.clear()
    mockHttp = new MockAdapter(httpClient)

    pinia = createPinia()
    setActivePinia(pinia)

    useAuthStore().login({ accessToken: 'a', refreshToken: 'r' })

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>home</div>' } },
        { path: '/me', name: 'me', component: MyPage },
        { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
      ],
    })

    await router.push('/me')
    await router.isReady()
  })

  afterEach(() => {
    mockHttp.restore()
  })

  function mountMyPage() {
    const queryClient = new QueryClient()
    return mount(MyPage, {
      global: {
        plugins: [pinia, router, [VueQueryPlugin, { queryClient }]],
      },
    })
  }

  async function flushAll(wrapper) {
    await flushPromises()
    await new Promise((resolve) => setTimeout(resolve, 0))
    await flushPromises()
    await wrapper.vm.$nextTick()
  }

  async function fillPasswordForm(wrapper, { current, next, confirm }) {
    const passwordInputs = wrapper.findAll('input[type="password"]')
    expect(passwordInputs.length).toBeGreaterThanOrEqual(3)

    await passwordInputs[0].setValue(current)
    await passwordInputs[1].setValue(next)
    await passwordInputs[2].setValue(confirm)
  }

  function findPasswordForm(wrapper) {
    const forms = wrapper.findAll('form')
    const passwordForm = forms.find((form) => form.findAll('input[type="password"]').length >= 3)
    expect(passwordForm).toBeTruthy()
    return passwordForm
  }

  it('프로필 응답이 지연되는 동안 스켈레톤을 표시하고 프로필 텍스트는 표시하지 않는다', async () => {
    mockHttp.onGet('/users/me').reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve([200, meResponse]), 50)
      })
    })

    const wrapper = mountMyPage()
    await flushPromises()

    expect(wrapper.find('.skeleton-wrapper').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('user@example.com')

    await flushAll(wrapper)
  })

  it('내 정보(이메일, 사용자명, 일기 개수)를 화면에 표시한다', async () => {
    mockHttp.onGet('/users/me').reply(200, meResponse)

    const wrapper = mountMyPage()
    await flushAll(wrapper)

    expect(wrapper.text()).toContain('jimin')
    expect(wrapper.text()).toContain('user@example.com')
    expect(wrapper.text()).toContain('42')
  })

  it('비밀번호 변경 성공 시 완료 안내 문구를 표시한다', async () => {
    mockHttp.onGet('/users/me').reply(200, meResponse)
    mockHttp.onPut('/users/me/password').reply(204)

    const wrapper = mountMyPage()
    await flushAll(wrapper)

    await fillPasswordForm(wrapper, {
      current: 'oldPassword1',
      next: 'newPassword1',
      confirm: 'newPassword1',
    })

    const form = findPasswordForm(wrapper)
    await form.trigger('submit')
    await flushAll(wrapper)

    expect(wrapper.text()).toMatch(/완료|변경/)
  })

  it('비밀번호 변경 실패(400) 시 서버 에러 메시지를 표시한다', async () => {
    mockHttp.onGet('/users/me').reply(200, meResponse)
    mockHttp.onPut('/users/me/password').reply(400, {
      code: 'BAD_REQUEST',
      message: '현재 비밀번호가 올바르지 않습니다.',
    })

    const wrapper = mountMyPage()
    await flushAll(wrapper)

    await fillPasswordForm(wrapper, {
      current: 'wrongPassword1',
      next: 'newPassword1',
      confirm: 'newPassword1',
    })

    const form = findPasswordForm(wrapper)
    await form.trigger('submit')
    await flushAll(wrapper)

    expect(wrapper.text()).toContain('현재 비밀번호가 올바르지 않습니다.')
  })

  it('클라이언트 검증 실패(짧은 비밀번호/확인 불일치) 시 서버 요청 없이 오류를 표시한다', async () => {
    mockHttp.onGet('/users/me').reply(200, meResponse)
    mockHttp.onPut('/users/me/password').reply(204)

    const wrapper = mountMyPage()
    await flushAll(wrapper)

    await fillPasswordForm(wrapper, {
      current: 'oldPassword1',
      next: 'short1',
      confirm: 'short1',
    })

    const form = findPasswordForm(wrapper)
    await form.trigger('submit')
    await flushAll(wrapper)

    expect(mockHttp.history.put.length).toBe(0)

    await fillPasswordForm(wrapper, {
      current: 'oldPassword1',
      next: 'newPassword1',
      confirm: 'differentPassword1',
    })

    await form.trigger('submit')
    await flushAll(wrapper)

    expect(mockHttp.history.put.length).toBe(0)
  })

  it('로그아웃 버튼 클릭 시 로그아웃 처리 후 로그인 화면으로 이동한다', async () => {
    mockHttp.onGet('/users/me').reply(200, meResponse)
    mockHttp.onPost('/auth/logout').reply(204)

    const wrapper = mountMyPage()
    await flushAll(wrapper)

    const contentScope = wrapper.find('.app-content').exists() ? wrapper.find('.app-content') : wrapper
    const buttons = contentScope.findAll('button, [role="button"]')
    const logoutButton = buttons.find((b) => /로그아웃/.test(b.text()))
    expect(logoutButton).toBeTruthy()

    await logoutButton.trigger('click')
    await flushAll(wrapper)

    const authStore = useAuthStore()
    expect(authStore.isAuthenticated).toBe(false)
    expect(router.currentRoute.value.name).toBe('login')
  })
})
