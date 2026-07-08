import json
import os
from functools import lru_cache
from pathlib import Path

from .design_partner_agreement import DESIGN_PARTNER_AGREEMENT
from .mutual_nda import MUTUAL_NDA
from .pilot_agreement import PILOT_AGREEMENT
from .types import DocumentDefinition

REGISTRY: dict[str, DocumentDefinition] = {
    definition.id: definition
    for definition in (MUTUAL_NDA, PILOT_AGREEMENT, DESIGN_PARTNER_AGREEMENT)
}

TEMPLATES_DIR = Path(os.environ.get("PRELEGAL_TEMPLATES_DIR", "templates"))
CATALOG_PATH = Path(os.environ.get("PRELEGAL_CATALOG_PATH", "catalog.json"))


@lru_cache
def load_catalog() -> list[dict]:
    return json.loads(CATALOG_PATH.read_text())["templates"]
