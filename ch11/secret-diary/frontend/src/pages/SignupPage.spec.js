import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { VueQueryPlugin, QueryClient } from '@tanstack/vue-query'
import MockAdapter from 'axios-mock-adapter'
import httpClient from '../shared/api/httpClient.js'
import SignupPage from './SignupPage.vue'

describe('SignupPage', () => {
  let mockHttp
  let router

  beforeEach(async () => {
    mockHttp = new MockAdapter(httpClient)

    router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/signup', name: 'signup', component: SignupPage },
        { path: '/login', name: 'login', component: { template: '<div>login</div>' } },
      ],
    })

    await router.push('/signup')
    await router.isReady()
  })

  afterEach(() => {
    mockHttp.restore()
  })

  function mountSignupPage() {
    const queryClient = new QueryClient()
    return mount(SignupPage, {
      global: {
        plugins: [router, [VueQueryPlugin, { queryClient }]],
      },
    })
  }

  async function submitForm(wrapper, { email, username, password, passwordConfirm }) {
    if (email !== undefined) {
      await wrapper.find('input[name="email"]').setValue(email)
    }
    if (username !== undefined) {
      await wrapper.find('input[name="username"]').setValue(username)
    }
    if (password !== undefined) {
      await wrapper.find('input[name="password"]').setValue(password)
    }
    if (passwordConfirm !== undefined) {
      await wrapper.find('input[name="passwordConfirm"]').setValue(passwordConfirm)
    }
    await wrapper.find('form').trigger('submit')
    await flushPromises()
  }

  it('입력값이 유효하지 않으면 필드별 오류를 표시하고 서버에 요청하지 않는다', async () => {
    const wrapper = mountSignupPage()

    await submitForm(wrapper, {
      email: 'not-an-email',
      username: 'a',
      password: '1234567',
      passwordConfirm: 'different',
    })

    expect(wrapper.text()).toContain('올바른 이메일 형식이 아닙니다')
    expect(wrapper.text()).toContain('사용자명은 2자 이상 50자 이하로 입력해주세요')
    expect(wrapper.text()).toContain('비밀번호는 8자 이상 입력해주세요')
    expect(wrapper.text()).toContain('비밀번호가 일치하지 않습니다')

    expect(mockHttp.history.post.length).toBe(0)
  })

  it('유효한 정보로 가입에 성공하면 로그인 화면으로 이동한다', async () => {
    mockHttp.onPost('/auth/signup').reply(201, {
      id: 1,
      email: 'user@example.com',
      username: 'testuser',
    })

    const wrapper = mountSignupPage()

    await submitForm(wrapper, {
      email: 'user@example.com',
      username: 'testuser',
      password: 'password123',
      passwordConfirm: 'password123',
    })

    expect(router.currentRoute.value.name).toBe('login')
  })

  it('이메일이 중복(409)되면 안내 메시지를 표시하고 화면을 이동하지 않는다', async () => {
    mockHttp.onPost('/auth/signup').reply(409, {
      code: 'CONFLICT',
      message: '이미 사용 중인 이메일입니다.',
    })

    const wrapper = mountSignupPage()

    await submitForm(wrapper, {
      email: 'user@example.com',
      username: 'testuser',
      password: 'password123',
      passwordConfirm: 'password123',
    })

    expect(wrapper.text()).toContain('이미 사용 중인 이메일입니다.')
    expect(router.currentRoute.value.name).toBe('signup')
  })
})
