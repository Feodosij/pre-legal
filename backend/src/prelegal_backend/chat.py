from fastapi import APIRouter, HTTPException, status

from .chat_engine import run_turn
from .documents.registry import REGISTRY
from .llm_client import LlmError
from .routing import run_routing_turn
from .schemas import ChatRequest, ChatResponse

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/message", response_model=ChatResponse)
def chat_message(payload: ChatRequest) -> ChatResponse:
    if not payload.messages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="messages must not be empty",
        )

    try:
        if payload.documentId is None:
            routing = run_routing_turn(payload.messages)
            if routing.documentId is None:
                return ChatResponse(
                    reply=routing.reply,
                    documentId=None,
                    suggestedDocumentId=routing.suggestedDocumentId,
                    fields={},
                    isComplete=False,
                )

            # The routing turn only identifies the document type and cannot return
            # field data (its structured-output schema has no field properties), so
            # run the extraction turn immediately against the same messages instead
            # of waiting for the next request - otherwise anything the user already
            # stated about the document (parties, dates, terms, ...) in the message
            # that triggered routing would be silently discarded.
            definition = REGISTRY[routing.documentId]
            reply, merged, is_complete = run_turn(
                definition, payload.messages, definition.partial_model()
            )
            return ChatResponse(
                reply=reply,
                documentId=routing.documentId,
                suggestedDocumentId=None,
                fields=merged.model_dump(),
                isComplete=is_complete,
            )

        definition = REGISTRY.get(payload.documentId)
        if definition is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown documentId: {payload.documentId}",
            )

        current_fields = definition.partial_model(**payload.fields)
        reply, merged, is_complete = run_turn(definition, payload.messages, current_fields)
    except LlmError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="AI service unavailable, please try again.",
        )

    return ChatResponse(
        reply=reply,
        documentId=payload.documentId,
        fields=merged.model_dump(),
        isComplete=is_complete,
    )
