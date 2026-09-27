import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import Modal from '../Modal.jsx'

describe('Modal', () => {
  it('open=false면 아무것도 렌더하지 않는다', () => {
    const { container } = render(
      <Modal open={false} onClose={() => {}} title="제목">
        내용
      </Modal>
    )
    expect(container).toBeEmptyDOMElement()
  })

  it('open=true면 title과 children을 렌더한다', () => {
    render(
      <Modal open onClose={() => {}} title="제목">
        내용
      </Modal>
    )
    expect(screen.getByText('제목')).toBeInTheDocument()
    expect(screen.getByText('내용')).toBeInTheDocument()
  })

  it('오버레이 클릭 시 onClose가 호출된다', () => {
    const handleClose = vi.fn()
    const { container } = render(
      <Modal open onClose={handleClose} title="제목">
        내용
      </Modal>
    )
    fireEvent.click(container.querySelector('.modal'))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })

  it('닫기 버튼 클릭 시 onClose가 호출된다', () => {
    const handleClose = vi.fn()
    render(
      <Modal open onClose={handleClose} title="제목">
        내용
      </Modal>
    )
    fireEvent.click(screen.getByRole('button', { name: '닫기' }))
    expect(handleClose).toHaveBeenCalledTimes(1)
  })
})
