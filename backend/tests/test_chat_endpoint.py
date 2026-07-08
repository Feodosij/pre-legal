from prelegal_backend import chat
from prelegal_backend.documents.mutual_nda import PartialNdaFormData
from prelegal_backend.documents.pilot_agreement import PartialPilotFormData
from prelegal_backend.llm_client import LlmError
from prelegal_backend.routing import RoutingExtraction


def test_chat_runs_routing_turn_when_document_id_is_unset(client, monkeypatch):
    def fake_run_routing_turn(messages):
        return RoutingExtraction(reply="Let's draft a Pilot Agreement.", documentId="pilot-agreement")

    def fake_run_turn(definition, messages, current_fields):
        assert definition.id == "pilot-agreement"
        return "Great, what's the pilot period?", PartialPilotFormData(), False

    monkeypatch.setattr(chat, "run_routing_turn", fake_run_routing_turn)
    monkeypatch.setattr(chat, "run_turn", fake_run_turn)

    response = client.post(
        "/api/chat/message",
        json={"messages": [{"role": "user", "content": "I need a pilot agreement"}]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["documentId"] == "pilot-agreement"
    assert body["reply"] == "Great, what's the pilot period?"
    assert body["isComplete"] is False


def test_chat_extracts_fields_from_first_message_once_document_id_resolves(client, monkeypatch):
    """Regression test: a first message that both identifies the document type and
    states field values (parties, dates, terms, ...) must have those fields
    extracted in the same response, not discarded until a second turn."""

    def fake_run_routing_turn(messages):
        return RoutingExtraction(reply="Let's draft a Mutual NDA.", documentId="mutual-nda")

    def fake_run_turn(definition, messages, current_fields):
        assert definition.id == "mutual-nda"
        # current_fields must start empty (partial_model()), since this is turn 1.
        assert current_fields.model_dump(exclude_none=True) == {}
        extracted = PartialNdaFormData(
            purpose="evaluating a potential business partnership",
            effectiveDate="2026-07-08",
            confidentialityTerm="years",
            confidentialityTermYears=2,
            governingLaw="New York",
        )
        return "Got it, a few more details needed.", extracted, False

    monkeypatch.setattr(chat, "run_routing_turn", fake_run_routing_turn)
    monkeypatch.setattr(chat, "run_turn", fake_run_turn)

    response = client.post(
        "/api/chat/message",
        json={
            "messages": [
                {
                    "role": "user",
                    "content": (
                        "I need a mutual NDA between Acme AI Inc and Beta Corp, "
                        "effective today, for evaluating a potential business "
                        "partnership, confidentiality period of 2 years, "
                        "governing law New York"
                    ),
                }
            ]
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["documentId"] == "mutual-nda"
    assert body["fields"]["confidentialityTerm"] == "years"
    assert body["fields"]["confidentialityTermYears"] == 2
    assert body["fields"]["governingLaw"] == "New York"
    assert body["fields"]["purpose"] == "evaluating a potential business partnership"


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
