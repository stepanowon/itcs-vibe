import { describe, it, expect, vi } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders.jsx'
import SignupPage from '../SignupPage.jsx'

const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return { ...actual, useNavigate: () => navigateMock }
})

function renderPage() {
  return renderWithProviders(<SignupPage />, { withRouter: true, withToast: true })
}

function getInputByLabel(text) {
  return screen.getByText(text).parentElement.querySelector('input')
}

function fillForm(overrides = {}) {
  const values = {
    email: 'test@example.com',
    name: '홍길동',
    employeeNo: 'EMP-001',
    hireDate: '2026-01-01',
    password: 'password1!',
    passwordConfirm: 'password1!',
    ...overrides,
  }

  fireEvent.change(getInputByLabel('이메일'), { target: { value: values.email } })
  fireEvent.change(getInputByLabel('이름'), { target: { value: values.name } })
  fireEvent.change(getInputByLabel('사번'), { target: { value: values.employeeNo } })
  fireEvent.change(getInputByLabel('입사일'), { target: { value: values.hireDate } })
  fireEvent.change(getInputByLabel('비밀번호'), { target: { value: values.password } })
  fireEvent.change(getInputByLabel('비밀번호 확인'), { target: { value: values.passwordConfirm } })
}

describe('SignupPage', () => {
  it('필드 미입력 상태에서 가입하기 버튼은 disabled', () => {
    renderPage()
    expect(screen.getByRole('button', { name: '가입하기' })).toBeDisabled()
  })

  it('비밀번호와 비밀번호 확인이 다르면 가입하기 버튼은 disabled', () => {
    renderPage()

    fillForm({ passwordConfirm: 'other-password' })

    expect(screen.getByRole('button', { name: '가입하기' })).toBeDisabled()
  })

  it('중복된 사번으로 제출하면 사번 필드에 에러가 표시된다', async () => {
    renderPage()

    fillForm({ employeeNo: 'DUP-001' })
    fireEvent.click(screen.getByRole('button', { name: '가입하기' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 등록된 사번입니다')
  })

  it('정상 값으로 제출하면 성공 후 /login으로 이동한다', async () => {
    renderPage()

    fillForm()
    fireEvent.click(screen.getByRole('button', { name: '가입하기' }))

    await waitFor(() => expect(navigateMock).toHaveBeenCalledWith('/login'))
  })
})
