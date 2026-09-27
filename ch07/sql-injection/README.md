# sql-injection

SQL Injection의 원리와 방어 방법(Prepared Statement)을 비교 실습하기 위한 REST API 예제입니다.

## 기술 스택

- Node.js (`node:sqlite` 내장 모듈 사용)
- Express
- Swagger UI (`swagger-ui-express`, `swagger-jsdoc`)

## 실행 방법

```bash
npm install
npm start

# 개발 서버로 실행 (파일 변경 시 자동 재시작)
npm run dev
```

`http://localhost:3000/api-docs` 에서 Swagger UI로 API를 확인하고 바로 실행해볼 수 있습니다.

## 테스트 계정

최초 실행 시 `data/sql-injection.db`에 아래 계정이 자동으로 생성됩니다. (실습 목적으로 비밀번호를 평문 저장합니다)

| 아이디 | 비밀번호        | 권한  |
| ------ | --------------- | ----- |
| user1  | asdf!2345       | user  |
| user2  | asdf!2345       | user  |
| admin  | S3cretAdminPw!  | admin |

## 엔드포인트

| 엔드포인트                | 설명                                       |
| -------------------------- | ------------------------------------------ |
| `POST /api/login-vulnerable`  | 문자열 조합 쿼리 (SQL Injection에 취약)     |
| `POST /api/login-safe`        | Prepared Statement (안전)                   |
| `GET /api/search-vulnerable`  | 문자열 조합 쿼리 (UNION Injection에 취약)   |
| `GET /api/search-safe`        | Prepared Statement (안전)                   |

취약 엔드포인트의 응답에는 실제로 실행된 SQL 문(`executedSql`)이 함께 담겨 있어, 입력값이 어떻게 쿼리 구조를 바꾸는지 눈으로 확인할 수 있습니다.

## 공격 예시

### 1. 로그인 우회 (`/api/login-vulnerable`)

```json
{ "username": "' OR '1'='1' -- ", "password": "아무값" }
```

실행되는 쿼리:

```sql
SELECT id, username, email, role FROM users WHERE username = '' OR '1'='1' -- ' AND password = '아무값'
```

`-- ` 뒤는 주석 처리되어 비밀번호 검증 자체가 사라지고, `'1'='1'`이 항상 참이 되어 첫 번째 사용자로 로그인됩니다.

### 2. UNION 기반 데이터 탈취 (`/api/search-vulnerable`)

```
GET /api/search-vulnerable?keyword=x' UNION SELECT id, username, password, role FROM users -- 
```

검색 결과인 것처럼 위장해 `email` 컬럼 자리에 평문 `password` 값이 그대로 노출됩니다.

같은 입력을 `/api/login-safe`, `/api/search-safe`에 넣어보면 Prepared Statement(`?` 바인딩) 덕분에 입력값이 항상 하나의 값으로만 취급되어 공격이 통하지 않는 것을 확인할 수 있습니다.

## 파일 구조

```
server.js   # Express 서버, Swagger 설정, API 라우트 (취약/안전 버전)
db.js       # SQLite 스키마, 테스트 사용자 시드
data/sql-injection.db  # SQLite 데이터 파일 (자동 생성)
```

## 참고

이 예제는 교육용으로 SQL Injection을 의도적으로 재현합니다. 실제 서비스에서는 항상 Prepared Statement(파라미터 바인딩)를 사용하고, 비밀번호는 평문이 아닌 해시(예: scrypt, bcrypt)로 저장해야 합니다.
