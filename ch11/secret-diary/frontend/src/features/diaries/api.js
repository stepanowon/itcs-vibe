import { computed, unref } from 'vue'
import { useQuery, keepPreviousData } from '@tanstack/vue-query'
import httpClient from '../../shared/api/httpClient.js'

function buildParams(filters) {
  const raw = unref(filters)
  const params = {}

  if (raw.weather) params.weather = raw.weather
  if (raw.mood) params.mood = raw.mood
  if (raw.tag) params.tag = raw.tag
  if (raw.page) params.page = raw.page
  if (raw.limit) params.limit = raw.limit

  return params
}

export function useDiariesQuery(filters) {
  return useQuery({
    queryKey: computed(() => ['diaries', buildParams(filters)]),
    queryFn: () => httpClient.get('/diaries', { params: buildParams(filters) }).then((res) => res.data),
    placeholderData: keepPreviousData,
  })
}
