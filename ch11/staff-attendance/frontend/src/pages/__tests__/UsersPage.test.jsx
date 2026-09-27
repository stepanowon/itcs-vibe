import { describe, it, expect } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import { renderWithProviders } from '../../test/renderWithProviders.jsx'
import UsersPage from '../UsersPage.jsx'

function renderPage() {
  return renderWithProviders(<UsersPage />, { withToast: true })
}

function getInputByLabel(text) {
  const dialog = screen.getByRole('heading', { name: '관리자 계정 생성' }).closest('.modal')
  return within(dialog).getByText(text).parentElement.querySelector('input')
}

function fillForm(overrides = {}) {
  const values = {
    email: 'manager2@example.com',
    name: '이팀장',
    employeeNo: 'MGR-002',
    hireDate: '2026-09-01',
    password: 'password1!',
    ...overrides,
  }

  fireEvent.change(getInputByLabel('이메일'), { target: { value: values.email } })
  fireEvent.change(getInputByLabel('이름'), { target: { value: values.name } })
  fireEvent.change(getInputByLabel('사번'), { target: { value: values.employeeNo } })
  fireEvent.change(getInputByLabel('입사일'), { target: { value: values.hireDate } })
  fireEvent.change(getInputByLabel('초기 비밀번호'), { target: { value: values.password } })
}

describe('UsersPage', () => {
  it('사용자 목록이 테이블로 렌더된다', async () => {
    renderPage()

    expect(await screen.findByText('박팀장')).toBeInTheDocument()
    expect(screen.getByText('김사원')).toBeInTheDocument()
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  it('관리자 계정 생성 버튼 클릭 시 모달이 열린다', async () => {
    renderPage()
    await screen.findByText('박팀장')

    fireEvent.click(screen.getByRole('button', { name: '관리자 계정 생성' }))

    expect(screen.getByRole('heading', { name: '관리자 계정 생성' })).toBeInTheDocument()
  })

  it('중복된 사번으로 제출하면 에러가 표시된다', async () => {
    renderPage()
    await screen.findByText('박팀장')

    fireEvent.click(screen.getByRole('button', { name: '관리자 계정 생성' }))
    fillForm({ employeeNo: 'DUP-001' })
    fireEvent.click(screen.getByRole('button', { name: '생성' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('이미 등록된 사번입니다')
  })

  it('공통 연차일수를 저장하면 성공 토스트가 표시된다', async () => {
    renderPage()
    await screen.findByText('박팀장')

    const input = await screen.findByDisplayValue('5')
    fireEvent.change(input, { target: { value: '10' } })
    fireEvent.click(screen.getByRole('button', { name: '저장' }))

    expect(await screen.findByRole('status')).toHaveTextContent('공통 연차일수가 변경되었습니다')
  })

  it('정상 제출 시 성공 토스트가 표시되고 모달이 닫힌다', async () => {
    renderPage()
    await screen.findByText('박팀장')

    fireEvent.click(screen.getByRole('button', { name: '관리자 계정 생성' }))
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: '생성' }))

    expect(await screen.findByRole('status')).toHaveTextContent('관리자 계정이 생성되었습니다')
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: '관리자 계정 생성' })).not.toBeInTheDocument(),
    )
  })
})
