import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import router from './index'

function renderAt(initialEntry) {
  const memoryRouter = createMemoryRouter(router.routes, {
    initialEntries: [initialEntry],
  })
  return render(<RouterProvider router={memoryRouter} />)
}

describe('router', () => {
  it('/login 경로가 크래시 없이 렌더되고 내용이 출력된다', () => {
    const { container } = renderAt('/login')
    expect(container.textContent.length).toBeGreaterThan(0)
  })

  it('/mypage 경로가 크래시 없이 렌더된다', () => {
    expect(() => renderAt('/mypage')).not.toThrow()
  })

  it('/work-logs 경로가 크래시 없이 렌더된다', () => {
    expect(() => renderAt('/work-logs')).not.toThrow()
  })
})
