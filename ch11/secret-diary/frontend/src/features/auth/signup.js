import { useMutation } from '@tanstack/vue-query'
import httpClient from '../../shared/api/httpClient.js'

export function useSignupMutation() {
  return useMutation({
    mutationFn: (payload) => httpClient.post('/auth/signup', payload).then((res) => res.data),
  })
}
