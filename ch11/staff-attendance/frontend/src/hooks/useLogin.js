import { useMutation } from '@tanstack/react-query'
import { login } from '../api/auth.js'
import { getMe } from '../api/users.js'
import { useAuthStore } from '../store/authStore.js'

export function useLogin() {
  return useMutation({
    mutationFn: async (payload) => {
      const tokens = await login(payload)
      useAuthStore.getState().setTokens(tokens)
      const user = await getMe()
      useAuthStore.getState().setUser(user)
      if (import.meta.env.DEV) console.log('[login] success', user.role)
      return { tokens, user }
    },
  })
}
