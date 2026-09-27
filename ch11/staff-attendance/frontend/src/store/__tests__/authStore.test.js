import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../authStore.js'
import { queryClient } from '../../queryClient.js'

const resetState = () =>
  useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, role: null })

describe('authStore', () => {
  beforeEach(resetState)

  it('login 호출 시 accessToken/refreshToken/user/role이 반영된다', () => {
    const user = { id: 1, email: 'a@b.com', name: '홍길동', role: 'EMPLOYEE' }
    useAuthStore.getState().login({ accessToken: 'at', refreshToken: 'rt', user })

    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('at')
    expect(state.refreshToken).toBe('rt')
    expect(state.user).toEqual(user)
    expect(state.role).toBe('EMPLOYEE')
  })

  it('logout 호출 시 모든 상태가 null로 초기화된다', () => {
    useAuthStore.getState().login({
      accessToken: 'at',
      refreshToken: 'rt',
      user: { id: 1, role: 'ADMIN' },
    })

    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.accessToken).toBeNull()
    expect(state.refreshToken).toBeNull()
    expect(state.user).toBeNull()
    expect(state.role).toBeNull()
  })

  it('logout 호출 시 이전 사용자의 쿼리 캐시가 비워진다', () => {
    queryClient.setQueryData(['leaveBalance', 'me'], { remainingDays: 13 })

    useAuthStore.getState().logout()

    expect(queryClient.getQueryData(['leaveBalance', 'me'])).toBeUndefined()
  })

  it('setTokens 호출 시 accessToken/refreshToken만 갱신되고 user/role은 유지된다', () => {
    const user = { id: 1, role: 'EMPLOYEE' }
    useAuthStore.getState().login({ accessToken: 'at', refreshToken: 'rt', user })

    useAuthStore.getState().setTokens({ accessToken: 'new-at', refreshToken: 'new-rt' })

    const state = useAuthStore.getState()
    expect(state.accessToken).toBe('new-at')
    expect(state.refreshToken).toBe('new-rt')
    expect(state.user).toEqual(user)
    expect(state.role).toBe('EMPLOYEE')
  })
})
