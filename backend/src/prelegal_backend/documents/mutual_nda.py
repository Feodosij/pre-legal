from ..schemas import PartialNdaFormData
from .types import DocumentDefinition, PartyRole

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


MUTUAL_NDA = DocumentDefinition(
    id="mutual-nda",
    name="Mutual Non-Disclosure Agreement",
    field_guide=FIELD_GUIDE,
    partial_model=PartialNdaFormData,
    extraction_model=NdaExtraction,
    party_roles=(
        PartyRole(field_name="partyOne", label="Party One"),
        PartyRole(field_name="partyTwo", label="Party Two"),
    ),
    cover_fields=(),
)
