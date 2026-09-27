import { useMutation, useQueryClient } from '@tanstack/vue-query'
import httpClient from '../../shared/api/httpClient.js'

export function useDeleteDiaryMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => httpClient.delete(`/diaries/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['diaries'] }),
  })
}
