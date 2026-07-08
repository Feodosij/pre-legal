import type { DocumentDetail, DocumentSummary } from "./document-types";

async function parseJsonOrThrow<T>(response: Response, fallback: string): Promise<T> {
  if (!response.ok) {
    throw new Error(fallback);
  }
  return response.json();
}

export async function createDocument(
  documentId: string,
  fields: Record<string, unknown>,
  isComplete: boolean
): Promise<DocumentDetail> {
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId, fields, isComplete }),
  });
  return parseJsonOrThrow(response, "Could not save your document.");
}

export async function updateDocument(
  id: number,
  fields: Record<string, unknown>,
  isComplete: boolean
): Promise<DocumentDetail> {
  const response = await fetch(`/api/documents/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fields, isComplete }),
  });
  return parseJsonOrThrow(response, "Could not update your document.");
}

export async function listDocuments(): Promise<DocumentSummary[]> {
  const response = await fetch("/api/documents");
  return parseJsonOrThrow(response, "Could not load your documents.");
}

export async function getDocument(id: number): Promise<DocumentDetail> {
  const response = await fetch(`/api/documents/${id}`);
  return parseJsonOrThrow(response, "Could not load this document.");
}
