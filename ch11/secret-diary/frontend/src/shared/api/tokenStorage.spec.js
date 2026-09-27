import { describe, it, expect, beforeEach } from 'vitest'
import {
  getAccessToken,
  setAccessToken,
  getRefreshToken,
  setRefreshToken,
  setTokens,
  clearTokens,
} from './tokenStorage'

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('setAccessToken/getAccessToken이 localStorage에 올바르게 저장·조회된다', () => {
    setAccessToken('access-token-1')

    expect(getAccessToken()).toBe('access-token-1')
    expect(localStorage.getItem('secretDiary.accessToken')).toBe('access-token-1')
  })

  it('setRefreshToken/getRefreshToken이 localStorage에 올바르게 저장·조회된다', () => {
    setRefreshToken('refresh-token-1')

    expect(getRefreshToken()).toBe('refresh-token-1')
    expect(localStorage.getItem('secretDiary.refreshToken')).toBe('refresh-token-1')
  })

  it('setTokens 호출 시 accessToken과 refreshToken이 함께 저장된다', () => {
    setTokens({ accessToken: 'access-token-2', refreshToken: 'refresh-token-2' })

    expect(getAccessToken()).toBe('access-token-2')
    expect(getRefreshToken()).toBe('refresh-token-2')
  })

  it('clearTokens 호출 후 accessToken과 refreshToken이 모두 없어진다', () => {
    setTokens({ accessToken: 'access-token-3', refreshToken: 'refresh-token-3' })

    clearTokens()

    expect(getAccessToken()).toBeNull()
    expect(getRefreshToken()).toBeNull()
  })
})
