import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'
import client, { handleResponseError } from './client'
import { useAuthStore } from '../store/authStore'

describe('api client', () => {
  it('baseURL이 /api로 설정되어 있다', () => {
    expect(client.defaults.baseURL).toBe('/api')
  })
})

describe('handleResponseError', () => {
  const originalAdapter = client.defaults.adapter

  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().clearAuth()
    useAuthStore.getState().setAuth('old-access', 'old-refresh')
    vi.restoreAllMocks()
  })

  afterEach(() => {
    client.defaults.adapter = originalAdapter
  })

  it('401 응답 시 refresh 토큰으로 재발급 받고 원 요청을 재시도하며 accessToken이 갱신된다', async () => {
    vi.spyOn(axios, 'post').mockResolvedValueOnce({
      data: { accessToken: 'new-access', refreshToken: 'new-refresh' },
    })
    client.defaults.adapter = vi.fn().mockResolvedValue({ status: 200, data: {}, config: {}, headers: {} })

    const originalRequest = { url: '/work-logs', headers: {}, _retry: false }
    const error = { config: originalRequest, response: { status: 401 } }

    await handleResponseError(error)

    expect(axios.post).toHaveBeenCalledWith('/api/auth/refresh', { refreshToken: 'old-refresh' })
    expect(client.defaults.adapter).toHaveBeenCalled()
    expect(useAuthStore.getState().accessToken).toBe('new-access')
    expect(useAuthStore.getState().refreshToken).toBe('new-refresh')
  })

  it('refresh 요청도 401로 실패하면 clearAuth 후 로그인 화면으로 이동한다', async () => {
    vi.spyOn(axios, 'post').mockRejectedValueOnce({ response: { status: 401 } })
    delete window.location
    window.location = { href: '' }

    const originalRequest = { url: '/work-logs', headers: {}, _retry: false }
    const error = { config: originalRequest, response: { status: 401 } }

    await expect(handleResponseError(error)).rejects.toBeTruthy()

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().refreshToken).toBeNull()
    expect(window.location.href).toBe('/login')
  })

  it('/auth/refresh 요청 자체의 401은 재시도 없이 그대로 reject된다', async () => {
    const postSpy = vi.spyOn(axios, 'post')
    const originalRequest = { url: '/auth/refresh', headers: {}, _retry: false }
    const error = { config: originalRequest, response: { status: 401 } }

    await expect(handleResponseError(error)).rejects.toBe(error)
    expect(postSpy).not.toHaveBeenCalled()
  })
})
