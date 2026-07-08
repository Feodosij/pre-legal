from pathlib import Path

from pydantic import BaseModel

from ..schemas import PartialPartyInfo
from .types import CoverField, DocumentDefinition, PartyRole, fallback, notice_address_variable

TEMPLATE_PATH = Path("design-partner-agreement/design-partner-agreement.md")

FIELD_GUIDE = """You are an assistant helping a user fill out a Common Paper Design \
Partner Agreement, which gives a Partner early access to a Provider's product in \
exchange for feedback and participation in a design partner program. Have a natural, \
free-form conversation to collect the following fields. Ask about a few related \
fields at a time rather than one at a time, and never re-ask for a field that already \
has a value below.

Fields to collect:
- provider / partner: each needs companyName, printName (signer's name), title \
(signer's job title), noticeAddress (email or postal address)
- term: how long the agreement lasts (e.g. "6 months")
- program: a short description of the design partner program
- fees: any fees the partner pays, or "none" if free
- effectiveDate: ISO date (yyyy-mm-dd) the agreement starts
- governingLaw: the state whose law governs the agreement
- chosenCourts: the courts with jurisdiction over disputes

Only set a field in your response when you are confident of its value from the \
conversation so far; leave it null otherwise, never guess. Set isComplete to true \
only once every field above has a known value and you have summarized them back to \
the user for confirmation.

Known values so far:
{current_fields_json}
"""


class PartialDesignPartnerFormData(BaseModel):
    provider: PartialPartyInfo | None = None
    partner: PartialPartyInfo | None = None
    term: str | None = None
    program: str | None = None
    fees: str | None = None
    effectiveDate: str | None = None
    governingLaw: str | None = None
    chosenCourts: str | None = None


class DesignPartnerExtraction(PartialDesignPartnerFormData):
    reply: str
    isComplete: bool


PARTY_ROLES = (
    PartyRole(field_name="provider", label="Provider"),
    PartyRole(field_name="partner", label="Partner"),
)

COVER_FIELDS = (
    CoverField(label="Term", getter=lambda d: fallback(d.term, "Term")),
    CoverField(label="Program", getter=lambda d: fallback(d.program, "Program")),
    CoverField(label="Fees", getter=lambda d: fallback(d.fees, "Fees")),
    CoverField(
        label="Effective Date", getter=lambda d: fallback(d.effectiveDate, "Effective Date")
    ),
    CoverField(label="Governing Law", getter=lambda d: fallback(d.governingLaw, "Governing Law")),
    CoverField(label="Chosen Courts", getter=lambda d: fallback(d.chosenCourts, "Chosen Courts")),
)


def resolve_variables(data: PartialDesignPartnerFormData) -> dict[str, str]:
    variables = {cover_field.label: cover_field.getter(data) for cover_field in COVER_FIELDS}
    for role in PARTY_ROLES:
        party = getattr(data, role.field_name) or PartialPartyInfo()
        variables[role.label] = fallback(party.companyName, role.label)
    variables["Notice Address"] = notice_address_variable(PARTY_ROLES, data)
    return variables


DESIGN_PARTNER_AGREEMENT = DocumentDefinition(
    id="design-partner-agreement",
    name="Design Partner Agreement",
    field_guide=FIELD_GUIDE,
    partial_model=PartialDesignPartnerFormData,
    extraction_model=DesignPartnerExtraction,
    party_roles=PARTY_ROLES,
    cover_fields=COVER_FIELDS,
    template_path=TEMPLATE_PATH,
    span_class="keyterms_link",
    resolve_variables=resolve_variables,
)
