import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from './LoginPage'
import client from '../api/client'
import { useAuthStore } from '../store/authStore'

vi.mock('../api/client', () => ({ default: { post: vi.fn() } }))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/work-logs" element={<div>업무일지 목록</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function fillForm() {
  fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'hong@test.com' } })
  fireEvent.change(screen.getByLabelText('패스워드'), { target: { value: 'password123' } })
}

function getSubmitButton() {
  return screen.getByRole('button', { name: /로그인/ })
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    useAuthStore.getState().clearAuth()
  })

  it('정상 로그인 시 authStore에 토큰이 반영되고 /work-logs로 이동한다', async () => {
    client.post.mockResolvedValueOnce({
      data: { accessToken: 'a', refreshToken: 'r', tokenType: 'Bearer' },
    })

    renderPage()
    fillForm()
    fireEvent.click(getSubmitButton())

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith('/auth/login', {
        email: 'hong@test.com',
        password: 'password123',
      })
    })

    await screen.findByText('업무일지 목록')
    expect(useAuthStore.getState().accessToken).toBe('a')
    expect(useAuthStore.getState().refreshToken).toBe('r')
  })

  it('401 에러 발생 시 alert 영역에 에러 메시지가 노출된다', async () => {
    client.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: { code: 'UNAUTHORIZED', message: '이메일 또는 패스워드가 일치하지 않습니다.' },
      },
    })

    renderPage()
    fillForm()
    fireEvent.click(getSubmitButton())

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('이메일 또는 패스워드가 일치하지 않습니다.')
  })
})
