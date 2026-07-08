from collections.abc import Callable
from dataclasses import dataclass
from pathlib import Path

from pydantic import BaseModel

from ..schemas import PartialPartyInfo


@dataclass(frozen=True)
class PartyRole:
    field_name: str
    label: str


@dataclass(frozen=True)
class CoverField:
    label: str
    getter: Callable[[BaseModel], str]


@dataclass(frozen=True)
class DocumentDefinition:
    id: str
    name: str
    field_guide: str
    partial_model: type[BaseModel]
    extraction_model: type[BaseModel]
    party_roles: tuple[PartyRole, ...]
    cover_fields: tuple[CoverField, ...]
    template_path: Path | None = None
    span_class: str | None = None
    resolve_variables: Callable[[BaseModel], dict[str, str]] | None = None


def fallback(value: str | None, label: str) -> str:
    return value or f"[{label}]"


def notice_address_variable(party_roles: tuple[PartyRole, ...], data: BaseModel) -> str:
    parts = []
    for role in party_roles:
        party = getattr(data, role.field_name) or PartialPartyInfo()
        parts.append(
            f"{fallback(party.companyName, role.label)}: "
            f"{fallback(party.noticeAddress, f'{role.label} Notice Address')}"
        )
    return "; ".join(parts)
