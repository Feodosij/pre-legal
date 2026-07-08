import os
from typing import TypeVar

import litellm
from pydantic import BaseModel

OPENROUTER_MODEL = "openrouter/nvidia/nemotron-3-super-120b-a12b:free"
OPENROUTER_API_BASE = "https://openrouter.ai/api/v1"
OPENROUTER_API_KEY = os.environ["OPENROUTER_API_KEY"]
LLM_TIMEOUT_SECONDS = 30

ModelT = TypeVar("ModelT", bound=BaseModel)


class LlmError(Exception):
    pass


def call_structured(messages: list[dict[str, str]], response_model: type[ModelT]) -> ModelT:
    try:
        response = litellm.completion(
            model=OPENROUTER_MODEL,
            api_base=OPENROUTER_API_BASE,
            api_key=OPENROUTER_API_KEY,
            messages=messages,
            response_format=response_model,
            timeout=LLM_TIMEOUT_SECONDS,
        )
    except Exception as exc:
        raise LlmError(str(exc)) from exc

    try:
        return response_model.model_validate_json(response.choices[0].message.content)
    except Exception as exc:
        raise LlmError(f"Could not parse LLM response: {exc}") from exc
