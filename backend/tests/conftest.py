import os

import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("PRELEGAL_DB_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("PRELEGAL_STATIC_DIR", str(tmp_path / "nonexistent-static"))

    from prelegal_backend import db, main

    db.DB_PATH = tmp_path / "test.db"

    with TestClient(main.app) as test_client:
        yield test_client
