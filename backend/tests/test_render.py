from pydantic import BaseModel

from prelegal_backend.documents import render
from prelegal_backend.documents.pilot_agreement import PILOT_AGREEMENT, PartialPilotFormData
from prelegal_backend.documents.types import CoverField, DocumentDefinition, PartyRole
from prelegal_backend.schemas import PartialPartyInfo


class PartialFakeFormData(BaseModel):
    provider: PartialPartyInfo | None = None
    someTerm: str | None = None


FAKE_DEFINITION = DocumentDefinition(
    id="fake-doc",
    name="Fake Document",
    field_guide="",
    partial_model=PartialFakeFormData,
    extraction_model=PartialFakeFormData,
    party_roles=(PartyRole(field_name="provider", label="Provider"),),
    cover_fields=(CoverField(label="Some Term", getter=lambda d: d.someTerm or "[Some Term]"),),
    span_class="orderform_link",
    resolve_variables=lambda d: {
        "Provider": (d.provider or PartialPartyInfo()).companyName or "[Provider]",
        "Some Term": d.someTerm or "[Some Term]",
    },
)


def test_substitute_variables_replaces_known_span_and_handles_possessive():
    text = (
        '<span class="orderform_link">Provider</span> owns the product. '
        '<span class="orderform_link">Provider\'s</span> rights survive.'
    )
    data = PartialFakeFormData(provider=PartialPartyInfo(companyName="Acme Inc"))

    result = render.substitute_variables(text, FAKE_DEFINITION, data)

    assert result == "Acme Inc owns the product. Acme Inc's rights survive."


def test_substitute_variables_falls_back_to_raw_span_for_unknown_label():
    text = '<span class="orderform_link">Totally Unknown</span> stays as-is.'
    result = render.substitute_variables(text, FAKE_DEFINITION, PartialFakeFormData())
    assert result == text


def test_parse_sections_groups_titled_and_untitled_subsections():
    text = """# Fake Document

1. <span class="header_2" id="1">First Section</span>
    1. <span class="header_3" id="1.1">Access.</span>  Some body text about access.
    2. <span class="header_3" id="1.2">Restrictions.</span>  Some restriction text.
        a. sub-bullet one
        b. sub-bullet two
2. <span class="header_2" id="2">Definitions</span>
    1. <span id="2.1"></span>**"Term"** means something.
"""
    sections = render.parse_sections(text)

    assert len(sections) == 2
    assert sections[0].title == "First Section"
    assert sections[0].subsections[0].title == "Access"
    assert "Some body text about access." in sections[0].subsections[0].body
    assert sections[0].subsections[1].title == "Restrictions"
    assert "sub-bullet one" in sections[0].subsections[1].body
    assert sections[1].title == "Definitions"
    assert sections[1].subsections[0].title is None
    assert '**"Term"** means something.' in sections[1].subsections[0].body


def test_build_party_rows_uses_bracket_fallback_for_missing_values():
    data = PartialFakeFormData(provider=PartialPartyInfo(companyName="Acme Inc"))
    rows = render.build_party_rows(FAKE_DEFINITION, data)

    company_row = next(row for row in rows if row.label == "Company Name")
    title_row = next(row for row in rows if row.label == "Title")
    assert company_row.values == ["Acme Inc"]
    assert title_row.values == ["[Title]"]


def test_render_document_against_the_real_pilot_agreement_template():
    fields = {
        "provider": {"companyName": "Acme Inc"},
        "customer": {"companyName": "Globex Corp"},
        "pilotPeriod": "90 days",
        "effectiveDate": "2026-01-01",
        "generalCapAmount": "$10,000",
        "governingLaw": "Delaware",
        "chosenCourts": "courts located in New Castle, DE",
    }

    rendered = render.render_document("pilot-agreement", fields)

    assert rendered.title == PILOT_AGREEMENT.name
    assert rendered.partyRoleLabels == ["Provider", "Customer"]
    assert any(s.title == "Pilot Access" for s in rendered.sections)
    access_section = next(s for s in rendered.sections if s.title == "Pilot Access")
    access_subsection = next(s for s in access_section.subsections if s.title == "Access and Use")
    assert "Globex Corp" in access_subsection.body
    assert "90 days" in access_subsection.body
    assert '<span class="orderform_link">' not in access_subsection.body
