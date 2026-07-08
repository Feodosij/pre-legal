from fastapi import APIRouter, HTTPException, status

from .documents.registry import REGISTRY
from .documents.render import RenderedDocument, render_document

router = APIRouter(prefix="/api/documents", tags=["documents"])


@router.post("/{document_id}/render", response_model=RenderedDocument)
def render(document_id: str, fields: dict) -> RenderedDocument:
    definition = REGISTRY.get(document_id)
    if definition is None or definition.template_path is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No generic renderer available for '{document_id}'",
        )

    return render_document(document_id, fields)
