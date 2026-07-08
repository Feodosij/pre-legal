from prelegal_backend import chat
from prelegal_backend.documents.pilot_agreement import PartialPilotFormData
from prelegal_backend.llm_client import LlmError
from prelegal_backend.routing import RoutingExtraction


def test_chat_runs_routing_turn_when_document_id_is_unset(client, monkeypatch):
    def fake_run_routing_turn(messages):
        return RoutingExtraction(reply="Let's draft a Pilot Agreement.", documentId="pilot-agreement")

    monkeypatch.setattr(chat, "run_routing_turn", fake_run_routing_turn)

    response = client.post(
        "/api/chat/message",
        json={"messages": [{"role": "user", "content": "I need a pilot agreement"}]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["documentId"] == "pilot-agreement"
    assert body["reply"] == "Let's draft a Pilot Agreement."
    assert body["isComplete"] is False


def test_chat_returns_suggestion_for_unsupported_document(client, monkeypatch):
    def fake_run_routing_turn(messages):
        return RoutingExtraction(
            reply="We can't draft a CSA yet, but a Pilot Agreement is close.",
            documentId=None,
            suggestedDocumentId="csa",
        )

    monkeypatch.setattr(chat, "run_routing_turn", fake_run_routing_turn)

    response = client.post(
        "/api/chat/message",
        json={"messages": [{"role": "user", "content": "I need a cloud service agreement"}]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["documentId"] is None
    assert body["suggestedDocumentId"] == "csa"


def test_chat_dispatches_to_document_field_collection_once_document_id_is_set(client, monkeypatch):
    def fake_run_turn(definition, messages, current_fields):
        assert definition.id == "pilot-agreement"
        return "What's the pilot period?", PartialPilotFormData(governingLaw="Delaware"), False

    monkeypatch.setattr(chat, "run_turn", fake_run_turn)

    response = client.post(
        "/api/chat/message",
        json={
            "messages": [{"role": "user", "content": "Governed by Delaware law"}],
            "documentId": "pilot-agreement",
            "fields": {},
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["documentId"] == "pilot-agreement"
    assert body["fields"]["governingLaw"] == "Delaware"
    assert body["isComplete"] is False


def test_chat_rejects_unknown_document_id(client):
    response = client.post(
        "/api/chat/message",
        json={
            "messages": [{"role": "user", "content": "hi"}],
            "documentId": "not-a-real-document",
            "fields": {},
        },
    )
    assert response.status_code == 400


def test_chat_rejects_empty_message_history(client):
    response = client.post("/api/chat/message", json={"messages": []})
    assert response.status_code == 400


def test_chat_returns_502_when_llm_fails(client, monkeypatch):
    def failing_routing_turn(messages):
        raise LlmError("boom")

    monkeypatch.setattr(chat, "run_routing_turn", failing_routing_turn)

    response = client.post(
        "/api/chat/message",
        json={"messages": [{"role": "user", "content": "hi"}]},
    )

    assert response.status_code == 502
