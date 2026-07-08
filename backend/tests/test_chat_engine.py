from pydantic import BaseModel

from prelegal_backend import chat_engine
from prelegal_backend.documents.types import CoverField, DocumentDefinition, PartyRole
from prelegal_backend.schemas import ChatMessage, PartialPartyInfo


class PartialFakeFormData(BaseModel):
    partyOne: PartialPartyInfo | None = None
    someField: str | None = None


class FakeExtraction(PartialFakeFormData):
    reply: str
    isComplete: bool


FAKE_DEFINITION = DocumentDefinition(
    id="fake-doc",
    name="Fake Document",
    field_guide="Collect partyOne and someField.\n\nKnown values so far:\n{current_fields_json}",
    partial_model=PartialFakeFormData,
    extraction_model=FakeExtraction,
    party_roles=(PartyRole(field_name="partyOne", label="Party One"),),
    cover_fields=(CoverField(label="Some Field", getter=lambda data: data.someField or ""),),
)


def test_merge_fields_fills_in_new_scalar_field():
    current = PartialFakeFormData()
    extracted = FakeExtraction(reply="ok", isComplete=False, someField="hello")

    merged = chat_engine.merge_fields(current, extracted, FAKE_DEFINITION)

    assert merged.someField == "hello"


def test_merge_fields_keeps_existing_value_when_extraction_is_null():
    current = PartialFakeFormData(someField="hello")
    extracted = FakeExtraction(reply="ok", isComplete=False, someField=None)

    merged = chat_engine.merge_fields(current, extracted, FAKE_DEFINITION)

    assert merged.someField == "hello"


def test_merge_fields_merges_party_role_fields_key_by_key():
    current = PartialFakeFormData(
        partyOne=PartialPartyInfo(companyName="Acme Inc", noticeAddress="acme@example.com")
    )
    extracted = FakeExtraction(
        reply="ok", isComplete=False, partyOne=PartialPartyInfo(printName="Jane Doe")
    )

    merged = chat_engine.merge_fields(current, extracted, FAKE_DEFINITION)

    assert merged.partyOne.companyName == "Acme Inc"
    assert merged.partyOne.noticeAddress == "acme@example.com"
    assert merged.partyOne.printName == "Jane Doe"


def test_run_turn_sends_field_guide_and_history(monkeypatch):
    captured = {}

    def fake_call_structured(messages, response_model):
        captured["messages"] = messages
        captured["response_model"] = response_model
        return FakeExtraction(reply="What's someField?", isComplete=False)

    monkeypatch.setattr(chat_engine, "call_structured", fake_call_structured)

    history = [ChatMessage(role="user", content="Let's go")]
    reply, merged, is_complete = chat_engine.run_turn(
        FAKE_DEFINITION, history, PartialFakeFormData()
    )

    assert captured["response_model"] is FakeExtraction
    assert captured["messages"][0]["role"] == "system"
    assert "Collect partyOne and someField" in captured["messages"][0]["content"]
    assert captured["messages"][1] == {"role": "user", "content": "Let's go"}
    assert reply == "What's someField?"
    assert is_complete is False
    assert merged == PartialFakeFormData()
