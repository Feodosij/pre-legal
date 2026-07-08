import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path

DB_PATH = Path(os.environ.get("PRELEGAL_DB_PATH", "/tmp/prelegal.db"))


def init_db() -> None:
    """Recreate the database schema from scratch.

    The project spec calls for a temporary database that starts empty
    every time the container comes up, so any existing file is dropped first.
    """
    if DB_PATH.exists():
        DB_PATH.unlink()

    with sqlite3.connect(DB_PATH) as conn:
        conn.execute(
            """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id),
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.execute(
            """
            CREATE TABLE documents (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL REFERENCES users(id),
                document_id TEXT NOT NULL,
                title TEXT NOT NULL,
                fields_json TEXT NOT NULL,
                is_complete INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                updated_at TEXT NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        conn.commit()


@contextmanager
def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()
