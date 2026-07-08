import secrets

from fastapi import Cookie, HTTPException, status

from .db import get_connection
from .schemas import UserResponse

COOKIE_NAME = "session_token"


def create_session(user_id: int) -> str:
    token = secrets.token_urlsafe(32)
    with get_connection() as conn:
        conn.execute("INSERT INTO sessions (token, user_id) VALUES (?, ?)", (token, user_id))
        conn.commit()
    return token


def delete_session(token: str) -> None:
    with get_connection() as conn:
        conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        conn.commit()


def get_current_user(session_token: str | None = Cookie(default=None)) -> UserResponse:
    if session_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated."
        )

    with get_connection() as conn:
        row = conn.execute(
            """
            SELECT users.id, users.email, users.created_at
            FROM sessions JOIN users ON users.id = sessions.user_id
            WHERE sessions.token = ?
            """,
            (session_token,),
        ).fetchone()

    if row is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Session expired or invalid."
        )

    return UserResponse(**dict(row))
