import { describe, it, expect, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useAuthStore } from './auth.js'
import { getAccessToken, getRefreshToken } from '../shared/api/tokenStorage.js'

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('login 호출 시 인증 상태가 true가 되고 토큰이 저장된다', () => {
    const store = useAuthStore()

    store.login({ accessToken: 'access-token', refreshToken: 'refresh-token' })

    expect(store.isAuthenticated).toBe(true)
    expect(getAccessToken()).toBe('access-token')
    expect(getRefreshToken()).toBe('refresh-token')
  })

  it('logout 호출 시 인증 상태가 false가 되고 토큰이 모두 지워진다', () => {
    const store = useAuthStore()
    store.login({ accessToken: 'access-token', refreshToken: 'refresh-token' })

    store.logout()

    expect(store.isAuthenticated).toBe(false)
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })

  it('localStorage에 토큰이 미리 저장되어 있으면 스토어 생성 시 초기 state에 반영된다', () => {
    localStorage.setItem('secretDiary.accessToken', 'stored-access-token')
    localStorage.setItem('secretDiary.refreshToken', 'stored-refresh-token')

    const store = useAuthStore()

    expect(store.accessToken).toBe('stored-access-token')
    expect(store.refreshToken).toBe('stored-refresh-token')
    expect(store.isAuthenticated).toBe(true)
  })

  it('auth:logout 이벤트가 발생하면 자동으로 로그아웃 상태가 된다', () => {
    const store = useAuthStore()
    store.login({ accessToken: 'access-token', refreshToken: 'refresh-token' })

    window.dispatchEvent(new Event('auth:logout'))

    expect(store.isAuthenticated).toBe(false)
    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})
