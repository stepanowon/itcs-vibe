from typing import Optional

from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import db

app = FastAPI(
    title="Todos REST API",
    version="1.0.0",
    description="FastAPI 기반 간단한 CRUD REST API 예제 문서",
)


class TodoCreate(BaseModel):
    title: str
    done: bool = False


class TodoUpdate(BaseModel):
    title: Optional[str] = None
    done: Optional[bool] = None


class Todo(BaseModel):
    id: int
    title: str
    done: bool


class ErrorResponse(BaseModel):
    error: str
    message: str


def not_found(todo_id: int) -> HTTPException:
    return HTTPException(
        status_code=404,
        detail={"error": "NOT_FOUND", "message": f"id {todo_id}를 찾을 수 없습니다."},
    )


@app.get("/todos", response_model=list[Todo], summary="할 일 목록 조회", tags=["Todos"])
def list_todos():
    return db.get_all()


@app.get(
    "/todos/{todo_id}",
    response_model=Todo,
    responses={404: {"model": ErrorResponse, "description": "존재하지 않는 id"}},
    summary="할 일 단건 조회",
    tags=["Todos"],
)
def read_todo(todo_id: int):
    todo = db.get_by_id(todo_id)
    if todo is None:
        raise not_found(todo_id)
    return todo


@app.post(
    "/todos",
    response_model=Todo,
    status_code=201,
    responses={400: {"model": ErrorResponse, "description": "title 누락"}},
    summary="할 일 생성",
    tags=["Todos"],
)
def create_todo(payload: TodoCreate):
    if not payload.title:
        raise HTTPException(
            status_code=400,
            detail={"error": "BAD_REQUEST", "message": "title은 필수입니다."},
        )
    return db.create(payload.title, payload.done)


@app.put(
    "/todos/{todo_id}",
    response_model=Todo,
    responses={404: {"model": ErrorResponse, "description": "존재하지 않는 id"}},
    summary="할 일 수정",
    tags=["Todos"],
)
def update_todo(todo_id: int, payload: TodoUpdate):
    if db.get_by_id(todo_id) is None:
        raise not_found(todo_id)
    changes = payload.model_dump(exclude_unset=True)
    return db.update(todo_id, changes)


@app.delete(
    "/todos/{todo_id}",
    response_model=Todo,
    responses={404: {"model": ErrorResponse, "description": "존재하지 않는 id"}},
    summary="할 일 삭제",
    tags=["Todos"],
)
def delete_todo(todo_id: int):
    todo = db.get_by_id(todo_id)
    if todo is None:
        raise not_found(todo_id)
    db.delete(todo_id)
    return todo


# ── 공통 에러 처리 ────────────────────────────────────────────────


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=400,
        content={"error": "BAD_REQUEST", "message": "요청 본문이 올바르지 않습니다."},
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict):
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    if exc.status_code == 404:
        return JSONResponse(
            status_code=404,
            content={"error": "NOT_FOUND", "message": "존재하지 않는 경로입니다."},
        )
    if exc.status_code == 405:
        return JSONResponse(
            status_code=405,
            content={"error": "METHOD_NOT_ALLOWED", "message": "지원하지 않는 HTTP 메서드입니다."},
        )
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": "INTERNAL_ERROR", "message": str(exc.detail)},
    )
