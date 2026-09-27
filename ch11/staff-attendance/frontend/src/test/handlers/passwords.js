import { http, HttpResponse } from 'msw'

const BASE = 'http://localhost:3000/api/v1'

export const passwordsHandlers = [
  http.patch(`${BASE}/users/me/password`, () =>
    HttpResponse.json({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      tokenType: 'Bearer',
      expiresIn: 43200,
    }),
  ),
]
