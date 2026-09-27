import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders.jsx'
import LoginPage from '../LoginPage.jsx'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function renderPage() {
  return renderWithProviders(<LoginPage />, { withRouter: true })
}

function getInputByLabel(text) {
  return screen.getByText(text).parentElement.querySelector('input')
}

function fillForm({ email = 'test@example.com', password = 'password1!' } = {}) {
  fireEvent.change(getInputByLabel('이메일'), { target: { value: email } })
  fireEvent.change(getInputByLabel('비밀번호'), { target: { value: password } })
}

describe('LoginPage', () => {
  it('인증 실패(401) 시 공통 에러 메시지를 표시한다', async () => {
    renderPage()

    fillForm({ password: 'wrongpw' })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('이메일 또는 비밀번호가 올바르지 않습니다')
  })

  it('비활성 계정(403) 시 안내 메시지를 표시한다', async () => {
    renderPage()

    fillForm({ email: 'inactive@test.com' })
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('비활성화된 계정입니다')
  })

  it('정상 로그인 시 /dashboard로 이동한다', async () => {
    renderPage()

    fillForm()
    fireEvent.click(screen.getByRole('button', { name: '로그인' }))

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true }))
  })
})
