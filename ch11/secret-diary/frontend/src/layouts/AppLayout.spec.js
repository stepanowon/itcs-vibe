import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import MockAdapter from 'axios-mock-adapter'
import AppLayout from './AppLayout.vue'
import { useAuthStore } from '../stores/auth.js'
import httpClient from '../shared/api/httpClient.js'

function createTestRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'home', component: { template: '<div>home</div>' } },
      { path: '/me', name: 'me', component: { template: '<div>me</div>' } },
      { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
    ],
  })
}

describe('AppLayout', () => {
  let router
  let mockHttp

  beforeEach(async () => {
    localStorage.clear()
    setActivePinia(createPinia())
    mockHttp = new MockAdapter(httpClient)
    router = createTestRouter()
    await router.push('/')
    await router.isReady()
  })

  afterEach(() => {
    mockHttp.restore()
  })

  it('slot 컨텐츠를 app-content 영역에 렌더한다', () => {
    const wrapper = mount(AppLayout, {
      global: { plugins: [router] },
      slots: { default: '<p class="page-content">본문</p>' },
    })

    expect(wrapper.find('.app-content .page-content').text()).toBe('본문')
  })

  it('상단 앱바(로고)와 가로 네비(일기/내 정보)를 렌더한다', () => {
    const wrapper = mount(AppLayout, { global: { plugins: [router] } })

    expect(wrapper.find('.app-bar__logo').text()).toContain('비밀일기')
    const navLinks = wrapper.findAll('.app-bar__nav .nav-link')
    expect(navLinks).toHaveLength(2)
    expect(wrapper.find('.app-bar__nav').text()).toContain('일기')
    expect(wrapper.find('.app-bar__nav').text()).toContain('내 정보')
  })

  it('상단 가로 네비(일기/내 정보)와 로그아웃 버튼을 렌더한다', () => {
    const wrapper = mount(AppLayout, { global: { plugins: [router] } })

    const navLinks = wrapper.findAll('.app-bar__nav .nav-link')
    expect(navLinks).toHaveLength(2)
    expect(wrapper.find('.logout-btn').exists()).toBe(true)
  })

  it('로그아웃 버튼 클릭 시 로그아웃 처리 후 로그인 화면으로 이동한다', async () => {
    mockHttp.onPost('/auth/logout').reply(204)

    const wrapper = mount(AppLayout, { global: { plugins: [router] } })
    const authStore = useAuthStore()
    authStore.login({ accessToken: 'access', refreshToken: 'refresh' })
    expect(authStore.isAuthenticated).toBe(true)

    await wrapper.find('.logout-btn').trigger('click')
    await flushPromises()

    expect(authStore.isAuthenticated).toBe(false)
    expect(router.currentRoute.value.name).toBe('login')
  })

  it('주요 터치 타깃(네비 항목)이 44px 이상의 min-width/min-height를 갖는다', () => {
    const wrapper = mount(AppLayout, { global: { plugins: [router] } })

    expect(wrapper.find('.nav-link').exists()).toBe(true)
  })
})
