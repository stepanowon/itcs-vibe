import { describe, it, expect, vi, beforeEach } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mswServer.js'

const mockStore = {
  accessToken: 'old-access-token',
  refreshToken: 'old-refresh-token',
  setTokens: vi.fn((data) => {
    mockStore.accessToken = data.accessToken
    mockStore.refreshToken = data.refreshToken
  }),
  logout: vi.fn(),
}

vi.mock('../../store/authStore.js', () => ({
  useAuthStore: { getState: () => mockStore },
}))

const BASE = 'http://localhost:3000/api/v1'

describe('api client 401 재시도', () => {
  beforeEach(() => {
    mockStore.accessToken = 'old-access-token'
    mockStore.refreshToken = 'old-refresh-token'
    mockStore.setTokens.mockClear()
    mockStore.logout.mockClear()
  })

  it('401 응답 후 refresh 토큰으로 재시도하여 성공한다', async () => {
    let callCount = 0
    server.use(
      http.get(`${BASE}/users/me`, ({ request }) => {
        callCount += 1
        if (callCount === 1) {
          return HttpResponse.json({ code: 'UNAUTHORIZED', message: '인증이 필요합니다' }, { status: 401 })
        }
        const auth = request.headers.get('Authorization')
        if (auth !== 'Bearer new-access-token') {
          return HttpResponse.json({ code: 'UNAUTHORIZED', message: '인증이 필요합니다' }, { status: 401 })
        }
        return HttpResponse.json({ id: 'u1', email: 'a@a.com' })
      }),
    )

    const { default: client } = await import('../client.js')
    const res = await client.get('/users/me')

    expect(res.data).toEqual({ id: 'u1', email: 'a@a.com' })
    expect(mockStore.setTokens).toHaveBeenCalledWith(
      expect.objectContaining({ accessToken: 'new-access-token' }),
    )
    expect(callCount).toBe(2)
  })

  it('refresh 실패 시 logout을 호출한다', async () => {
    server.use(
      http.get(`${BASE}/users/me`, () =>
        HttpResponse.json({ code: 'UNAUTHORIZED', message: '인증이 필요합니다' }, { status: 401 }),
      ),
      http.post(`${BASE}/auth/refresh`, () =>
        HttpResponse.json({ code: 'INVALID_TOKEN', message: '리프레시 토큰이 유효하지 않습니다' }, { status: 401 }),
      ),
    )

    const { default: client } = await import('../client.js')

    await expect(client.get('/users/me')).rejects.toBeTruthy()
    expect(mockStore.logout).toHaveBeenCalled()
  })
})
