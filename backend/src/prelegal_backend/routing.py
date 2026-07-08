import json
from typing import Literal

from pydantic import BaseModel

from .documents.registry import REGISTRY, load_catalog
from .llm_client import call_structured
from .schemas import ChatMessage

SUPPORTED_IDS = tuple(REGISTRY.keys())

ROUTING_PROMPT_TEMPLATE = """You help users draft legal agreements from a catalog of \
document templates. Figure out which document the user wants.

You can currently draft these document types (set documentId to one of these ids \
once you know which one the user wants):
{supported_json}

The full catalog of document types we know about (for reference, most are NOT yet \
draftable) is:
{catalog_json}

If the user's request clearly matches one of the draftable document types, set \
documentId to its id and reply with a short confirmation that invites them to start \
describing the deal. If the user's request is unclear, ask a clarifying question and \
leave documentId null. If the user wants a document type we cannot draft, leave \
documentId null, set suggestedDocumentId to the id of whichever draftable document is \
the closest match, and explain in reply that we can't generate their exact request \
but offer the closest alternative.
"""


class RoutingExtraction(BaseModel):
    reply: str
    documentId: Literal[*SUPPORTED_IDS] | None = None
    suggestedDocumentId: str | None = None


def build_routing_prompt() -> str:
    supported = [
        {"id": definition.id, "name": definition.name} for definition in REGISTRY.values()
    ]
    catalog = [
        {"id": item["id"], "name": item["name"], "description": item["description"]}
        for item in load_catalog()
    ]
    return ROUTING_PROMPT_TEMPLATE.format(
        supported_json=json.dumps(supported),
        catalog_json=json.dumps(catalog),
    )


def run_routing_turn(messages: list[ChatMessage]) -> RoutingExtraction:
    llm_messages = [{"role": "system", "content": build_routing_prompt()}]
    llm_messages += [{"role": message.role, "content": message.content} for message in messages]
    return call_structured(llm_messages, RoutingExtraction)
