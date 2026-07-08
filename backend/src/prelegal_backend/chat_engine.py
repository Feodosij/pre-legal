from pydantic import BaseModel

from .documents.types import DocumentDefinition
from .llm_client import call_structured
from .schemas import ChatMessage, PartialPartyInfo


def merge_fields(
    current: BaseModel, extracted: BaseModel, definition: DocumentDefinition
) -> BaseModel:
    merged = current.model_dump()
    party_field_names = {role.field_name for role in definition.party_roles}

    for field_name in definition.partial_model.model_fields:
        extracted_value = getattr(extracted, field_name)

        if field_name in party_field_names:
            if extracted_value is None:
                continue
            current_party = (getattr(current, field_name) or PartialPartyInfo()).model_dump()
            for key, value in extracted_value.model_dump().items():
                if value is not None:
                    current_party[key] = value
            merged[field_name] = current_party
        elif extracted_value is not None:
            merged[field_name] = extracted_value

    return definition.partial_model(**merged)


def build_system_prompt(definition: DocumentDefinition, current_fields: BaseModel) -> str:
    return definition.field_guide.format(
        current_fields_json=current_fields.model_dump_json(exclude_none=True)
    )


def run_turn(
    definition: DocumentDefinition,
    messages: list[ChatMessage],
    current_fields: BaseModel,
) -> tuple[str, BaseModel, bool]:
    llm_messages = [{"role": "system", "content": build_system_prompt(definition, current_fields)}]
    llm_messages += [{"role": message.role, "content": message.content} for message in messages]

    extraction = call_structured(llm_messages, definition.extraction_model)
    merged = merge_fields(current_fields, extraction, definition)
    return extraction.reply, merged, extraction.isComplete
