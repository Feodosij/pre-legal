import pytest
from pydantic import ValidationError

from prelegal_backend.documents.mutual_nda import MUTUAL_NDA, NdaExtraction


def test_nda_extraction_rejects_mnda_term_outside_the_allowed_literals():
    with pytest.raises(ValidationError):
        NdaExtraction(reply="ok", isComplete=False, mndaTerm="Expires")


def test_nda_extraction_rejects_confidentiality_term_outside_the_allowed_literals():
    with pytest.raises(ValidationError):
        NdaExtraction(reply="ok", isComplete=False, confidentialityTerm="perpetual")


def test_mutual_nda_definition_has_two_party_roles():
    assert [role.field_name for role in MUTUAL_NDA.party_roles] == ["partyOne", "partyTwo"]
