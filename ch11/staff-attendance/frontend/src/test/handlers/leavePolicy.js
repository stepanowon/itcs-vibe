import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:3000/api/v1'

export const leavePolicyHandlers = [
  http.get(`${BASE}/leave-policy`, () =>
    HttpResponse.json({ id: 1, baseDays: 5, updatedAt: '2026-01-01T00:00:00Z' }),
  ),
  http.patch(`${BASE}/leave-policy`, async ({ request }) => {
    const { baseDays } = await request.json()
    return HttpResponse.json({ id: 1, baseDays, updatedAt: '2026-01-01T00:00:00Z' })
  }),
]
