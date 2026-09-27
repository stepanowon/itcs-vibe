import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearTokens,
} from '../shared/api/tokenStorage.js'

export const useAuthStore = defineStore('auth', () => {
  const accessToken = ref(getAccessToken())
  const refreshToken = ref(getRefreshToken())
  const user = ref(null)

  const isAuthenticated = computed(() => !!accessToken.value)

  function login({ accessToken: newAccessToken, refreshToken: newRefreshToken }) {
    accessToken.value = newAccessToken
    refreshToken.value = newRefreshToken
    setTokens({ accessToken: newAccessToken, refreshToken: newRefreshToken })
  }

  function setUser(newUser) {
    user.value = newUser
  }

  function logout() {
    accessToken.value = null
    refreshToken.value = null
    user.value = null
    clearTokens()
  }

  window.addEventListener('auth:logout', () => {
    logout()
  })

  return {
    accessToken,
    refreshToken,
    user,
    isAuthenticated,
    login,
    setUser,
    logout,
  }
})
