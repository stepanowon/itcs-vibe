# Todo List (FastAPI)

Python + FastAPI 기반 서버 렌더링 Todo List 웹 애플리케이션입니다.

## 기술 스택

- FastAPI + Uvicorn
- Jinja2 템플릿 (서버 사이드 렌더링)
- SQLite (파일 기반 DB)

## 실행 방법

```bash
cd examples/ch04/dynamic-page
python -m venv .venv

# Windows
.venv\Scripts\pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app:app --reload --port 5000

# macOS / Linux
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app:app --reload --port 5000
```

- 웹 페이지: http://localhost:5000/todos
- 자동 생성 API 문서: http://localhost:5000/docs

## 페이지 라우트

| 메서드 | 경로 | 설명 |
|--------|------|------|
| GET | `/todos` | 할 일 목록 페이지 |
| GET | `/todos/new` | 등록 폼 페이지 |
| POST | `/todos` | 생성 |
| GET | `/todos/{id}/edit` | 수정 폼 페이지 |
| POST | `/todos/{id}/update` | 수정 |
| POST | `/todos/{id}/toggle` | 완료 상태 전환 |
| POST | `/todos/{id}/delete` | 삭제 |

제목이 비어있는 채로 등록/수정을 시도하면 폼 페이지에 에러 메시지와 함께 400 응답을 반환합니다. 존재하지 않는 `id`로 접근하면 404 페이지가 표시됩니다.

## 데이터 저장

`todos.db`(SQLite 파일)에 저장되며, 서버를 재시작해도 데이터가 유지됩니다. 최초 실행 시 파일이 없으면 초기 데이터 2건으로 자동 생성됩니다. `.gitignore`에 포함되어 있어 커밋되지 않습니다.

## 디자인

[examples/ch04/httpserver](../httpserver)의 `course.html`과 동일한 디자인 톤(인디고 `#4f46e5` → 시안 `#06b6d4` 그라디언트 히어로, sticky 탑바, 화이트 카드)을 `static/css/style.css`에 적용했습니다.

## 프로젝트 구조

```
dynamic-page/
├── app.py                FastAPI 앱, 라우팅
├── db.py                 SQLite 연결/초기화 및 시드 데이터
├── templates/
│   ├── layout.html        공통 레이아웃 (탑바, 히어로, 푸터)
│   ├── list.html          할 일 목록
│   ├── form.html          등록/수정 폼
│   └── 404.html
├── static/css/style.css
└── requirements.txt
```
