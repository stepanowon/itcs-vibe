# 소규모 사업장 근태관리 앱

- 임직원 20명 내외의 소규모 사업장을 위한 경량 근태관리 웹 애플리케이션입니다. 출퇴근 기록, 연차 신청/승인, 월별 근태 현황 조회를 제공합니다.
- 이 앱은 바이브 코딩 강의를 위해 만든 샘플 예제입니다.

## Demo

- 사이트: https://staff-gdhong-fe.vercel.app
 
### 샘플 계정

모든 계정의 비밀번호는 `password123`입니다.

| 역할     | 이메일                  | 이름   | 사번    | 입사일     |
| -------- | ----------------------- | ------ | ------- | ---------- |
| manager  | `manager@example.com`   | 박관리 | EMP-001 | 2020-03-02 |
| employee | `employee1@example.com` | 김직원 | EMP-002 | 2025-01-06 |
| employee | `employee2@example.com` | 이직원 | EMP-003 | 2026-03-02 |

> 공용 데모 계정입니다. 비밀번호를 변경하지 말아 주세요.

## 주요 기능

- **인증/사용자 관리**: 회원가입(최초 가입자는 manager), JWT Access/Refresh Token 로그인, 비밀번호 변경, 역할 기반 접근 제어(manager/employee)
- **출퇴근 관리**: 하루 1회 체크인, 체크아웃(재클릭 시 최종 시각으로 갱신), 대시보드 요약
- **연차 관리**: 종일/반차(오전·오후) 신청, manager 승인/반려(본인 신청 건 제외), 전사 공통 연차일수와 입사연도 기준 자동 계산
- **근태 현황 조회**: employee는 본인, manager는 전체 직원의 월별 출퇴근/연차 내역 조회

## 기술 스택

| 구분       | 기술                                                              |
| ---------- | ----------------------------------------------------------------- |
| Frontend   | React, Vite, React Router, TanStack Query, Zustand, Axios, Bootstrap |
| Backend    | Node.js, Express, pg, JWT, bcrypt, Swagger UI                      |
| Database   | PostgreSQL (Neon)                                                 |
| Test       | Jest + Supertest (backend), Vitest (frontend)                     |

## 디렉토리 구조

```
backend/   # Express API (Clean 아키텍처)
frontend/  # React 애플리케이션
db/        # 마이그레이션(migrations/) 및 시드 데이터(seed.sql)
docs/      # PRD, 사용자 시나리오, 와이어프레임, ERD, 실행계획, 스타일 가이드
```

## 로컬 실행

### 1. 데이터베이스

PostgreSQL을 준비한 뒤 `db/migrations/`의 SQL 파일을 파일명 순서대로 적용합니다. 개발용 샘플 데이터가 필요하면 `db/seed.sql`을 추가로 적용합니다.

### 2. 백엔드

```bash
cd backend
cp .env.example .env   # DATABASE_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET 설정
npm install
npm run dev            # http://localhost:3000
```

- 헬스체크: `GET http://localhost:3000/api/v1/health`
- API 문서(개발 모드): http://localhost:3000/api-docs

### 3. 프론트엔드

```bash
cd frontend
cp .env.example .env   # VITE_API_BASE_URL=http://localhost:3000/api/v1
npm install
npm run dev            # http://localhost:5173
```

## 테스트

```bash
cd backend && npm test
cd frontend && npm test
```

## 문서

- [PRD](docs/1-prd.md)
- [사용자 시나리오](docs/2-user-scenario.md)
- [와이어프레임](docs/3-wireframe.md)
- [ERD](docs/4-erd.md)
- [실행계획](docs/5-plan.md)
- [스타일 가이드](docs/style-guide.md)
- [API 명세](backend/swagger.yaml)
