import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../../store/authStore.js'
import RequireRole from '../RequireRole.jsx'

const resetState = () =>
  useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, role: null })

function renderWithRoutes() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <Routes>
        <Route path="/dashboard" element={<div>대시보드</div>} />
        <Route element={<RequireRole role="ADMIN" />}>
          <Route path="/admin" element={<div>관리자 페이지</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('RequireRole', () => {
  beforeEach(resetState)

  it('role이 지정값과 다르면 "접근 권한이 없습니다" 메시지를 표시하고 자식 라우트를 렌더하지 않는다', () => {
    useAuthStore.setState({ role: 'EMPLOYEE' })
    renderWithRoutes()
    expect(screen.getByText('접근 권한이 없습니다')).toBeInTheDocument()
    expect(screen.queryByText('관리자 페이지')).not.toBeInTheDocument()
  })

  it('role이 지정값과 같으면 자식 라우트가 렌더된다', () => {
    useAuthStore.setState({ role: 'ADMIN' })
    renderWithRoutes()
    expect(screen.getByText('관리자 페이지')).toBeInTheDocument()
  })
})
