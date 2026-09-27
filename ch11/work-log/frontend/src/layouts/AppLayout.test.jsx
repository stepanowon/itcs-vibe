import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import AppLayout from './AppLayout'

function TestChildPage() {
  return <div>테스트 자식 페이지</div>
}

function renderAppLayout() {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AppLayout />,
        children: [{ index: true, element: <TestChildPage /> }],
      },
    ],
    { initialEntries: ['/'] }
  )
  return render(<RouterProvider router={router} />)
}

describe('AppLayout', () => {
  it('자식 라우트의 콘텐츠가 Outlet 위치에 렌더된다', () => {
    renderAppLayout()

    expect(screen.getByText('테스트 자식 페이지')).toBeInTheDocument()
  })

  it('Navigation이 함께 렌더된다', () => {
    const { container } = renderAppLayout()

    expect(container.querySelector('.app-header')).toBeTruthy()
  })
})
