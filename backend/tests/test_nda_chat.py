import pytest
from pydantic import ValidationError

from prelegal_backend import nda_chat
from prelegal_backend.nda_chat import NdaExtraction, merge_fields, run_turn
from prelegal_backend.schemas import ChatMessage, PartialNdaFormData, PartialPartyInfo


def test_nda_extraction_rejects_mnda_term_outside_the_allowed_literals():
    with pytest.raises(ValidationError):
        NdaExtraction(reply="ok", isComplete=False, mndaTerm="Expires")


def test_nda_extraction_rejects_confidentiality_term_outside_the_allowed_literals():
    with pytest.raises(ValidationError):
        NdaExtraction(reply="ok", isComplete=False, confidentialityTerm="perpetual")


def test_merge_fields_fills_in_new_top_level_field():
    current = PartialNdaFormData()
    extracted = NdaExtraction(reply="Got it.", isComplete=False, governingLaw="Delaware")

    merged = merge_fields(current, extracted)

    assert merged.governingLaw == "Delaware"


def test_merge_fields_keeps_existing_value_when_extraction_is_null():
    current = PartialNdaFormData(governingLaw="Delaware")
    extracted = NdaExtraction(reply="Got it.", isComplete=False, governingLaw=None)

    merged = merge_fields(current, extracted)

    assert merged.governingLaw == "Delaware"


def test_merge_fields_merges_party_fields_key_by_key():
    current = PartialNdaFormData(
        partyOne=PartialPartyInfo(companyName="Acme Inc", noticeAddress="acme@example.com")
    )
    extracted = NdaExtraction(
        reply="Got it.",
        isComplete=False,
        partyOne=PartialPartyInfo(printName="Jane Doe"),
    )

    merged = merge_fields(current, extracted)

    assert merged.partyOne.companyName == "Acme Inc"
    assert merged.partyOne.noticeAddress == "acme@example.com"
    assert merged.partyOne.printName == "Jane Doe"


def test_run_turn_sends_history_with_system_prompt_first(monkeypatch):
    captured = {}

    def fake_call_structured(messages, response_model):
        captured["messages"] = messages
        captured["response_model"] = response_model
        return NdaExtraction(reply="What's the governing law?", isComplete=False)

    monkeypatch.setattr(nda_chat, "call_structured", fake_call_structured)

    history = [ChatMessage(role="user", content="Let's set up an NDA")]
    run_turn(history, PartialNdaFormData())

    assert captured["response_model"] is NdaExtraction
    assert captured["messages"][0]["role"] == "system"
    assert captured["messages"][1] == {"role": "user", "content": "Let's set up an NDA"}


def test_run_turn_returns_reply_merged_fields_and_completion_flag(monkeypatch):
    def fake_call_structured(messages, response_model):
        return NdaExtraction(reply="Thanks!", isComplete=True, governingLaw="Delaware")

    monkeypatch.setattr(nda_chat, "call_structured", fake_call_structured)

    reply, merged, is_complete = run_turn(
        [ChatMessage(role="user", content="Delaware")], PartialNdaFormData()
    )

    assert reply == "Thanks!"
    assert merged.governingLaw == "Delaware"
    assert is_complete is True
