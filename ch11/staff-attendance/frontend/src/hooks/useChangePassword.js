import { useMutation } from '@tanstack/react-query'
import { changePassword } from '../api/users.js'
import { useAuthStore } from '../store/authStore.js'

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: (data) => {
      useAuthStore.getState().setTokens(data)
    },
  })
}
