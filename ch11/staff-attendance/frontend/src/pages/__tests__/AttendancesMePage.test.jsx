import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mswServer.js'
import { renderWithProviders } from '../../test/renderWithProviders.jsx'
import AttendancesMePage from '../AttendancesMePage.jsx'

const BASE = 'http://localhost:3000/api/v1'

function currentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function renderPage() {
  return renderWithProviders(<AttendancesMePage />, { withRouter: true })
}

describe('AttendancesMePage', () => {
  it('체크아웃 기록이 없으면 미완료 배지를 표시한다', async () => {
    server.use(
      http.get(`${BASE}/attendances/me`, () =>
        HttpResponse.json([
          { id: 'a1', userId: 'u1', workDate: '2026-09-01', checkInAt: '2026-09-01T08:47:00.000Z', checkOutAt: null },
        ]),
      ),
    )

    renderPage()

    expect(await screen.findByText('미완료')).toBeInTheDocument()
  })

  it('기록이 없는 월은 빈 상태 메시지를 표시한다', async () => {
    server.use(
      http.get(`${BASE}/attendances/me`, () => HttpResponse.json([])),
      http.get(`${BASE}/leave-requests/me`, () => HttpResponse.json([])),
    )

    renderPage()

    expect(await screen.findByText('조회된 근태 기록이 없습니다')).toBeInTheDocument()
  })

  it('출퇴근 기록이 없는 승인된 연차일은 출퇴근 기록 표에 연차 행으로 병합된다', async () => {
    const month = currentMonth()
    server.use(
      http.get(`${BASE}/attendances/me`, () =>
        HttpResponse.json([
          { id: 'a1', userId: 'u1', workDate: `${month}-01`, checkInAt: `${month}-01T08:47:00.000Z`, checkOutAt: `${month}-01T18:00:00.000Z` },
        ]),
      ),
      http.get(`${BASE}/leave-requests/me`, () =>
        HttpResponse.json([
          { id: 'l1', userId: 'u1', startDate: `${month}-02`, endDate: `${month}-02`, days: '1', status: 'approved' },
        ]),
      ),
    )

    renderPage()

    expect(await screen.findByText('연차')).toBeInTheDocument()
    expect(await screen.findByText(`${month}-02`)).toBeInTheDocument()
  })
})
