import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import MockAdapter from 'axios-mock-adapter'
import httpClient from '../shared/api/httpClient.js'
import DiaryFormPage from './DiaryFormPage.vue'
import { useAuthStore } from '../stores/auth.js'

describe('DiaryFormPage', () => {
  let mockHttp
  let router
  let pinia

  beforeEach(async () => {
    localStorage.clear()
    mockHttp = new MockAdapter(httpClient)

    pinia = createPinia()
    setActivePinia(pinia)

    const authStore = useAuthStore()
    authStore.login({ accessToken: 'access-token', refreshToken: 'refresh-token' })

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/', name: 'home', component: { template: '<div>home</div>' } },
        { path: '/me', name: 'me', component: { template: '<div>me</div>' } },
        { path: '/diaries/new', name: 'diary-new', component: DiaryFormPage },
        { path: '/diaries/:id/edit', name: 'diary-edit', component: DiaryFormPage },
        { path: '/diaries/:id', name: 'diary-detail', component: { template: '<div>detail</div>' } },
      ],
    })
  })

  afterEach(() => {
    mockHttp.restore()
  })

  function mountDiaryFormPage() {
    const queryClient = new QueryClient()
    return mount(DiaryFormPage, {
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

  function findTitleField(wrapper) {
    const byPlaceholder = wrapper.find('input[placeholder*="제목"]')
    if (byPlaceholder.exists()) {
      return byPlaceholder
    }
    const byName = wrapper.find('input[name="title"]')
    if (byName.exists()) {
      return byName
    }
    return wrapper.find('input[type="text"]')
  }

  function findContentField(wrapper) {
    const byPlaceholder = wrapper.find('textarea[placeholder*="내용"]')
    if (byPlaceholder.exists()) {
      return byPlaceholder
    }
    const byName = wrapper.find('textarea[name="content"]')
    if (byName.exists()) {
      return byName
    }
    return wrapper.find('textarea')
  }

  async function submitForm(wrapper) {
    const form = wrapper.find('form')
    if (form.exists()) {
      await form.trigger('submit')
    } else {
      const submitButton = wrapper
        .findAll('button')
        .find((button) => /저장|등록|수정|작성/.test(button.text()))
      await submitButton.trigger('click')
    }
    await flushAll(wrapper)
  }

  it('생성 모드: 제목/본문을 입력하고 제출하면 생성 성공 후 상세 화면으로 이동한다', async () => {
    mockHttp.onPost('/diaries').reply(201, {
      id: 'new-id',
      title: '새 일기 제목',
      content: '새 일기 본문입니다.',
    })

    await router.push('/diaries/new')
    await router.isReady()
    const wrapper = mountDiaryFormPage()
    await flushAll(wrapper)

    await findTitleField(wrapper).setValue('새 일기 제목')
    await findContentField(wrapper).setValue('새 일기 본문입니다.')

    await submitForm(wrapper)

    expect(mockHttp.history.post.length).toBe(1)
    expect(router.currentRoute.value.name).toBe('diary-detail')
    expect(router.currentRoute.value.params.id).toBe('new-id')
  })

  it('필수값(제목/본문)이 비어 있으면 인라인 오류를 표시하고 서버에 요청하지 않는다', async () => {
    await router.push('/diaries/new')
    await router.isReady()
    const wrapper = mountDiaryFormPage()
    await flushAll(wrapper)

    await submitForm(wrapper)

    expect(mockHttp.history.post.length).toBe(0)
    expect(wrapper.text()).toMatch(/제목|필수|입력/)
  })

  it('수정 모드로 진입하면 기존 일기 데이터로 폼이 프리필된다', async () => {
    mockHttp.onGet('/diaries/d1').reply(200, {
      id: 'd1',
      title: '기존제목',
      content: '기존본문',
      weather: 'sunny',
      mood: 'happy',
      tags: ['일상'],
    })

    await router.push('/diaries/d1/edit')
    await router.isReady()
    const wrapper = mountDiaryFormPage()
    await flushAll(wrapper)

    const titleField = findTitleField(wrapper)
    const contentField = findContentField(wrapper)

    expect(titleField.element.value).toBe('기존제목')
    expect(contentField.element.value).toBe('기존본문')
  })

  it('수정 모드: 기존 데이터 조회 중에는 스켈레톤을 보여주고 폼 필드는 보이지 않는다', async () => {
    mockHttp.onGet('/diaries/d1').reply(() => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve([
            200,
            {
              id: 'd1',
              title: '기존제목',
              content: '기존본문',
              weather: 'sunny',
              mood: 'happy',
              tags: ['일상'],
            },
          ])
        }, 50)
      })
    })

    await router.push('/diaries/d1/edit')
    await router.isReady()
    const wrapper = mountDiaryFormPage()
    await flushPromises()
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.skeleton-wrapper').exists()).toBe(true)
    const titleFieldBeforeLoad = findTitleField(wrapper)
    expect(titleFieldBeforeLoad.exists() && titleFieldBeforeLoad.element.value === '기존제목').toBe(false)

    await new Promise((resolve) => setTimeout(resolve, 60))
    await flushAll(wrapper)

    expect(wrapper.find('.skeleton-wrapper').exists()).toBe(false)
    expect(findTitleField(wrapper).element.value).toBe('기존제목')
  })

  it('수정 모드: 제목을 수정하고 제출하면 수정 성공 후 상세 화면으로 이동한다', async () => {
    mockHttp.onGet('/diaries/d1').reply(200, {
      id: 'd1',
      title: '기존제목',
      content: '기존본문',
      weather: 'sunny',
      mood: 'happy',
      tags: ['일상'],
    })
    mockHttp.onPut('/diaries/d1').reply(200, {
      id: 'd1',
      title: '수정된제목',
      content: '기존본문',
    })

    await router.push('/diaries/d1/edit')
    await router.isReady()
    const wrapper = mountDiaryFormPage()
    await flushAll(wrapper)

    await findTitleField(wrapper).setValue('수정된제목')

    await submitForm(wrapper)

    expect(mockHttp.history.put.length).toBe(1)
    expect(router.currentRoute.value.name).toBe('diary-detail')
    expect(router.currentRoute.value.params.id).toBe('d1')
  })

  it('생성 요청이 400으로 실패하면 서버 오류 메시지를 화면에 표시한다', async () => {
    mockHttp.onPost('/diaries').reply(400, {
      code: 'BAD_REQUEST',
      message: '입력값을 확인해주세요.',
    })

    await router.push('/diaries/new')
    await router.isReady()
    const wrapper = mountDiaryFormPage()
    await flushAll(wrapper)

    await findTitleField(wrapper).setValue('새 일기 제목')
    await findContentField(wrapper).setValue('새 일기 본문입니다.')

    await submitForm(wrapper)

    expect(wrapper.text()).toContain('입력값을 확인해주세요.')
    expect(router.currentRoute.value.name).not.toBe('diary-detail')
  })
})
