from prelegal_backend.documents.pilot_agreement import PILOT_AGREEMENT, resolve_variables
from prelegal_backend.schemas import PartialPartyInfo


def test_pilot_agreement_has_provider_and_customer_roles():
    assert [role.label for role in PILOT_AGREEMENT.party_roles] == ["Provider", "Customer"]


def test_pilot_agreement_template_path_exists():
    from prelegal_backend.documents.registry import TEMPLATES_DIR

    assert (TEMPLATES_DIR / PILOT_AGREEMENT.template_path).is_file()


def test_resolve_variables_covers_every_field_referenced_in_the_field_guide():
    data = PILOT_AGREEMENT.partial_model(
        provider=PartialPartyInfo(companyName="Acme Inc"),
        customer=PartialPartyInfo(companyName="Globex Corp"),
        pilotPeriod="90 days",
        generalCapAmount="$10,000",
    )
    variables = resolve_variables(data)

    assert variables["Provider"] == "Acme Inc"
    assert variables["Customer"] == "Globex Corp"
    assert variables["Pilot Period"] == "90 days"
    assert "Acme Inc" in variables["Notice Address"]
    assert "Globex Corp" in variables["Notice Address"]
