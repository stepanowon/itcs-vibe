import { describe, it, expect, beforeEach } from 'vitest'
import { useAuthStore } from './authStore'

describe('authStore', () => {
  beforeEach(() => {
    localStorage.clear()
    useAuthStore.getState().clearAuth()
  })

  it('초기 상태는 accessToken/refreshToken이 null이고 isAuthenticated가 false다', () => {
    const state = useAuthStore.getState()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setAuth 호출 시 accessToken/refreshToken/isAuthenticated가 갱신된다', () => {
    useAuthStore.getState().setAuth('access1', 'refresh1')
    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('access1')
    expect(state.refreshToken).toBe('refresh1')
    expect(state.isAuthenticated).toBe(true)
  })

  it('clearAuth 호출 시 초기 상태로 되돌아간다', () => {
    useAuthStore.getState().setAuth('access1', 'refresh1')
    useAuthStore.getState().clearAuth()
    const state = useAuthStore.getState()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.isAuthenticated).toBe(false)
  })

  it('setAuth 호출 시 refreshToken만 localStorage에 영속화되고 accessToken은 저장되지 않는다', () => {
    useAuthStore.getState().setAuth('access1', 'refresh1')
    const persisted = JSON.parse(localStorage.getItem('auth-storage'))
    expect(persisted.state.refreshToken).toBe('refresh1')
    expect(persisted.state.accessToken).toBeUndefined()
  })
})
