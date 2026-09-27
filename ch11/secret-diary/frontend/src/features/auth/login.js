import { useMutation } from '@tanstack/vue-query'
import httpClient from '../../shared/api/httpClient.js'

export function useLoginMutation() {
  return useMutation({
    mutationFn: (payload) => httpClient.post('/auth/login', payload).then((res) => res.data),
  })
}
