import os
import sqlite3

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, 'todos.db')


def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS todos (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            done  INTEGER NOT NULL DEFAULT 0
        )
    ''')
    count = conn.execute('SELECT COUNT(*) AS c FROM todos').fetchone()['c']
    if count == 0:
        conn.executemany(
            'INSERT INTO todos (title, done) VALUES (?, ?)',
            [
                ('HTTP 요청/응답 구조 학습하기', 0),
                ('간단한 웹서버 만들어보기', 1),
            ],
        )
        conn.commit()
    conn.close()
