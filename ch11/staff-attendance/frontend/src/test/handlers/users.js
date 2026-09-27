import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:3000/api/v1'

export const usersHandlers = [
  http.get(`${BASE}/users/me`, () =>
    HttpResponse.json({
      id: 'u1',
      email: 'test@test.com',
      name: '테스트',
      employeeNo: 'E1',
      hireDate: '2026-01-01',
      role: 'employee',
      status: 'active',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    }),
  ),
  http.get(`${BASE}/users`, () =>
    HttpResponse.json([
      {
        id: 'u1',
        email: 'manager@test.com',
        name: '박팀장',
        employeeNo: 'MGR2026-001',
        hireDate: '2025-03-01',
        role: 'manager',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      {
        id: 'u2',
        email: 'employee@test.com',
        name: '김사원',
        employeeNo: 'EMP2026-015',
        hireDate: '2026-08-19',
        role: 'employee',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
    ]),
  ),
  http.post(`${BASE}/users`, async ({ request }) => {
    const body = await request.json()
    if (body.employeeNo === 'DUP-001') {
      return HttpResponse.json({ code: 'DUPLICATE_EMPLOYEE_NO', message: '이미 등록된 사번입니다' }, { status: 409 })
    }
    return HttpResponse.json(
      {
        id: 'u3',
        email: body.email,
        name: body.name,
        employeeNo: body.employeeNo,
        hireDate: body.hireDate,
        role: 'manager',
        status: 'active',
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
      },
      { status: 201 },
    )
  }),
]
