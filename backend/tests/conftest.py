import os
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

REPO_ROOT = Path(__file__).resolve().parents[2]

# These are read at import time by prelegal_backend.documents.registry, so they
# must be set before any test module imports the package, not inside a fixture.
os.environ.setdefault("PRELEGAL_CATALOG_PATH", str(REPO_ROOT / "catalog.json"))
os.environ.setdefault("PRELEGAL_TEMPLATES_DIR", str(REPO_ROOT / "templates"))
os.environ.setdefault("OPENROUTER_API_KEY", "test-key")


@pytest.fixture
def client(tmp_path, monkeypatch):
    monkeypatch.setenv("PRELEGAL_DB_PATH", str(tmp_path / "test.db"))
    monkeypatch.setenv("PRELEGAL_STATIC_DIR", str(tmp_path / "nonexistent-static"))
    monkeypatch.setenv("OPENROUTER_API_KEY", "test-key")

    from prelegal_backend import db, main

    db.DB_PATH = tmp_path / "test.db"

    with TestClient(main.app) as test_client:
        yield test_client
