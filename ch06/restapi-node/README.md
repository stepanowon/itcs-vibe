# Todo REST API (Express)

Express 기반 간단한 CRUD REST API 예제입니다. 데이터는 JSON 파일(`db.json`)에 저장되어 서버를 재시작해도 유지됩니다.

## 기술 스택

- Node.js + Express
- lowdb (JSON 파일 기반 DB)
- swagger-jsdoc + swagger-ui-express (API 문서)
- nodemon (개발 서버)

## 실행 방법

```bash
cd examples/ch06/restapi-node
npm install

npm run dev     # 개발 서버 (nodemon, 파일 변경 시 자동 재시작)
npm start       # 운영 모드 실행
```

- API: http://localhost:8080
- Swagger UI: http://localhost:8080/api-docs
- Swagger Spec: http://localhost:8080/api-docs.json

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/todos` | 전체 목록 조회 |
| GET | `/todos/:id` | 단건 조회 |
| POST | `/todos` | 생성 (`title` 필수, `done` 선택) |
| PUT | `/todos/:id` | 수정 (`title`, `done` 일부만 전송 가능) |
| DELETE | `/todos/:id` | 삭제 |

### 요청/응답 예시

```
POST /todos
Content-Type: application/json

{ "title": "네트워크 핵심 복습하기", "done": false }
```

```
201 Created

{ "id": 3, "title": "네트워크 핵심 복습하기", "done": false }
```

### 에러 응답

| 상태 코드 | 상황 |
|-----------|------|
| 400 | `title` 누락, 잘못된 JSON 본문 |
| 404 | 존재하지 않는 `id`, 정의되지 않은 경로 |
| 405 | 지원하지 않는 HTTP 메서드 |

## 데이터 저장

`db.json` 파일에 저장됩니다. 최초 실행 시 초기 데이터 2건으로 자동 생성되며, `.gitignore`에 포함되어 있어 커밋되지 않습니다.

## 프로젝트 구조

```
restapi/
├── server.js       Express 앱, 라우팅, Swagger UI 마운트
├── db.js           lowdb 초기화 (db.json)
├── swagger.js      OpenAPI 스펙 생성 (swagger-jsdoc)
├── package.json
└── nodemon.json    개발 서버 감시 대상 설정
```
