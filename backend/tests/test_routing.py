from prelegal_backend import routing
from prelegal_backend.schemas import ChatMessage


def test_build_routing_prompt_lists_supported_and_all_catalog_documents(monkeypatch):
    monkeypatch.setattr(
        routing,
        "load_catalog",
        lambda: [
            {"id": "mutual-nda", "name": "Mutual NDA", "description": "..."},
            {"id": "csa", "name": "Cloud Service Agreement", "description": "..."},
        ],
    )

    prompt = routing.build_routing_prompt()

    assert "mutual-nda" in prompt
    assert "csa" in prompt
    assert "pilot-agreement" in prompt
    assert "design-partner-agreement" in prompt


def test_run_routing_turn_returns_extraction(monkeypatch):
    def fake_call_structured(messages, response_model):
        assert response_model is routing.RoutingExtraction
        assert messages[0]["role"] == "system"
        return routing.RoutingExtraction(
            reply="Sure, let's draft a Mutual NDA.", documentId="mutual-nda"
        )

    monkeypatch.setattr(routing, "call_structured", fake_call_structured)

    result = routing.run_routing_turn([ChatMessage(role="user", content="I need an NDA")])

    assert result.documentId == "mutual-nda"
    assert result.suggestedDocumentId is None


def test_routing_extraction_rejects_unsupported_document_id():
    import pytest
    from pydantic import ValidationError

    with pytest.raises(ValidationError):
        routing.RoutingExtraction(reply="ok", documentId="csa")
