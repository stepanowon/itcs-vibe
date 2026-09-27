import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Button from '../Button.jsx'

describe('Button', () => {
  it('onClick이 정상 호출된다', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>확인</Button>)
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('disabled면 클릭이 무시된다', () => {
    const handleClick = vi.fn()
    render(
      <Button disabled onClick={handleClick}>
        확인
      </Button>
    )
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('loading이면 클릭이 무시된다', () => {
    const handleClick = vi.fn()
    render(
      <Button loading onClick={handleClick}>
        확인
      </Button>
    )
    fireEvent.click(screen.getByRole('button', { name: '확인' }))
    expect(handleClick).not.toHaveBeenCalled()
  })

  it('variant별 Bootstrap className이 포함된다', () => {
    const { rerender } = render(<Button variant="primary">버튼</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn', 'btn-success')

    rerender(<Button variant="secondary">버튼</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-outline-secondary')

    rerender(<Button variant="danger">버튼</Button>)
    expect(screen.getByRole('button')).toHaveClass('btn-danger')
  })
})
