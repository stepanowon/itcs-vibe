import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import MyPage from './MyPage'
import client from '../api/client'
import { useAuthStore } from '../store/authStore'

vi.mock('../api/client', () => ({ default: { get: vi.fn(), patch: vi.fn(), post: vi.fn() } }))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/mypage']}>
        <Routes>
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/login" element={<div>로그인 스텁</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

const sampleProfile = {
  id: '1',
  userCode: 'uc1',
  email: 'test@example.com',
  name: '홍길동',
  department: '개발팀',
  workLogCount: 5,
  createdAt: '2026-01-01T00:00:00Z',
}

describe('MyPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ accessToken: 'token-a', refreshToken: 'refresh-a', isAuthenticated: true })
    vi.clearAllMocks()
  })

  it('내 정보와 작성한 업무일지 갯수가 화면에 노출된다', async () => {
    client.get.mockResolvedValueOnce({ data: sampleProfile })

    renderPage()

    expect(await screen.findByText('홍길동')).toBeInTheDocument()
    expect(await screen.findByText('개발팀')).toBeInTheDocument()
    expect(await screen.findByText('test@example.com')).toBeInTheDocument()
    expect(await screen.findByText(/5건/)).toBeInTheDocument()
  })

  it('조회 에러 발생 시 alert 영역에 메시지가 노출된다', async () => {
    client.get.mockRejectedValueOnce({ response: { data: { message: '조회 실패' } } })

    renderPage()

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('조회 실패')
  })

  it('패스워드 변경 성공 시 client.patch가 호출되고 폼이 초기화된다', async () => {
    client.get.mockResolvedValueOnce({ data: sampleProfile })
    client.patch.mockResolvedValueOnce({})

    renderPage()

    await screen.findByText('홍길동')

    const currentPasswordInput = document.querySelector('input[name="currentPassword"]')
    const newPasswordInput = document.querySelector('input[name="newPassword"]')

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } })
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } })

    fireEvent.click(screen.getByRole('button', { name: /변경/ }))

    await waitFor(() => {
      expect(client.patch).toHaveBeenCalledWith('/users/me/password', {
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
      })
    })

    await waitFor(() => {
      expect(currentPasswordInput.value).toBe('')
      expect(newPasswordInput.value).toBe('')
    })
  })

  it('패스워드 변경 실패(400) 시 alert 영역에 메시지가 노출된다', async () => {
    client.get.mockResolvedValueOnce({ data: sampleProfile })
    client.patch.mockRejectedValueOnce({
      response: { status: 400, data: { message: '기존 패스워드가 일치하지 않습니다.' } },
    })

    renderPage()

    await screen.findByText('홍길동')

    const currentPasswordInput = document.querySelector('input[name="currentPassword"]')
    const newPasswordInput = document.querySelector('input[name="newPassword"]')

    fireEvent.change(currentPasswordInput, { target: { value: 'oldpass123' } })
    fireEvent.change(newPasswordInput, { target: { value: 'newpass123' } })

    fireEvent.click(screen.getByRole('button', { name: /변경/ }))

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('기존 패스워드가 일치하지 않습니다.')
  })

  it('로그아웃 성공 시 client.post 호출 후 로그인 화면으로 이동하고 인증 상태가 해제된다', async () => {
    client.get.mockResolvedValueOnce({ data: sampleProfile })
    client.post.mockResolvedValueOnce({})

    renderPage()

    await screen.findByText('홍길동')

    fireEvent.click(screen.getByText('로그아웃'))

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh-a' })
    })

    await screen.findByText('로그인 스텁')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })

  it('로그아웃 API 실패 시에도 클라이언트 상태는 정리되고 로그인 화면으로 이동한다', async () => {
    client.get.mockResolvedValueOnce({ data: sampleProfile })
    client.post.mockRejectedValueOnce(new Error('network'))

    renderPage()

    await screen.findByText('홍길동')

    fireEvent.click(screen.getByText('로그아웃'))

    await screen.findByText('로그인 스텁')
    expect(useAuthStore.getState().isAuthenticated).toBe(false)
  })
})
