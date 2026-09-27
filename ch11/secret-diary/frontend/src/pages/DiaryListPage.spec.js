import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import MockAdapter from 'axios-mock-adapter'
import httpClient from '../shared/api/httpClient.js'
import DiaryListPage from './DiaryListPage.vue'

describe('DiaryListPage', () => {
  let mockHttp
  let router
  let pinia

  const oneItemResponse = {
    items: [
      {
        id: 'd1',
        title: '첫 일기',
        content: '오늘의 일기 내용입니다.',
        weather: 'sunny',
        mood: 'happy',
        tags: ['일상'],
        diaryDate: '2026-01-01',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
  }

  const emptyResponse = {
    items: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  }

  beforeEach(async () => {
    mockHttp = new MockAdapter(httpClient)

    pinia = createPinia()
    setActivePinia(pinia)

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: DiaryListPage },
        { path: '/diaries/new', name: 'diary-new', component: { template: '<div>new</div>' } },
        { path: '/diaries/:id', name: 'diary-detail', component: { template: '<div>detail</div>' } },
        { path: '/me', name: 'me', component: { template: '<div>me</div>' } },
      ],
    })

    await router.push('/')
    await router.isReady()
  })

  afterEach(() => {
    mockHttp.restore()
  })

  function mountDiaryListPage() {
    const queryClient = new QueryClient()
    return mount(DiaryListPage, {
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

  it('목록을 조회하여 일기 카드를 렌더한다', async () => {
    mockHttp.onGet('/diaries').reply(200, oneItemResponse)

    const wrapper = mountDiaryListPage()
    await flushAll(wrapper)

    expect(wrapper.text()).toContain('첫 일기')
  })

  it('응답을 기다리는 동안 스켈레톤 UI를 렌더한다', async () => {
    mockHttp.onGet('/diaries').reply(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve([200, oneItemResponse]), 50)
        })
    )

    const wrapper = mountDiaryListPage()
    await wrapper.vm.$nextTick()

    expect(wrapper.findAll('.skeleton-box')).toHaveLength(3)

    await flushAll(wrapper)
  })

  it('일기가 없을 때 빈 상태 문구를 렌더한다', async () => {
    mockHttp.onGet('/diaries').reply(200, emptyResponse)

    const wrapper = mountDiaryListPage()
    await flushAll(wrapper)

    expect(wrapper.text()).toMatch(/아직 일기가 없/)
  })

  it('날씨 필터를 변경하면 해당 조건으로 재조회한다', async () => {
    mockHttp.onGet('/diaries').reply(200, oneItemResponse)

    const wrapper = mountDiaryListPage()
    await flushAll(wrapper)

    const selects = wrapper.findAll('select')
    let weatherSelect = null

    for (const select of selects) {
      const optionValues = select.findAll('option').map((o) => o.attributes('value') ?? o.element.value)
      if (optionValues.some((v) => v === 'sunny')) {
        weatherSelect = select
        break
      }
    }

    if (weatherSelect) {
      await weatherSelect.setValue('sunny')
    } else {
      const buttons = wrapper.findAll('button, [role="button"]')
      const buttonTitle = (b) => {
        if (b.attributes('title')) return b.attributes('title')
        const titledChild = b.find('[title]')
        return titledChild.exists() ? titledChild.attributes('title') : ''
      }
      const matchesWeather = (b) => /맑음|sunny/i.test(b.text()) || /맑음|sunny/i.test(buttonTitle(b))
      const weatherButton = buttons.find(matchesWeather)
      expect(weatherButton).toBeTruthy()
      await weatherButton.trigger('click')

      const applyButton = wrapper.findAll('button, [role="button"]').find((b) => /적용/.test(b.text()))
      if (applyButton) {
        await applyButton.trigger('click')
      }
    }

    await flushAll(wrapper)

    const getHistory = mockHttp.history.get
    expect(getHistory.length).toBeGreaterThan(1)

    const lastRequest = getHistory[getHistory.length - 1]
    expect(lastRequest.params?.weather ?? lastRequest.config?.params?.weather).toBe('sunny')
  })

  it('"새 일기" 버튼(FAB)을 클릭하면 작성 화면으로 이동한다', async () => {
    mockHttp.onGet('/diaries').reply(200, oneItemResponse)

    const wrapper = mountDiaryListPage()
    await flushAll(wrapper)

    const newDiaryLink = wrapper
      .findAllComponents({ name: 'RouterLink' })
      .find((link) => {
        const to = link.props('to')
        return to === 'diary-new' || to?.name === 'diary-new' || to === '/diaries/new'
      })

    expect(newDiaryLink).toBeTruthy()

    await newDiaryLink.trigger('click')
    await flushAll(wrapper)

    expect(router.currentRoute.value.name).toBe('diary-new')
  })
})
