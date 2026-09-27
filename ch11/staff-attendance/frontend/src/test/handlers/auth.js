import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:3000/api/v1'

export const authHandlers = [
  http.post(`${BASE}/auth/signup`, async ({ request }) => {
    const body = await request.json()
    if (body.employeeNo === 'DUP-001') {
      return HttpResponse.json({ code: 'DUPLICATE_EMPLOYEE_NO', message: '이미 등록된 사번입니다' }, { status: 409 })
    }
    return HttpResponse.json({ id: 'u1', email: body.email, name: body.name, employeeNo: body.employeeNo, hireDate: body.hireDate, role: 'employee', status: 'active', createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z' }, { status: 201 })
  }),
  http.post(`${BASE}/auth/login`, async ({ request }) => {
    const body = await request.json()
    if (body.password === 'wrongpw') {
      return HttpResponse.json({ code: 'INVALID_CREDENTIALS', message: '이메일 또는 비밀번호가 올바르지 않습니다' }, { status: 401 })
    }
    if (body.email === 'inactive@test.com') {
      return HttpResponse.json({ code: 'INACTIVE_ACCOUNT', message: '비활성화된 계정입니다' }, { status: 403 })
    }
    return HttpResponse.json({ accessToken: 'access-token', refreshToken: 'refresh-token', tokenType: 'Bearer', expiresIn: 43200 })
  }),
  http.post(`${BASE}/auth/refresh`, () => HttpResponse.json({ accessToken: 'new-access-token', refreshToken: 'new-refresh-token', tokenType: 'Bearer', expiresIn: 43200 })),
]
