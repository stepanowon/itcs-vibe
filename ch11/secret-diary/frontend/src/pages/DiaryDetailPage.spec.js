import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import MockAdapter from 'axios-mock-adapter'
import httpClient from '../shared/api/httpClient.js'
import { useAuthStore } from '../stores/auth.js'
import DiaryDetailPage from './DiaryDetailPage.vue'

describe('DiaryDetailPage', () => {
  let mockHttp
  let router
  let pinia

  const diaryResponse = {
    id: 'd1',
    title: '비 오는 날',
    content: '본문내용',
    weather: 'rainy',
    mood: 'sad',
    tags: ['일상'],
    diaryDate: '2026-01-01',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
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
        { path: '/diaries/:id', name: 'diary-detail', component: DiaryDetailPage },
        { path: '/diaries/:id/edit', name: 'diary-edit', component: { template: '<div>edit</div>' } },
        { path: '/me', name: 'me', component: { template: '<div>me</div>' } },
      ],
    })

    await router.push('/diaries/d1')
    await router.isReady()
  })

  afterEach(() => {
    mockHttp.restore()
  })

  function mountDiaryDetailPage() {
    const queryClient = new QueryClient()
    return mount(DiaryDetailPage, {
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

  it('일기 상세(제목, 본문 등)를 렌더한다', async () => {
    mockHttp.onGet('/diaries/d1').reply(200, diaryResponse)

    const wrapper = mountDiaryDetailPage()
    await flushAll(wrapper)

    expect(wrapper.text()).toContain('비 오는 날')
    expect(wrapper.text()).toContain('본문내용')
  })

  it('응답이 지연되는 동안 스켈레톤을 표시하고, 실제 제목/본문은 아직 나타나지 않는다', async () => {
    mockHttp.onGet('/diaries/d1').reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve([200, diaryResponse]), 50)
      })
    })

    const wrapper = mountDiaryDetailPage()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.skeleton-box').length).toBeGreaterThan(0)
    expect(wrapper.text()).not.toContain('비 오는 날')
    expect(wrapper.text()).not.toContain('본문내용')
  })

  it('403/404 응답 시 접근 불가 안내 문구를 표시한다', async () => {
    mockHttp.onGet('/diaries/d1').reply(404, { code: 'NOT_FOUND', message: 'Not Found' })

    const wrapper = mountDiaryDetailPage()
    await flushAll(wrapper)

    expect(wrapper.text()).toContain('찾을 수 없거나 접근 권한이 없습니다')
  })

  it('삭제는 확인모달을 통해 이중확인 후 처리되고, 완료 시 홈으로 이동한다', async () => {
    mockHttp.onGet('/diaries/d1').reply(200, diaryResponse)

    const wrapper = mountDiaryDetailPage()
    await flushAll(wrapper)

    const deleteButton = wrapper
      .findAll('button, [role="button"]')
      .find((b) => /삭제/.test(b.text()))
    expect(deleteButton).toBeTruthy()

    await deleteButton.trigger('click')
    await flushAll(wrapper)

    expect(wrapper.text()).toMatch(/삭제하시겠습니까|정말 삭제/)
    expect(mockHttp.history.delete.length).toBe(0)

    mockHttp.onDelete('/diaries/d1').reply(204)

    const confirmButtons = wrapper
      .findAll('button, [role="button"]')
      .filter((b) => /삭제|확인/.test(b.text()) && b.element !== deleteButton.element)
    expect(confirmButtons.length).toBeGreaterThan(0)

    await confirmButtons[confirmButtons.length - 1].trigger('click')
    await flushAll(wrapper)

    expect(mockHttp.history.delete.length).toBe(1)
    expect(router.currentRoute.value.name).toBe('home')
  })
})
