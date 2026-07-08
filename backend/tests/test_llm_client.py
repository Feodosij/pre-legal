import pytest
from pydantic import BaseModel

from prelegal_backend import llm_client
from prelegal_backend.llm_client import LlmError, call_structured


class Fields(BaseModel):
    name: str


class FakeMessage:
    def __init__(self, content):
        self.content = content


class FakeChoice:
    def __init__(self, content):
        self.message = FakeMessage(content)


class FakeResponse:
    def __init__(self, content):
        self.choices = [FakeChoice(content)]


def test_call_structured_passes_mandated_model_and_returns_parsed_model(monkeypatch):
    captured = {}

    def fake_completion(**kwargs):
        captured.update(kwargs)
        return FakeResponse('{"name": "Acme"}')

    monkeypatch.setattr(llm_client.litellm, "completion", fake_completion)

    result = call_structured([{"role": "user", "content": "hi"}], Fields)

    assert result == Fields(name="Acme")
    assert captured["model"] == llm_client.OPENROUTER_MODEL
    assert captured["api_base"] == llm_client.OPENROUTER_API_BASE
    assert captured["response_format"] is Fields
    assert captured["messages"] == [{"role": "user", "content": "hi"}]
    assert captured["timeout"] == llm_client.LLM_TIMEOUT_SECONDS


def test_call_structured_wraps_timeouts(monkeypatch):
    def fake_completion(**kwargs):
        raise TimeoutError("took too long")

    monkeypatch.setattr(llm_client.litellm, "completion", fake_completion)

    with pytest.raises(LlmError):
        call_structured([{"role": "user", "content": "hi"}], Fields)


def test_call_structured_wraps_completion_errors(monkeypatch):
    def fake_completion(**kwargs):
        raise RuntimeError("network down")

    monkeypatch.setattr(llm_client.litellm, "completion", fake_completion)

    with pytest.raises(LlmError):
        call_structured([{"role": "user", "content": "hi"}], Fields)


def test_call_structured_wraps_unparseable_responses(monkeypatch):
    def fake_completion(**kwargs):
        return FakeResponse("not json")

    monkeypatch.setattr(llm_client.litellm, "completion", fake_completion)

    with pytest.raises(LlmError):
        call_structured([{"role": "user", "content": "hi"}], Fields)
