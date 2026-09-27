# 프론트엔드 (secret-diary/frontend)

## 스택
Vue 3 + Vite (JavaScript, TypeScript 미사용). Pinia(클라이언트 상태), TanStack Query(`@tanstack/vue-query`, 서버 상태), Vue Router, Axios.

이 앱은 자체 JWT 인증 기반의 1인용 비밀일기 CRUD 앱이다(댓글/공유/Supabase Auth 기능 없음).

## 디렉터리 구조
- `src/pages`: 라우트 단위 화면 (route-level composition)
- `src/features/<domain>`: 화면에서 쓰는 query/mutation 훅 (예: `features/diaries/api.js`, `mutations.js`)
- `src/shared/api`: `httpClient.js`(axios 인스턴스, JWT 자동 주입/401 refresh 재시도), `tokenStorage.js`
- `src/shared/components`: 재사용 UI(TagInput, ConfirmModal, Toast, Skeleton 등)
- `src/stores`: Pinia 스토어(`auth.js` — 세션/토큰)
- `src/layouts/AppLayout.vue`: 로그인 후 공통 레이아웃(모바일 하단탭 / ≥768px 상단 네비)
- `src/router/index.js`: 라우트 + `meta.requiresAuth`/`meta.guestOnly` 가드

## API 연동 규칙
- 모든 HTTP 호출은 `shared/api/httpClient.js`를 통해서만 한다(백엔드 주소는 `VITE_API_BASE_URL` 환경변수, `.env` 참고, 미설정 시 `http://localhost:3000/api/v1`).
- 서버 상태는 TanStack Query로만 관리하고, query key는 `['diaries', filters]`처럼 명확하게 짓는다.
- API 요청/응답 형태는 `docs/4-swagger.json`과 맞춘다.

## 인증/세션
- `useAuthStore()`가 accessToken/refreshToken/user를 관리하며 localStorage로 새로고침 후에도 유지된다.
- Access Token 만료(401) 시 `httpClient`가 자동으로 `/auth/refresh`를 호출해 재시도하고, refresh 실패 시 `auth:logout` 이벤트로 세션을 정리한다(화면 이동은 라우터 가드가 처리).

## 테스트
Vitest + `@vue/test-utils`, jsdom. `axios-mock-adapter`로 API를 모킹한다. 커버리지 임계값 80%(`vite.config.js`).

```
npm test              # vitest run
npm run test:coverage # 커버리지 포함
```

`e2e/`에는 Playwright E2E 테스트(반응형 브레이크포인트, 가입~로그아웃 전체 플로우)가 있다. 프론트(`npm run dev`)와 백엔드(실제 Supabase DB 대상)가 모두 떠 있어야 한다.

```
npm run test:e2e
```

## 참고 문서
`docs/4-swagger.json`(API 계약), `docs/5-wireframe.md`(반응형 레이아웃/화면별 UI), `docs/6-user-story.md`(인수 조건), `docs/7-execution-plan.md`(FE Task 진행 상태/완료 조건)
