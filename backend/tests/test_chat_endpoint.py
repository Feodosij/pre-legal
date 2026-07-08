from prelegal_backend import chat
from prelegal_backend.llm_client import LlmError
from prelegal_backend.schemas import PartialNdaFormData


def test_nda_chat_returns_reply_fields_and_completion_flag(client, monkeypatch):
    def fake_run_turn(messages, current_fields):
        return "What's the governing law?", PartialNdaFormData(purpose="Partnership talks"), False

    monkeypatch.setattr(chat, "run_turn", fake_run_turn)

    response = client.post(
        "/api/chat/nda",
        json={"messages": [{"role": "user", "content": "Let's start"}], "fields": {}},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["reply"] == "What's the governing law?"
    assert body["fields"]["purpose"] == "Partnership talks"
    assert body["isComplete"] is False


def test_nda_chat_rejects_empty_message_history(client):
    response = client.post("/api/chat/nda", json={"messages": [], "fields": {}})
    assert response.status_code == 400


def test_nda_chat_returns_502_when_llm_fails(client, monkeypatch):
    def failing_run_turn(messages, current_fields):
        raise LlmError("boom")

    monkeypatch.setattr(chat, "run_turn", failing_run_turn)

    response = client.post(
        "/api/chat/nda",
        json={"messages": [{"role": "user", "content": "Let's start"}], "fields": {}},
    )

    assert response.status_code == 502
