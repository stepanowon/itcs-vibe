# Todo REST API (FastAPI)

FastAPI 기반 간단한 CRUD REST API 예제입니다. `examples/ch06/restapi`(Express 버전)와 동일한 API 스펙을 파이썬으로 재구현했습니다. 데이터는 JSON 파일(`db.json`)에 저장되어 서버를 재시작해도 유지됩니다.

## 기술 스택

- Python + FastAPI
- Pydantic (요청/응답 데이터 검증)
- 파일 기반 JSON DB (`db.py`, `db.json`)
- Uvicorn (ASGI 개발 서버)

## 실행 방법

```bash
cd examples/ch06/restapi-python

python -m venv .venv
.venv\Scripts\activate      # Windows
# source .venv/bin/activate # macOS/Linux

pip install -r requirements.txt

uvicorn main:app --reload --port 8080
```

- API: http://localhost:8080
- Swagger UI (자동 생성): http://localhost:8080/docs
- ReDoc (자동 생성): http://localhost:8080/redoc

## API 엔드포인트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/todos` | 전체 목록 조회 |
| GET | `/todos/{id}` | 단건 조회 |
| POST | `/todos` | 생성 (`title` 필수, `done` 선택) |
| PUT | `/todos/{id}` | 수정 (`title`, `done` 일부만 전송 가능) |
| DELETE | `/todos/{id}` | 삭제 |

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
| 400 | `title` 누락, 잘못된 요청 본문 |
| 404 | 존재하지 않는 `id`, 정의되지 않은 경로 |
| 405 | 지원하지 않는 HTTP 메서드 |

## 데이터 저장

`db.json` 파일에 저장됩니다. 최초 실행 시 초기 데이터 2건으로 자동 생성되며, `.gitignore`에 포함되어 있어 커밋되지 않습니다.

## 프로젝트 구조

```
restapi2/
├── main.py           FastAPI 앱, 라우팅, 에러 핸들러
├── db.py             JSON 파일 기반 데이터 저장소 (db.json)
├── requirements.txt
└── README.md
```

## Express 버전과의 차이점

- Swagger 문서는 `swagger-jsdoc` 주석 대신 FastAPI가 라우트 정의(Pydantic 모델, `responses` 옵션)로부터 OpenAPI 스펙을 자동 생성합니다.
- lowdb 대신 표준 라이브러리 `json` 모듈로 직접 파일을 읽고 쓰는 경량 저장소(`db.py`)를 사용합니다.
- 요청 본문 검증은 Express의 수동 `if (!title)` 체크 대신 Pydantic 모델(`TodoCreate`, `TodoUpdate`)이 담당하며, 에러 응답 형식(`{ "error", "message" }`)은 커스텀 예외 핸들러로 Express 버전과 동일하게 맞췄습니다.
