import { describe, it, expect } from 'vitest'
import { render, screen, within, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navigation from './Navigation'

function renderNavigation() {
  return render(
    <MemoryRouter>
      <Navigation />
    </MemoryRouter>
  )
}

describe('Navigation', () => {
  it('.nav-links 안에 목록/내정보 링크가 있다', () => {
    const { container } = renderNavigation()
    const desktopNav = container.querySelector('.nav-links')

    const links = within(desktopNav).getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs).toContain('/work-logs')
    expect(hrefs).toContain('/mypage')
  })

  it('햄버거 버튼을 누르면 모바일 메뉴가 열리고 목록/내정보 링크가 노출된다', () => {
    const { container } = renderNavigation()

    expect(container.querySelector('.nav-mobile-menu')).toBeFalsy()

    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))

    const mobileMenu = container.querySelector('.nav-mobile-menu')
    expect(mobileMenu).toBeTruthy()

    const links = within(mobileMenu).getAllByRole('link')
    const hrefs = links.map((link) => link.getAttribute('href'))

    expect(hrefs).toContain('/work-logs')
    expect(hrefs).toContain('/mypage')
  })

  it('모바일 메뉴에서 링크 클릭 시 메뉴가 닫힌다', () => {
    const { container } = renderNavigation()

    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))
    const mobileMenu = container.querySelector('.nav-mobile-menu')
    fireEvent.click(within(mobileMenu).getByText('내정보'))

    expect(container.querySelector('.nav-mobile-menu')).toBeFalsy()
  })

  it('업무일지 작성 버튼은 항상 노출되며 햄버거 메뉴 안에는 포함되지 않는다', () => {
    const { container } = renderNavigation()

    const writeLink = screen.getByRole('link', { name: '업무일지 작성' })
    expect(writeLink.getAttribute('href')).toBe('/work-logs/new')
    expect(container.querySelector('.nav-mobile-menu')).toBeFalsy()

    fireEvent.click(screen.getByRole('button', { name: '메뉴 열기' }))

    const mobileMenu = container.querySelector('.nav-mobile-menu')
    expect(within(mobileMenu).queryByText('업무일지 작성')).toBeFalsy()
    expect(screen.getByRole('link', { name: '업무일지 작성' })).toBeInTheDocument()
  })
})
