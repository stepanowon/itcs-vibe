import { QueryClient } from '@tanstack/react-query'

// authStore.logout에서 이전 사용자의 캐시를 비울 수 있도록 모듈로 분리한다.
export const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})
