import { computed, unref } from 'vue'
import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import httpClient from '../../shared/api/httpClient.js'

export function useDiaryQuery(id) {
  return useQuery({
    queryKey: computed(() => ['diary', unref(id)]),
    queryFn: () => httpClient.get(`/diaries/${unref(id)}`).then((res) => res.data),
    enabled: computed(() => !!unref(id)),
    retry: false,
  })
}

export function useCreateDiaryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => httpClient.post('/diaries', payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
    },
  })
}

export function useUpdateDiaryMutation(id) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload) => httpClient.put(`/diaries/${unref(id)}`, payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diaries'] })
      queryClient.invalidateQueries({ queryKey: ['diary', unref(id)] })
    },
  })
}
