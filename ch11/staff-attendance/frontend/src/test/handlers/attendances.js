import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:3000/api/v1'

export const attendancesHandlers = [
  http.get(`${BASE}/attendances/me`, () => HttpResponse.json([])),
  http.get(`${BASE}/attendances`, ({ request }) => {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const all = [
      { id: 'att-1', userId: 'u1', workDate: '2026-08-01', checkInAt: '2026-08-01T08:52:00.000Z', checkOutAt: '2026-08-01T18:01:00.000Z' },
      { id: 'att-2', userId: 'u2', workDate: '2026-08-01', checkInAt: '2026-08-01T08:47:00.000Z', checkOutAt: null },
    ]
    const filtered = userId ? all.filter((item) => item.userId === userId) : all
    return HttpResponse.json(filtered)
  }),
  http.post(`${BASE}/attendances/check-in`, () =>
    HttpResponse.json(
      { id: 'a1', userId: 'u1', workDate: '2026-01-01', checkInAt: '2026-01-01T08:55:00.000Z', checkOutAt: null },
      { status: 201 },
    ),
  ),
  http.post(`${BASE}/attendances/check-out`, () =>
    HttpResponse.json(
      {
        id: 'a1',
        userId: 'u1',
        workDate: '2026-01-01',
        checkInAt: '2026-01-01T08:55:00.000Z',
        checkOutAt: '2026-01-01T18:00:00.000Z',
      },
      { status: 200 },
    ),
  ),
]
