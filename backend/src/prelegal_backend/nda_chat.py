from .llm_client import call_structured
from .schemas import ChatMessage, PartialNdaFormData, PartialPartyInfo

FIELD_GUIDE = """You are an assistant helping a user fill out a Common Paper Mutual \
Non-Disclosure Agreement (Mutual NDA). Have a natural, free-form conversation to \
collect the following fields. Ask about a few related fields at a time rather than \
one at a time, and never re-ask for a field that already has a value below.

Fields to collect:
- partyOne / partyTwo: each needs companyName, printName (signer's name), title \
(signer's job title), noticeAddress (email or postal address)
- purpose: why the parties are sharing confidential information
- effectiveDate: ISO date (yyyy-mm-dd) the agreement starts
- mndaTerm: "expires" (with mndaTermYears, an integer) or "untilTerminated"
- confidentialityTerm: "years" (with confidentialityTermYears, an integer) or "perpetuity"
- governingLaw: the state whose law governs the agreement
- jurisdiction: the courts with jurisdiction over disputes
- modifications: any optional custom changes to the standard terms (may stay empty)

Only set a field in your response when you are confident of its value from the \
conversation so far; leave it null otherwise, never guess. Set isComplete to true \
only once every field above (except the optional modifications) has a known value \
and you have summarized them back to the user for confirmation.

Known values so far:
{current_fields_json}
"""


class NdaExtraction(PartialNdaFormData):
    reply: str
    isComplete: bool


_SCALAR_FIELDS = [
    "purpose",
    "effectiveDate",
    "mndaTerm",
    "mndaTermYears",
    "confidentialityTerm",
    "confidentialityTermYears",
    "governingLaw",
    "jurisdiction",
    "modifications",
]
_PARTY_FIELDS = ["partyOne", "partyTwo"]


def merge_fields(current: PartialNdaFormData, extracted: NdaExtraction) -> PartialNdaFormData:
    merged = current.model_dump()

    for field in _SCALAR_FIELDS:
        value = getattr(extracted, field)
        if value is not None:
            merged[field] = value

    for field in _PARTY_FIELDS:
        extracted_party = getattr(extracted, field)
        if extracted_party is None:
            continue
        current_party = (getattr(current, field) or PartialPartyInfo()).model_dump()
        for key, value in extracted_party.model_dump().items():
            if value is not None:
                current_party[key] = value
        merged[field] = current_party

    return PartialNdaFormData(**merged)


def build_system_prompt(current_fields: PartialNdaFormData) -> str:
    return FIELD_GUIDE.format(
        current_fields_json=current_fields.model_dump_json(exclude_none=True)
    )


def run_turn(
    messages: list[ChatMessage], current_fields: PartialNdaFormData
) -> tuple[str, PartialNdaFormData, bool]:
    llm_messages = [{"role": "system", "content": build_system_prompt(current_fields)}]
    llm_messages += [{"role": message.role, "content": message.content} for message in messages]

    extraction = call_structured(llm_messages, NdaExtraction)
    merged = merge_fields(current_fields, extraction)
    return extraction.reply, merged, extraction.isComplete
