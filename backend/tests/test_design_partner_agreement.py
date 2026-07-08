from prelegal_backend.documents.design_partner_agreement import (
    DESIGN_PARTNER_AGREEMENT,
    resolve_variables,
)
from prelegal_backend.schemas import PartialPartyInfo


def test_design_partner_agreement_has_provider_and_partner_roles():
    assert [role.label for role in DESIGN_PARTNER_AGREEMENT.party_roles] == ["Provider", "Partner"]


def test_design_partner_agreement_template_path_exists():
    from prelegal_backend.documents.registry import TEMPLATES_DIR

    assert (TEMPLATES_DIR / DESIGN_PARTNER_AGREEMENT.template_path).is_file()


def test_resolve_variables_covers_every_field_referenced_in_the_field_guide():
    data = DESIGN_PARTNER_AGREEMENT.partial_model(
        provider=PartialPartyInfo(companyName="Acme Inc"),
        partner=PartialPartyInfo(companyName="Globex Corp"),
        term="6 months",
        program="Early Access",
    )
    variables = resolve_variables(data)

    assert variables["Provider"] == "Acme Inc"
    assert variables["Partner"] == "Globex Corp"
    assert variables["Term"] == "6 months"
    assert variables["Program"] == "Early Access"
