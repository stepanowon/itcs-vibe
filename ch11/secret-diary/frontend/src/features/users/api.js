import { useQuery, useMutation } from '@tanstack/vue-query'
import httpClient from '../../shared/api/httpClient.js'

export function useMeQuery() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => httpClient.get('/users/me').then((res) => res.data),
  })
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload) => httpClient.put('/users/me/password', payload).then((res) => res.data),
  })
}
