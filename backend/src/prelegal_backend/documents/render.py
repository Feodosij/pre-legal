import re

from pydantic import BaseModel

from ..schemas import PartialPartyInfo
from .registry import REGISTRY, TEMPLATES_DIR
from .types import DocumentDefinition


class Subsection(BaseModel):
    title: str | None
    body: str


class Section(BaseModel):
    title: str
    subsections: list[Subsection]


class PartyRow(BaseModel):
    label: str
    values: list[str]


class CoverFieldValue(BaseModel):
    label: str
    value: str


class RenderedDocument(BaseModel):
    title: str
    partyRoleLabels: list[str]
    partyRows: list[PartyRow]
    coverFields: list[CoverFieldValue]
    sections: list[Section]


_POSSESSIVE_SUFFIXES = ("’s", "'s")

_TOP_LEVEL_RE = re.compile(r"^\d+\.\s+(.*)$")
_HEADER2_RE = re.compile(r'<span class="header_2"[^>]*>(.*?)</span>\s*(.*)$')
_HEADER3_RE = re.compile(r'<span class="header_3"[^>]*>(.*?)</span>\s*(.*)$')
_EMPTY_SPAN_RE = re.compile(r"<span[^>]*></span>\s*")
_TAG_RE = re.compile(r"<[^>]+>")

_PARTY_ROW_SPEC = [
    ("Company Name", lambda party: party.companyName),
    ("Print Name", lambda party: party.printName),
    ("Title", lambda party: party.title),
    ("Notice Address", lambda party: party.noticeAddress),
]


def _strip_tags(text: str) -> str:
    return _TAG_RE.sub("", text).strip()


def _span_pattern(span_class: str) -> re.Pattern:
    return re.compile(rf'<span class="{re.escape(span_class)}">([^<]+)</span>')


def substitute_variables(text: str, definition: DocumentDefinition, data: BaseModel) -> str:
    if definition.span_class is None or definition.resolve_variables is None:
        return text

    variables = definition.resolve_variables(data)
    pattern = _span_pattern(definition.span_class)

    def repl(match: re.Match) -> str:
        label = match.group(1)
        base_label, suffix = label, ""
        for possessive in _POSSESSIVE_SUFFIXES:
            if label.endswith(possessive):
                base_label, suffix = label[: -len(possessive)], possessive
                break
        value = variables.get(base_label)
        return match.group(0) if value is None else value + suffix

    return pattern.sub(repl, text)


def parse_sections(text: str) -> list[Section]:
    sections: list[Section] = []
    current_section: Section | None = None
    current_title: str | None = None
    current_body_lines: list[str] = []
    has_open_subsection = False

    def flush_subsection() -> None:
        nonlocal current_title, current_body_lines, has_open_subsection
        if current_section is not None and has_open_subsection:
            body = "\n".join(line for line in current_body_lines if line).strip()
            current_section.subsections.append(Subsection(title=current_title, body=body))
        current_title = None
        current_body_lines = []
        has_open_subsection = False

    for raw_line in text.splitlines():
        if not raw_line.strip():
            continue
        indent = len(raw_line) - len(raw_line.lstrip(" "))
        content = raw_line.strip()

        if indent == 0:
            top_match = _TOP_LEVEL_RE.match(content)
            header2_match = _HEADER2_RE.search(top_match.group(1)) if top_match else None
            if header2_match:
                flush_subsection()
                if current_section is not None:
                    sections.append(current_section)
                current_section = Section(title=_strip_tags(header2_match.group(1)), subsections=[])
                continue
            if content.startswith("#"):
                continue

        if indent == 4:
            sub_match = _TOP_LEVEL_RE.match(content)
            if sub_match:
                flush_subsection()
                has_open_subsection = True
                inner = sub_match.group(1)
                header3_match = _HEADER3_RE.search(inner)
                if header3_match:
                    current_title = _strip_tags(header3_match.group(1)).rstrip(".")
                    remainder = header3_match.group(2)
                else:
                    remainder = _EMPTY_SPAN_RE.sub("", inner)
                if remainder.strip():
                    current_body_lines.append(remainder.strip())
                continue

        current_body_lines.append(content)

    flush_subsection()
    if current_section is not None:
        sections.append(current_section)

    return sections


def build_party_rows(definition: DocumentDefinition, data: BaseModel) -> list[PartyRow]:
    parties = [getattr(data, role.field_name) or PartialPartyInfo() for role in definition.party_roles]
    return [
        PartyRow(
            label=label,
            values=[getter(party) or f"[{label}]" for party in parties],
        )
        for label, getter in _PARTY_ROW_SPEC
    ]


def render_document(document_id: str, fields: dict) -> RenderedDocument:
    definition = REGISTRY[document_id]
    if definition.template_path is None:
        raise ValueError(f"Document '{document_id}' has no generic renderer")

    data = definition.partial_model(**fields)
    raw_text = (TEMPLATES_DIR / definition.template_path).read_text()
    substituted = substitute_variables(raw_text, definition, data)

    return RenderedDocument(
        title=definition.name,
        partyRoleLabels=[role.label for role in definition.party_roles],
        partyRows=build_party_rows(definition, data),
        coverFields=[
            CoverFieldValue(label=cf.label, value=cf.getter(data)) for cf in definition.cover_fields
        ],
        sections=parse_sections(substituted),
    )
