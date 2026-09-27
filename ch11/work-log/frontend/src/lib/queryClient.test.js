import { describe, it, expect } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { queryClient } from './queryClient'

describe('queryClient', () => {
  it('QueryClient의 인스턴스다', () => {
    expect(queryClient).toBeInstanceOf(QueryClient)
  })
})
