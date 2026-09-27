import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:3000/api/v1'

export const leaveRequestsHandlers = [
  http.post(`${BASE}/leave-requests`, async ({ request }) => {
    const body = await request.json()
    if (body.reason?.includes('INSUFFICIENT')) {
      return HttpResponse.json(
        { code: 'INSUFFICIENT_LEAVE_BALANCE', message: '잔여 연차일수가 부족합니다' },
        { status: 400 },
      )
    }
    return HttpResponse.json(
      {
        id: 'lr1',
        requesterId: 'u1',
        requesterName: '테스트',
        startDate: body.startDate,
        endDate: body.endDate,
        days: body.halfDay ? 0.5 : 1,
        halfDay: body.halfDay ?? null,
        reason: body.reason,
        status: 'pending',
        processorId: null,
        processorName: null,
      },
      { status: 201 },
    )
  }),
  http.get(`${BASE}/leave-requests/me`, () => HttpResponse.json([])),
  http.get(`${BASE}/leave-requests`, ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const all = [
      {
        id: 'lr-pending-1',
        requesterId: 'u2',
        requesterName: '김사원',
        startDate: '2026-09-07',
        endDate: '2026-09-08',
        days: 2,
        reason: '가족 여행',
        status: 'pending',
        processorId: null,
        processorName: null,
      },
      {
        id: 'lr-approved-1',
        requesterId: 'u3',
        requesterName: '이대리',
        startDate: '2026-08-20',
        endDate: '2026-08-21',
        days: 2,
        reason: '여름 휴가',
        status: 'approved',
        processorId: 'u1',
        processorName: '박팀장',
      },
    ]
    const filtered = status ? all.filter((item) => item.status === status) : all
    return HttpResponse.json(filtered)
  }),
  http.patch(`${BASE}/leave-requests/:id/approve`, ({ params }) => {
    if (params.id === 'self-1') {
      return HttpResponse.json(
        { code: 'SELF_APPROVAL_NOT_ALLOWED', message: '본인이 신청한 연차는 본인이 처리할 수 없습니다' },
        { status: 403 },
      )
    }
    if (params.id === 'processed-1') {
      return HttpResponse.json({ code: 'LEAVE_REQUEST_ALREADY_PROCESSED', message: '이미 처리된 신청입니다' }, { status: 409 })
    }
    return HttpResponse.json({ id: params.id, status: 'approved', processorId: 'u1', processorName: '박팀장' })
  }),
  http.patch(`${BASE}/leave-requests/:id/reject`, ({ params }) => {
    if (params.id === 'self-1') {
      return HttpResponse.json(
        { code: 'SELF_APPROVAL_NOT_ALLOWED', message: '본인이 신청한 연차는 본인이 처리할 수 없습니다' },
        { status: 403 },
      )
    }
    if (params.id === 'processed-1') {
      return HttpResponse.json({ code: 'LEAVE_REQUEST_ALREADY_PROCESSED', message: '이미 처리된 신청입니다' }, { status: 409 })
    }
    return HttpResponse.json({ id: params.id, status: 'rejected', processorId: 'u1', processorName: '박팀장' })
  }),
]
