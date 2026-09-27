import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Input from '../Input.jsx'

describe('Input', () => {
  it('label을 렌더한다', () => {
    render(<Input label="이름" value="" onChange={() => {}} />)
    expect(screen.getByText('이름')).toBeInTheDocument()
  })

  it('error가 있으면 경고 메시지를 렌더한다', () => {
    render(<Input error="필수 항목입니다" value="" onChange={() => {}} />)
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('⚠ 필수 항목입니다')
  })

  it('onChange가 정상 호출된다', () => {
    const handleChange = vi.fn()
    render(<Input value="" onChange={handleChange} />)
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'abc' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
  })
})
