import { renderHook, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { useCreateManager } from '../useUsers.js'

vi.mock('../../api/users.js', () => ({
  listUsers: vi.fn(),
  createManager: vi.fn().mockResolvedValue({ id: 'new' }),
}))

describe('useCreateManager', () => {
  it('생성 성공 시 사용자 목록과 연차 잔여 목록을 모두 갱신한다', async () => {
    const queryClient = new QueryClient()
    const spy = vi.spyOn(queryClient, 'invalidateQueries')
    const wrapper = ({ children }) => <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    const { result } = renderHook(() => useCreateManager(), { wrapper })

    await act(() => result.current.mutateAsync({}))

    expect(spy).toHaveBeenCalledWith({ queryKey: ['users'] })
    expect(spy).toHaveBeenCalledWith({ queryKey: ['leaveBalances'] })
  })
})
