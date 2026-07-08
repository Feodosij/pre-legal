from prelegal_backend.documents.types import PartyRole, fallback, notice_address_variable
from prelegal_backend.schemas import PartialPartyInfo


def test_fallback_returns_value_when_present():
    assert fallback("Delaware", "Governing Law") == "Delaware"


def test_fallback_returns_bracketed_label_when_missing():
    assert fallback(None, "Governing Law") == "[Governing Law]"


def test_notice_address_variable_combines_all_party_roles():
    from pydantic import BaseModel

    class Data(BaseModel):
        provider: PartialPartyInfo | None = None
        customer: PartialPartyInfo | None = None

    roles = (
        PartyRole(field_name="provider", label="Provider"),
        PartyRole(field_name="customer", label="Customer"),
    )
    data = Data(
        provider=PartialPartyInfo(companyName="Acme Inc", noticeAddress="acme@example.com"),
        customer=PartialPartyInfo(companyName="Globex Corp"),
    )

    result = notice_address_variable(roles, data)

    assert result == (
        "Acme Inc: acme@example.com; Globex Corp: [Customer Notice Address]"
    )
