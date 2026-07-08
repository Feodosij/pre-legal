export interface DocumentSummary {
  id: number;
  documentId: string;
  title: string;
  isComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDetail extends DocumentSummary {
  fields: Record<string, unknown>;
}
