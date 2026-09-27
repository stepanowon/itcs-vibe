# IT 기초부터 시작하는 풀스택 바이브코딩

"IT 기초부터 시작하는 풀스택 바이브코딩" 과정의 예제 파일 저장소입니다. 챕터별 폴더에 실습 예제가 들어 있으며, 각 예제는 독립적으로 실행할 수 있습니다.

## 챕터별 예제

### ch03 — 개발 환경과 환경변수

| 예제 | 설명 |
| --- | --- |
| `env-vars/env-node-app` | Node.js에서 `.env` 환경변수 사용 |
| `env-vars/env-python-app` | Python에서 `.env` 환경변수 사용 |

### ch04 — 웹 서버와 동적 페이지

| 예제 | 설명 |
| --- | --- |
| `httpserver` | 정적 HTML 페이지 |
| `dynamic-page-node` | Express 서버 렌더링 TodoList (JSON 파일 저장) |
| `dynamic-page-python` | FastAPI + Jinja2 서버 렌더링 TodoList (SQLite) |

### ch05 — 데이터베이스와 SQL

| 파일 | 설명 |
| --- | --- |
| `HR-ERD.md` | HR 스키마 ERD (Mermaid) |
| `HR-PG-DDL.sql`, `hr-pg.sql` | PostgreSQL용 HR 스키마 DDL과 데이터 |
| `sql-quiz1.txt`, `sql-quiz2-60q.txt` | SQL 연습 문제 |

### ch06 — REST API와 실시간 통신

| 예제 | 설명 |
| --- | --- |
| `restapi-node` | Express + lowdb Todo REST API (Swagger 문서) |
| `restapi-python` | FastAPI Todo REST API (같은 API 스펙) |
| `chat-polling` | 세션 로그인 + 폴링 방식 채팅 |
| `chat-socket` | 세션 로그인 + WebSocket 방식 채팅 |

### ch07 — 인증과 웹 보안

| 예제 | 설명 |
| --- | --- |
| `session-auth` | 세션 기반 인증 |
| `social-auth` | 네이버 로그인 (OAuth 2.0), Express + React |
| `cors-test` | CORS 동작 확인, Express + React |
| `sql-injection` | SQL Injection 공격과 Prepared Statement 방어 비교 |
| `xss` | XSS 공격과 출력 이스케이프 방어 비교 |

### ch08 — 프론트엔드 (React)

| 예제 | 설명 |
| --- | --- |
| `state-props` | React state/props 실습 (상품 목록과 장바구니) |
| `csr-ssr` | 같은 화면을 CSR(React + Vite)과 SSR(Next.js)로 구현해 비교 |
| `iss-tracker` | 국제우주정거장(ISS) 위치 추적 (React Query, Leaflet) |

### ch10 — AI 코딩 도구로 앱 만들기

| 예제 | 설명 |
| --- | --- |
| `mine-sweeper-prompt` | 지뢰 찾기 PRD와 프롬프트 |
| `mine-sweeper-cc` | Claude Code로 만든 지뢰 찾기 (React + TypeScript, Tauri 데스크톱 빌드) |
| `mine-sweeper-codex` | Codex로 만든 지뢰 찾기 (React + TypeScript, Electron 데스크톱 빌드) |

### ch11 — 풀스택 프로젝트

서브에이전트와 스킬(`.claude/`, `.codex/`)을 이용해 만든 풀스택 예제입니다.

| 예제 | 설명 |
| --- | --- |
| `secret-diary` | 나만의 비밀일기. Vue 3 + Express (Clean Architecture) + PostgreSQL |
| `work-log` | 업무 일지. React + Express + PostgreSQL |
| `staff-attendance` | 소규모 사업장 근태관리. React + Express + PostgreSQL (Neon) |

## 실행 방법

대부분의 예제는 폴더 안에 `README.md`가 있으니 그 안내를 따르세요. 일반적인 실행 방법은 다음과 같습니다.

```bash
# Node.js 예제
npm install
npm start        # 또는 npm run dev

# Python 예제
pip install -r requirements.txt
```

환경변수가 필요한 예제는 `.env.example`을 `.env`로 복사한 뒤 값을 채워 넣으세요. `.env` 파일은 저장소에 커밋하지 않습니다.
