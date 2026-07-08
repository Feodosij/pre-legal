from pathlib import Path

from pydantic import BaseModel

from ..schemas import PartialPartyInfo
from .types import CoverField, DocumentDefinition, PartyRole, fallback, notice_address_variable

TEMPLATE_PATH = Path("pilot-agreement/Pilot-Agreement.md")

FIELD_GUIDE = """You are an assistant helping a user fill out a Common Paper Pilot \
Agreement, which grants a Customer limited-time access to a Provider's product to \
evaluate it. Have a natural, free-form conversation to collect the following fields. \
Ask about a few related fields at a time rather than one at a time, and never re-ask \
for a field that already has a value below.

Fields to collect:
- provider / customer: each needs companyName, printName (signer's name), title \
(signer's job title), noticeAddress (email or postal address)
- pilotPeriod: how long the pilot lasts (e.g. "90 days")
- effectiveDate: ISO date (yyyy-mm-dd) the agreement starts
- generalCapAmount: the liability cap amount (e.g. "$10,000" or "the Fees paid")
- governingLaw: the state whose law governs the agreement
- chosenCourts: the courts with jurisdiction over disputes

Only set a field in your response when you are confident of its value from the \
conversation so far; leave it null otherwise, never guess. Set isComplete to true \
only once every field above has a known value and you have summarized them back to \
the user for confirmation.

Known values so far:
{current_fields_json}
"""


class PartialPilotFormData(BaseModel):
    provider: PartialPartyInfo | None = None
    customer: PartialPartyInfo | None = None
    pilotPeriod: str | None = None
    effectiveDate: str | None = None
    generalCapAmount: str | None = None
    governingLaw: str | None = None
    chosenCourts: str | None = None


class PilotExtraction(PartialPilotFormData):
    reply: str
    isComplete: bool


PARTY_ROLES = (
    PartyRole(field_name="provider", label="Provider"),
    PartyRole(field_name="customer", label="Customer"),
)

COVER_FIELDS = (
    CoverField(label="Pilot Period", getter=lambda d: fallback(d.pilotPeriod, "Pilot Period")),
    CoverField(
        label="Effective Date", getter=lambda d: fallback(d.effectiveDate, "Effective Date")
    ),
    CoverField(
        label="General Cap Amount",
        getter=lambda d: fallback(d.generalCapAmount, "General Cap Amount"),
    ),
    CoverField(label="Governing Law", getter=lambda d: fallback(d.governingLaw, "Governing Law")),
    CoverField(label="Chosen Courts", getter=lambda d: fallback(d.chosenCourts, "Chosen Courts")),
)


def resolve_variables(data: PartialPilotFormData) -> dict[str, str]:
    variables = {cover_field.label: cover_field.getter(data) for cover_field in COVER_FIELDS}
    for role in PARTY_ROLES:
        party = getattr(data, role.field_name) or PartialPartyInfo()
        variables[role.label] = fallback(party.companyName, role.label)
    variables["Notice Address"] = notice_address_variable(PARTY_ROLES, data)
    return variables


PILOT_AGREEMENT = DocumentDefinition(
    id="pilot-agreement",
    name="Pilot Agreement",
    field_guide=FIELD_GUIDE,
    partial_model=PartialPilotFormData,
    extraction_model=PilotExtraction,
    party_roles=PARTY_ROLES,
    cover_fields=COVER_FIELDS,
    template_path=TEMPLATE_PATH,
    span_class="orderform_link",
    resolve_variables=resolve_variables,
)
