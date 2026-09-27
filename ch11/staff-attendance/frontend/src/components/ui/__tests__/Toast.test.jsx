import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import { ToastProvider, useToast } from '../Toast.jsx'

function TestButton() {
  const { showToast } = useToast()
  return <button onClick={() => showToast('저장되었습니다', 'success')}>show</button>
}

describe('Toast', () => {
  it('showToast로 추가한 메시지가 화면에 렌더된다', () => {
    render(
      <ToastProvider>
        <TestButton />
      </ToastProvider>
    )
    fireEvent.click(screen.getByRole('button', { name: 'show' }))
    expect(screen.getByText('저장되었습니다')).toBeInTheDocument()
  })

  it('ToastProvider 밖에서 useToast 호출 시 에러를 던진다', () => {
    const BadComponent = () => {
      useToast()
      return null
    }
    expect(() => render(<BadComponent />)).toThrow('useToast must be used within ToastProvider')
  })
})
