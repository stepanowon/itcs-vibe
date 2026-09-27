import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../../../store/authStore.js'
import Navbar from '../Navbar.jsx'

const INITIAL_STATE = { accessToken: null, refreshToken: null, user: null, role: null }

afterEach(() => {
  useAuthStore.setState(INITIAL_STATE)
})

function renderNavbar() {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  )
}

describe('Navbar', () => {
  it('employee 역할이면 employee 메뉴만 노출된다', () => {
    useAuthStore.setState({ accessToken: 'at', user: { name: '김사원' }, role: 'employee' })
    renderNavbar()

    expect(screen.getByText('대시보드')).toBeInTheDocument()
    expect(screen.getByText('연차 신청')).toBeInTheDocument()
    expect(screen.getByText('내 근태 현황')).toBeInTheDocument()
    expect(screen.getByText('내 정보')).toBeInTheDocument()

    expect(screen.queryByText('연차 승인 관리')).not.toBeInTheDocument()
    expect(screen.queryByText('전체 근태 현황')).not.toBeInTheDocument()
    expect(screen.queryByText('사용자 관리')).not.toBeInTheDocument()
  })

  it('manager 역할이면 6개 메뉴가 모두 노출된다', () => {
    useAuthStore.setState({ accessToken: 'at', user: { name: '박팀장' }, role: 'manager' })
    renderNavbar()

    expect(screen.getByText('대시보드')).toBeInTheDocument()
    expect(screen.getByText('연차 신청')).toBeInTheDocument()
    expect(screen.getByText('연차 승인 관리')).toBeInTheDocument()
    expect(screen.getByText('전체 근태 현황')).toBeInTheDocument()
    expect(screen.getByText('사용자 관리')).toBeInTheDocument()
    expect(screen.getByText('내 정보')).toBeInTheDocument()
  })

  it('로그아웃 버튼 클릭 시 인증 상태가 초기화된다', async () => {
    useAuthStore.setState({ accessToken: 'at', user: { name: '김사원' }, role: 'employee' })
    renderNavbar()

    const logoutButtons = screen.getAllByRole('button', { name: '로그아웃' })
    fireEvent.click(logoutButtons[0])

    expect(useAuthStore.getState().accessToken).toBeNull()
    expect(useAuthStore.getState().user).toBeNull()
    expect(useAuthStore.getState().role).toBeNull()
  })

  it('햄버거 버튼 클릭 시 드로어가 열린다', async () => {
    useAuthStore.setState({ accessToken: 'at', user: { name: '김사원' }, role: 'employee' })
    renderNavbar()

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '메뉴 닫기' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
