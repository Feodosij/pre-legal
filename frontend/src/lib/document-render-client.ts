import type { RenderedDocument } from "./rendered-document-types";

export async function fetchRenderedDocument(
  documentId: string,
  fields: Record<string, unknown>
): Promise<RenderedDocument> {
  const response = await fetch(`/api/documents/${documentId}/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });

  if (!response.ok) {
    throw new Error(`Document render request failed with status ${response.status}`);
  }

  return response.json();
}
