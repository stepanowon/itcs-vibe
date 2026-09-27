import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:3000/api/v1'

export const leaveBalancesHandlers = [
  http.get(`${BASE}/leave-balances/me`, () =>
    HttpResponse.json({ userId: 'u1', totalDays: 10, usedDays: 2, remainingDays: 8, updatedAt: '2026-01-01T00:00:00Z' }),
  ),
  http.get(`${BASE}/leave-balances`, () =>
    HttpResponse.json([
      { userId: 'u1', employeeNo: 'MGR2026-001', name: '박팀장', totalDays: 15, usedDays: 1, remainingDays: 14 },
      { userId: 'u2', employeeNo: 'EMP2026-015', name: '김사원', totalDays: 3, usedDays: 1, remainingDays: 2 },
    ]),
  ),
]
