export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  documentId: string | null;
  fields: Record<string, unknown>;
}

export interface ChatResponse {
  reply: string;
  documentId: string | null;
  suggestedDocumentId: string | null;
  fields: Record<string, unknown>;
  isComplete: boolean;
}
