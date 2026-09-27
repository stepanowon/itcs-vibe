import { describe, it, expect } from 'vitest'
import { screen, within, fireEvent, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from '../../test/mswServer.js'
import { renderWithProviders } from '../../test/renderWithProviders.jsx'
import LeaveRequestsPage from '../LeaveRequestsPage.jsx'

const BASE = 'http://localhost:3000/api/v1'

function renderPage() {
  return renderWithProviders(<LeaveRequestsPage />, { withRouter: true, withToast: true })
}

function getInputByLabel(text) {
  const form = screen.getByRole('button', { name: '신청' }).closest('form')
  return within(form).getByText(text).parentElement.querySelector('input, textarea')
}

function getSelectByLabel(text) {
  const form = screen.getByRole('button', { name: '신청' }).closest('form')
  return within(form).getByText(text).parentElement.querySelector('select')
}

describe('LeaveRequestsPage', () => {
  it('시작일이 종료일보다 늦으면 경고를 표시한다', () => {
    renderPage()

    fireEvent.change(getInputByLabel('시작일'), { target: { value: '2026-09-10' } })
    fireEvent.change(getInputByLabel('종료일'), { target: { value: '2026-09-05' } })

    expect(screen.getByRole('alert')).toHaveTextContent('시작일은 종료일보다 늦을 수 없습니다')
  })

  it('잔여 연차 초과로 400 응답을 받으면 에러 메시지를 표시한다', async () => {
    renderPage()

    fireEvent.change(getInputByLabel('시작일'), { target: { value: '2026-09-07' } })
    fireEvent.change(getInputByLabel('종료일'), { target: { value: '2026-09-08' } })
    fireEvent.change(getInputByLabel('사유'), { target: { value: 'INSUFFICIENT test' } })
    fireEvent.click(screen.getByRole('button', { name: '신청' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('잔여 연차일수가 부족합니다')
  })

  it('정상 제출 시 목록에 대기중 항목이 반영된다', async () => {
    server.use(
      http.get(`${BASE}/leave-requests/me`, () =>
        HttpResponse.json([
          {
            id: 'lr1',
            requesterId: 'u1',
            requesterName: '테스트',
            startDate: '2026-09-07',
            endDate: '2026-09-08',
            days: 2,
            reason: '가족 여행',
            status: 'pending',
            processorId: null,
            processorName: null,
          },
        ]),
      ),
    )

    renderPage()

    fireEvent.change(getInputByLabel('시작일'), { target: { value: '2026-09-07' } })
    fireEvent.change(getInputByLabel('종료일'), { target: { value: '2026-09-08' } })
    fireEvent.change(getInputByLabel('사유'), { target: { value: '가족 여행' } })
    fireEvent.click(screen.getByRole('button', { name: '신청' }))

    await waitFor(() => expect(screen.getByText('대기중')).toBeInTheDocument())
  })

  it('구분을 오전으로 선택하면 종료일이 시작일과 같아지고 비활성화되며, 신청 일수는 0.5일이 된다', () => {
    renderPage()

    fireEvent.change(getInputByLabel('시작일'), { target: { value: '2026-09-07' } })
    fireEvent.change(getSelectByLabel('구분'), { target: { value: 'am' } })

    expect(getInputByLabel('종료일')).toBeDisabled()
    expect(getInputByLabel('종료일')).toHaveValue('2026-09-07')
    expect(screen.getByText('신청 일수: 0.5일')).toBeInTheDocument()
  })

  it('반차 신청 목록 항목은 구분 컬럼에 오전 반차/오후 반차로 표시된다', async () => {
    server.use(
      http.get(`${BASE}/leave-requests/me`, () =>
        HttpResponse.json([
          {
            id: 'lr-half-1',
            requesterId: 'u1',
            requesterName: '테스트',
            startDate: '2026-09-07',
            endDate: '2026-09-07',
            days: 0.5,
            halfDay: 'am',
            reason: '병원',
            status: 'pending',
            processorId: null,
            processorName: null,
          },
        ]),
      ),
    )

    renderPage()

    expect(await screen.findByText('오전 반차')).toBeInTheDocument()
  })
})
