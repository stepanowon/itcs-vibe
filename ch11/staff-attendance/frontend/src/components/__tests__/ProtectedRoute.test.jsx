import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../../store/authStore.js'
import ProtectedRoute from '../ProtectedRoute.jsx'

const resetState = () =>
  useAuthStore.setState({ accessToken: null, refreshToken: null, user: null, role: null })

function renderWithRoutes() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<div>로그인 페이지</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>대시보드</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  beforeEach(resetState)

  it('accessToken이 없으면 /login으로 리다이렉트된다', () => {
    renderWithRoutes()
    expect(screen.getByText('로그인 페이지')).toBeInTheDocument()
  })

  it('accessToken이 있으면 자식 라우트가 렌더된다', () => {
    useAuthStore.setState({ accessToken: 'at' })
    renderWithRoutes()
    expect(screen.getByText('대시보드')).toBeInTheDocument()
  })
})
