import { describe, it, expect, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import LeaveRequestsManagePage from '../LeaveRequestsManagePage.jsx'
import { useAuthStore } from '../../store/authStore.js'
import { server } from '../../test/mswServer.js'
import { renderWithProviders } from '../../test/renderWithProviders.jsx'

const BASE = 'http://localhost:3000/api/v1'

function renderPage() {
  return renderWithProviders(<LeaveRequestsManagePage />, { withToast: true })
}

beforeEach(() => {
  useAuthStore.setState({ user: { id: 'manager-1', role: 'manager' } })
})

describe('LeaveRequestsManagePage', () => {
  it('기본값(대기중) 필터는 대기중 신청만 표시한다', async () => {
    server.use(
      http.get(`${BASE}/leave-requests`, ({ request }) => {
        const status = new URL(request.url).searchParams.get('status')
        const all = [
          { id: 'lr-1', requesterId: 'u2', requesterName: '김사원', startDate: '2026-09-07', endDate: '2026-09-08', days: 2, reason: '가족 여행', status: 'pending', processorId: null, processorName: null },
          { id: 'lr-2', requesterId: 'u3', requesterName: '이대리', startDate: '2026-08-20', endDate: '2026-08-21', days: 2, reason: '여름 휴가', status: 'approved', processorId: 'manager-1', processorName: '박팀장' },
        ]
        return HttpResponse.json(status ? all.filter((item) => item.status === status) : all)
      }),
    )

    renderPage()

    expect(await screen.findByText('김사원')).toBeInTheDocument()
    expect(screen.queryByText('이대리')).not.toBeInTheDocument()
  })

  it('반차 신청 건은 목록에 오후 반차로 표시된다', async () => {
    server.use(
      http.get(`${BASE}/leave-requests`, () =>
        HttpResponse.json([
          {
            id: 'lr-half-1',
            requesterId: 'u2',
            requesterName: '김사원',
            startDate: '2026-09-07',
            endDate: '2026-09-07',
            days: 0.5,
            halfDay: 'pm',
            reason: '병원',
            status: 'pending',
            processorId: null,
            processorName: null,
          },
        ]),
      ),
    )

    renderPage()

    expect(await screen.findByText(/오후 반차/)).toBeInTheDocument()
  })

  it('본인이 신청한 건은 승인/반려 버튼이 비활성화되고 안내 문구가 보인다', async () => {
    server.use(
      http.get(`${BASE}/leave-requests`, () =>
        HttpResponse.json([
          { id: 'self-1', requesterId: 'manager-1', requesterName: '박팀장', startDate: '2026-09-14', endDate: '2026-09-14', days: 1, reason: '개인 사정', status: 'pending', processorId: null, processorName: null },
        ]),
      ),
    )

    renderPage()

    await screen.findByText('박팀장')
    expect(screen.getByRole('button', { name: '승인' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '반려' })).toBeDisabled()
    expect(screen.getByText('본인이 신청한 연차는 처리할 수 없습니다')).toBeInTheDocument()
  })

  it('다른 사람 신청 건을 승인하면 확인 모달을 거쳐 목록에서 사라진다', async () => {
    let approved = false
    server.use(
      http.get(`${BASE}/leave-requests`, () => {
        const items = approved
          ? []
          : [{ id: 'other-1', requesterId: 'u2', requesterName: '김사원', startDate: '2026-09-07', endDate: '2026-09-08', days: 2, reason: '가족 여행', status: 'pending', processorId: null, processorName: null }]
        return HttpResponse.json(items)
      }),
      http.patch(`${BASE}/leave-requests/other-1/approve`, () => {
        approved = true
        return HttpResponse.json({ id: 'other-1', status: 'approved', processorId: 'manager-1', processorName: '박팀장' })
      }),
    )

    renderPage()

    await screen.findByText('김사원')
    fireEvent.click(screen.getByRole('button', { name: '승인' }))

    const modalTitle = await screen.findByText('연차 승인 확인')
    const modal = modalTitle.closest('.modal')
    fireEvent.click(within(modal).getByRole('button', { name: '승인 확정' }))

    await waitFor(() => expect(screen.queryByText('김사원')).not.toBeInTheDocument())
  })

  it('이미 처리된 신청을 승인 시도하면 에러 토스트를 표시한다', async () => {
    server.use(
      http.get(`${BASE}/leave-requests`, () =>
        HttpResponse.json([
          { id: 'processed-1', requesterId: 'u2', requesterName: '김사원', startDate: '2026-09-07', endDate: '2026-09-08', days: 2, reason: '가족 여행', status: 'pending', processorId: null, processorName: null },
        ]),
      ),
    )

    renderPage()

    await screen.findByText('김사원')
    fireEvent.click(screen.getByRole('button', { name: '승인' }))

    const modalTitle = await screen.findByText('연차 승인 확인')
    const modal = modalTitle.closest('.modal')
    fireEvent.click(within(modal).getByRole('button', { name: '승인 확정' }))

    expect(await screen.findByRole('status')).toHaveTextContent('이미 처리된 신청입니다')
  })
})
