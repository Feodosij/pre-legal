import json
import sqlite3

from fastapi import APIRouter, Depends, HTTPException, status

from .db import get_connection
from .documents.registry import REGISTRY
from .documents.render import RenderedDocument, render_document
from .documents.types import DocumentDefinition
from .schemas import (
    DocumentCreateRequest,
    DocumentResponse,
    DocumentSummary,
    DocumentUpdateRequest,
    UserResponse,
)
from .sessions import get_current_user

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


def _derive_title(definition: DocumentDefinition, fields: dict) -> str:
    party_names = []
    for role in definition.party_roles:
        party = fields.get(role.field_name) or {}
        company_name = party.get("companyName") if isinstance(party, dict) else None
        if company_name:
            party_names.append(company_name)

    if party_names:
        return f"{definition.name}: {' & '.join(party_names)}"
    return definition.name


def _row_to_response(row: sqlite3.Row) -> DocumentResponse:
    return DocumentResponse(
        id=row["id"],
        documentId=row["document_id"],
        title=row["title"],
        fields=json.loads(row["fields_json"]),
        isComplete=bool(row["is_complete"]),
        createdAt=row["created_at"],
        updatedAt=row["updated_at"],
    )


@router.post("", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
def create_document(
    payload: DocumentCreateRequest, user: UserResponse = Depends(get_current_user)
) -> DocumentResponse:
    definition = REGISTRY.get(payload.documentId)
    if definition is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown documentId: {payload.documentId}",
        )

    title = _derive_title(definition, payload.fields)
    with get_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO documents (user_id, document_id, title, fields_json, is_complete)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user.id, payload.documentId, title, json.dumps(payload.fields), int(payload.isComplete)),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (cursor.lastrowid,)).fetchone()

    return _row_to_response(row)


@router.get("", response_model=list[DocumentSummary])
def list_documents(user: UserResponse = Depends(get_current_user)) -> list[DocumentSummary]:
    with get_connection() as conn:
        rows = conn.execute(
            "SELECT * FROM documents WHERE user_id = ? ORDER BY updated_at DESC",
            (user.id,),
        ).fetchall()

    return [
        DocumentSummary(
            id=row["id"],
            documentId=row["document_id"],
            title=row["title"],
            isComplete=bool(row["is_complete"]),
            createdAt=row["created_at"],
            updatedAt=row["updated_at"],
        )
        for row in rows
    ]


@router.get("/{doc_id}", response_model=DocumentResponse)
def get_document(doc_id: int, user: UserResponse = Depends(get_current_user)) -> DocumentResponse:
    with get_connection() as conn:
        row = conn.execute(
            "SELECT * FROM documents WHERE id = ? AND user_id = ?", (doc_id, user.id)
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    return _row_to_response(row)


@router.put("/{doc_id}", response_model=DocumentResponse)
def update_document(
    doc_id: int,
    payload: DocumentUpdateRequest,
    user: UserResponse = Depends(get_current_user),
) -> DocumentResponse:
    with get_connection() as conn:
        existing = conn.execute(
            "SELECT * FROM documents WHERE id = ? AND user_id = ?", (doc_id, user.id)
        ).fetchone()
        if existing is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Document not found."
            )

        definition = REGISTRY[existing["document_id"]]
        title = _derive_title(definition, payload.fields)
        conn.execute(
            """
            UPDATE documents
            SET fields_json = ?, title = ?, is_complete = ?, updated_at = datetime('now')
            WHERE id = ?
            """,
            (json.dumps(payload.fields), title, int(payload.isComplete), doc_id),
        )
        conn.commit()
        row = conn.execute("SELECT * FROM documents WHERE id = ?", (doc_id,)).fetchone()

    return _row_to_response(row)
