import { describe, it, expect } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mswServer.js'
import { renderWithProviders } from '../../test/renderWithProviders.jsx'
import MePage from '../MePage.jsx'

const BASE = 'http://localhost:3000/api/v1'

function renderPage() {
  return renderWithProviders(<MePage />, { withToast: true })
}

function getInputByLabel(text) {
  return screen.getByText(text).parentElement.querySelector('input')
}

function fillPasswordForm({ current = 'old-pw', next = 'new-pw1!', confirm = 'new-pw1!' } = {}) {
  fireEvent.change(getInputByLabel('현재 비밀번호'), { target: { value: current } })
  fireEvent.change(getInputByLabel('새 비밀번호'), { target: { value: next } })
  fireEvent.change(getInputByLabel('새 비밀번호 확인'), { target: { value: confirm } })
}

describe('MePage', () => {
  it('본인 정보를 렌더링한다', async () => {
    renderPage()

    expect(await screen.findByText(/테스트/)).toBeInTheDocument()
    expect(screen.getByText(/test@test\.com/)).toBeInTheDocument()
    expect(screen.getByText(/E1/)).toBeInTheDocument()
    expect(screen.getByText(/2026-01-01/)).toBeInTheDocument()
    expect(screen.getByText(/employee/)).toBeInTheDocument()
  })

  it('새 비밀번호와 확인이 다르면 제출을 막고 에러를 표시한다', async () => {
    renderPage()

    fillPasswordForm({ confirm: 'different' })
    fireEvent.click(screen.getByRole('button', { name: '변경' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('새 비밀번호가 일치하지 않습니다')
  })

  it('현재 비밀번호가 틀리면(400) 에러를 표시한다', async () => {
    server.use(
      http.patch(`${BASE}/users/me/password`, () =>
        HttpResponse.json(
          { code: 'INVALID_CURRENT_PASSWORD', message: '현재 비밀번호가 일치하지 않습니다' },
          { status: 400 },
        ),
      ),
    )
    renderPage()

    fillPasswordForm()
    fireEvent.click(screen.getByRole('button', { name: '변경' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('현재 비밀번호가 일치하지 않습니다')
  })

  it('정상 변경 시 완료 토스트를 표시한다', async () => {
    renderPage()

    fillPasswordForm()
    fireEvent.click(screen.getByRole('button', { name: '변경' }))

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('비밀번호가 변경되었습니다'))
  })
})
