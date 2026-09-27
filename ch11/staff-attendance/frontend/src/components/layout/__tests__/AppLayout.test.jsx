import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { useAuthStore } from '../../../store/authStore.js'
import AppLayout from '../AppLayout.jsx'

const INITIAL_STATE = { accessToken: null, refreshToken: null, user: null, role: null }

afterEach(() => {
  useAuthStore.setState(INITIAL_STATE)
})

describe('AppLayout', () => {
  it('Navbar와 Outlet 자식이 함께 렌더된다', () => {
    useAuthStore.setState({ accessToken: 'at', user: { name: '김사원' }, role: 'employee' })

    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<div>child</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('근태관리 앱')).toBeInTheDocument()
    expect(screen.getByText('child')).toBeInTheDocument()
  })
})
