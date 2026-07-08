from fastapi import APIRouter, HTTPException, status

from .llm_client import LlmError
from .nda_chat import run_turn
from .schemas import NdaChatRequest, NdaChatResponse

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/nda", response_model=NdaChatResponse)
def nda_chat(payload: NdaChatRequest) -> NdaChatResponse:
    if not payload.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="messages must not be empty",
        )

    try:
        reply, fields, is_complete = run_turn(payload.messages, payload.fields)
    except LlmError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service unavailable, please try again.",
        )

    return NdaChatResponse(reply=reply, fields=fields, isComplete=is_complete)
