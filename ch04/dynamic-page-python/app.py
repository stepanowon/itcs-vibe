from pathlib import Path
from typing import Optional

from fastapi import FastAPI, Form, HTTPException, Request
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from starlette.status import HTTP_303_SEE_OTHER, HTTP_400_BAD_REQUEST

from db import get_connection, init_db

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="Todo List (FastAPI)")
app.mount("/static", StaticFiles(directory=BASE_DIR / "static"), name="static")
templates = Jinja2Templates(directory=BASE_DIR / "templates")

init_db()


@app.get("/", name="home")
def home():
    return RedirectResponse(url="/todos", status_code=HTTP_303_SEE_OTHER)


@app.get("/todos", name="list_todos")
def list_todos(request: Request):
    conn = get_connection()
    todos = conn.execute("SELECT * FROM todos ORDER BY id").fetchall()
    conn.close()
    return templates.TemplateResponse("list.html", {"request": request, "todos": todos})


@app.get("/todos/new", name="new_todo_form")
def new_todo_form(request: Request):
    return templates.TemplateResponse("form.html", {"request": request, "todo": None, "error": None})


@app.post("/todos", name="create_todo")
def create_todo(request: Request, title: str = Form(""), done: Optional[str] = Form(None)):
    title = title.strip()
    if not title:
        return templates.TemplateResponse(
            "form.html",
            {"request": request, "todo": None, "error": "할 일 제목을 입력해주세요."},
            status_code=HTTP_400_BAD_REQUEST,
        )

    conn = get_connection()
    conn.execute("INSERT INTO todos (title, done) VALUES (?, ?)", (title, 1 if done == "on" else 0))
    conn.commit()
    conn.close()
    return RedirectResponse(url="/todos", status_code=HTTP_303_SEE_OTHER)


@app.get("/todos/{todo_id}/edit", name="edit_todo_form")
def edit_todo_form(request: Request, todo_id: int):
    conn = get_connection()
    todo = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    conn.close()
    if todo is None:
        raise HTTPException(status_code=404)
    return templates.TemplateResponse("form.html", {"request": request, "todo": todo, "error": None})


@app.post("/todos/{todo_id}/update", name="update_todo")
def update_todo(request: Request, todo_id: int, title: str = Form(""), done: Optional[str] = Form(None)):
    conn = get_connection()
    todo = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    if todo is None:
        conn.close()
        raise HTTPException(status_code=404)

    title = title.strip()
    if not title:
        conn.close()
        return templates.TemplateResponse(
            "form.html",
            {"request": request, "todo": todo, "error": "할 일 제목을 입력해주세요."},
            status_code=HTTP_400_BAD_REQUEST,
        )

    conn.execute("UPDATE todos SET title = ?, done = ? WHERE id = ?", (title, 1 if done == "on" else 0, todo_id))
    conn.commit()
    conn.close()
    return RedirectResponse(url="/todos", status_code=HTTP_303_SEE_OTHER)


@app.post("/todos/{todo_id}/toggle", name="toggle_todo")
def toggle_todo(todo_id: int):
    conn = get_connection()
    todo = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    if todo is None:
        conn.close()
        raise HTTPException(status_code=404)

    conn.execute("UPDATE todos SET done = ? WHERE id = ?", (0 if todo["done"] else 1, todo_id))
    conn.commit()
    conn.close()
    return RedirectResponse(url="/todos", status_code=HTTP_303_SEE_OTHER)


@app.post("/todos/{todo_id}/delete", name="delete_todo")
def delete_todo(todo_id: int):
    conn = get_connection()
    todo = conn.execute("SELECT * FROM todos WHERE id = ?", (todo_id,)).fetchone()
    if todo is None:
        conn.close()
        raise HTTPException(status_code=404)

    conn.execute("DELETE FROM todos WHERE id = ?", (todo_id,))
    conn.commit()
    conn.close()
    return RedirectResponse(url="/todos", status_code=HTTP_303_SEE_OTHER)


@app.exception_handler(404)
async def not_found_handler(request: Request, _exc: HTTPException):
    return templates.TemplateResponse("404.html", {"request": request}, status_code=404)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app:app", host="0.0.0.0", port=5000, reload=True)
