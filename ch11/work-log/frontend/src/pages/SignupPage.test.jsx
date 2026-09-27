import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import SignupPage from './SignupPage'
import client from '../api/client'

vi.mock('../api/client', () => ({ default: { post: vi.fn() } }))

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/signup']}>
        <Routes>
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/login" element={<div>로그인 화면</div>} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function getField(container, name) {
  try {
    const el = screen.getByLabelText(new RegExp(name))
    if (el) return el
  } catch {
    // fallback below
  }
  return container.querySelector(`input[name="${name}"]`)
}

function fillForm(container) {
  fireEvent.change(getField(container, 'name'), { target: { value: '홍길동' } })
  fireEvent.change(getField(container, 'department'), { target: { value: '개발팀' } })
  fireEvent.change(getField(container, 'email'), { target: { value: 'hong@test.com' } })
  fireEvent.change(getField(container, 'password'), { target: { value: 'password123' } })
}

function getSubmitButton() {
  return screen.getByRole('button', { name: /가입/ })
}

describe('SignupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('정상 가입 시 client.post가 올바른 payload로 호출되고 /login으로 이동한다', async () => {
    client.post.mockResolvedValueOnce({
      data: {
        id: '1',
        userCode: 'uc',
        email: 'a@a.com',
        name: 'n',
        department: 'd',
        workLogCount: 0,
        createdAt: '2026-01-01',
      },
    })

    const { container } = renderPage()
    fillForm(container)
    fireEvent.click(getSubmitButton())

    await waitFor(() => {
      expect(client.post).toHaveBeenCalledWith('/auth/signup', {
        name: '홍길동',
        department: '개발팀',
        email: 'hong@test.com',
        password: 'password123',
      })
    })

    await screen.findByText('로그인 화면')
  })

  it('400 에러 발생 시 alert 영역에 에러 메시지가 노출된다', async () => {
    client.post.mockRejectedValueOnce({
      response: {
        status: 400,
        data: { code: 'VALIDATION_ERROR', message: '필수 항목이 누락되었습니다.' },
      },
    })

    const { container } = renderPage()
    fillForm(container)
    fireEvent.click(getSubmitButton())

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('필수 항목이 누락되었습니다.')
  })

  it('409 에러 발생 시 alert 영역에 에러 메시지가 노출된다', async () => {
    client.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: { code: 'CONFLICT', message: '이미 사용 중인 이메일입니다.' },
      },
    })

    const { container } = renderPage()
    fillForm(container)
    fireEvent.click(getSubmitButton())

    const alert = await screen.findByRole('alert')
    expect(alert.textContent).toContain('이미 사용 중인 이메일입니다.')
  })
})
