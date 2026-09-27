import { describe, it, expect } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mswServer.js'
import { renderWithProviders } from '../../test/renderWithProviders.jsx'
import DashboardPage from '../DashboardPage.jsx'

const BASE = 'http://localhost:3000/api/v1'

function renderPage() {
  return renderWithProviders(<DashboardPage />, { withToast: true })
}

describe('DashboardPage', () => {
  it('체크인 전에는 퇴근 버튼이 비활성화된다', async () => {
    renderPage()

    expect(await screen.findByRole('button', { name: '출근 체크인' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '퇴근 체크아웃' })).toBeDisabled()
  })

  it('체크인 성공 시 체크인 완료로 바뀌고 퇴근 버튼이 활성화된다', async () => {
    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    let checkedIn = false
    server.use(
      http.get(`${BASE}/attendances/me`, () =>
        HttpResponse.json(
          checkedIn
            ? [{ id: 'a1', userId: 'u1', workDate: todayStr, checkInAt: `${todayStr}T08:55:00.000Z`, checkOutAt: null }]
            : [],
        ),
      ),
      http.post(`${BASE}/attendances/check-in`, () => {
        checkedIn = true
        return HttpResponse.json(
          { id: 'a1', userId: 'u1', workDate: todayStr, checkInAt: `${todayStr}T08:55:00.000Z`, checkOutAt: null },
          { status: 201 },
        )
      }),
    )
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: '출근 체크인' }))

    await waitFor(() => expect(screen.getByText(/체크인 완료/)).toBeInTheDocument())
    expect(screen.getByRole('button', { name: '퇴근 체크아웃' })).toBeEnabled()
  })

  it('이번 달 요약에 잔여 연차를 표시한다', async () => {
    renderPage()

    expect(await screen.findByText('잔여 연차: 8일')).toBeInTheDocument()
  })

  it('이미 체크인된 상태(409)에서는 에러 토스트를 표시한다', async () => {
    server.use(
      http.post(`${BASE}/attendances/check-in`, () =>
        HttpResponse.json({ code: 'ALREADY_CHECKED_IN', message: '이미 체크인하셨습니다' }, { status: 409 }),
      ),
    )
    renderPage()

    fireEvent.click(await screen.findByRole('button', { name: '출근 체크인' }))

    expect(await screen.findByRole('status')).toHaveTextContent('이미 체크인하셨습니다')
  })
})
