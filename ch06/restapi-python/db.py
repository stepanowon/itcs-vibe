import json
from pathlib import Path
from threading import Lock
from typing import Optional

DB_FILE = Path(__file__).parent / "db.json"
_lock = Lock()

_DEFAULT_DATA = {
    "todos": [
        {"id": 1, "title": "HTTP 요청/응답 구조 학습하기", "done": False},
        {"id": 2, "title": "간단한 웹서버 만들어보기", "done": True},
    ],
    "nextId": 3,
}


def _read() -> dict:
    if not DB_FILE.exists():
        _write(_DEFAULT_DATA)
    with DB_FILE.open("r", encoding="utf-8") as f:
        return json.load(f)


def _write(data: dict) -> None:
    with DB_FILE.open("w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def get_all() -> list[dict]:
    return _read()["todos"]


def get_by_id(todo_id: int) -> Optional[dict]:
    return next((t for t in get_all() if t["id"] == todo_id), None)


def create(title: str, done: bool) -> dict:
    with _lock:
        data = _read()
        todo = {"id": data["nextId"], "title": title, "done": done}
        data["todos"].append(todo)
        data["nextId"] += 1
        _write(data)
        return todo


def update(todo_id: int, changes: dict) -> Optional[dict]:
    with _lock:
        data = _read()
        todo = next((t for t in data["todos"] if t["id"] == todo_id), None)
        if todo is None:
            return None
        todo.update(changes)
        _write(data)
        return todo


def delete(todo_id: int) -> Optional[dict]:
    with _lock:
        data = _read()
        todo = next((t for t in data["todos"] if t["id"] == todo_id), None)
        if todo is None:
            return None
        data["todos"] = [t for t in data["todos"] if t["id"] != todo_id]
        _write(data)
        return todo
