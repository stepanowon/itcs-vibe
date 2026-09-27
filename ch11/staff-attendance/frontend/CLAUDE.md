# frontend 디렉토리 지침

## 기술스택

- React 19(Vite, JavaScript, TypeScript 아님)
- Bootstrap 5(CSS 프레임워크, `docs/style-guide.md` 참고 — 커스텀 CSS 디자인 시스템 없이 Bootstrap 클래스를 그대로 사용)
- React Router 7(`react-router-dom`, 라우팅)
- Tanstack Query(서버 상태/API 통신), Zustand(전역 상태 - 인증 등)
- 테스트: Vitest + Testing Library

## 참조할 API 명세

- `backend/swagger.yaml` (OpenAPI) — API 클라이언트 작성 시 요청/응답 스키마, 에러 코드의 기준 문서
- 백엔드 개발 모드 기동 시 `http://localhost:3000/api-docs`에서 Swagger UI로 직접 확인 가능(운영 모드에서는 미노출)

## 환경변수

`frontend/.env`(커밋 금지, `.env.example` 참고). Vite 규칙상 클라이언트에 노출되는 변수는 `VITE_` 접두사 필수.

| 변수                | 설명                                   | 예시                              |
| ------------------- | -------------------------------------- | ---------------------------------- |
| `VITE_API_BASE_URL` | 백엔드 API 베이스 URL(필수)            | `http://localhost:3000/api/v1`     |

개발 서버 기본 포트는 5173이며, 백엔드 `CORS_ORIGIN` 기본값(`http://localhost:5173`)과 맞춰져 있다(`backend/CLAUDE.md` 참고).
