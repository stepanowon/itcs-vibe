import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import axios from 'axios'
import MockAdapter from 'axios-mock-adapter'
import * as tokenStorage from './tokenStorage'

vi.mock('./tokenStorage', async () => {
  const actual = await vi.importActual('./tokenStorage')
  return {
    ...actual,
    clearTokens: vi.fn(actual.clearTokens),
  }
})

const REFRESH_URL = 'http://localhost:3000/api/v1/auth/refresh'

describe('httpClient', () => {
  let httpClient
  let mockHttp
  let mockAxios

  beforeEach(async () => {
    localStorage.clear()
    tokenStorage.clearTokens.mockClear()
    vi.resetModules()
    ;({ default: httpClient } = await import('./httpClient'))
    mockHttp = new MockAdapter(httpClient)
    mockAxios = new MockAdapter(axios)
  })

  afterEach(() => {
    mockHttp.restore()
    mockAxios.restore()
  })

  it('accessToken이 저장되어 있으면 Authorization 헤더가 주입된다', async () => {
    tokenStorage.setAccessToken('access-123')

    mockHttp.onGet('/diaries').reply((config) => {
      expect(config.headers.Authorization).toBe('Bearer access-123')
      return [200, { ok: true }]
    })

    const response = await httpClient.get('/diaries')

    expect(response.data).toEqual({ ok: true })
  })

  it('401 응답 후 refresh가 성공하면 원 요청이 새 토큰으로 재시도되어 성공한다', async () => {
    tokenStorage.setAccessToken('old-access')
    tokenStorage.setRefreshToken('old-refresh')

    mockHttp.onGet('/diaries').reply((config) => {
      if (config.headers.Authorization === 'Bearer new-access') {
        return [200, { ok: true }]
      }
      return [401]
    })

    mockAxios.onPost(REFRESH_URL).reply(200, {
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    })

    const response = await httpClient.get('/diaries')

    expect(response.data).toEqual({ ok: true })
    expect(tokenStorage.getAccessToken()).toBe('new-access')
    expect(tokenStorage.getRefreshToken()).toBe('new-refresh')
  })

  it('동시에 여러 401이 발생해도 /auth/refresh 호출은 1회만 발생한다', async () => {
    tokenStorage.setAccessToken('old-access')
    tokenStorage.setRefreshToken('old-refresh')

    mockHttp.onGet('/a').reply((config) => {
      if (config.headers.Authorization === 'Bearer new-access') {
        return [200, { value: 'a' }]
      }
      return [401]
    })
    mockHttp.onGet('/b').reply((config) => {
      if (config.headers.Authorization === 'Bearer new-access') {
        return [200, { value: 'b' }]
      }
      return [401]
    })

    mockAxios.onPost(REFRESH_URL).reply(200, {
      accessToken: 'new-access',
      refreshToken: 'new-refresh',
    })

    const [resA, resB] = await Promise.all([httpClient.get('/a'), httpClient.get('/b')])

    expect(resA.data).toEqual({ value: 'a' })
    expect(resB.data).toEqual({ value: 'b' })

    const refreshCalls = mockAxios.history.post.filter((req) => req.url === REFRESH_URL)
    expect(refreshCalls.length).toBe(1)
  })

  it('refresh 자체가 실패하면 clearTokens 호출 및 auth:logout 이벤트가 발생하고 원 요청은 실패한다', async () => {
    tokenStorage.setAccessToken('old-access')
    tokenStorage.setRefreshToken('old-refresh')

    mockHttp.onGet('/diaries').reply(401)
    mockAxios.onPost(REFRESH_URL).reply(401)

    const logoutHandler = vi.fn()
    window.addEventListener('auth:logout', logoutHandler)

    await expect(httpClient.get('/diaries')).rejects.toBeTruthy()

    expect(tokenStorage.clearTokens).toHaveBeenCalledTimes(1)
    expect(logoutHandler).toHaveBeenCalledTimes(1)

    window.removeEventListener('auth:logout', logoutHandler)
  })
})
