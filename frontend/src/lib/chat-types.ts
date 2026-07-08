import type { PartialNdaFormData } from "./nda-types";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface NdaChatRequest {
  messages: ChatMessage[];
  fields: PartialNdaFormData;
}

export interface NdaChatResponse {
  reply: string;
  fields: PartialNdaFormData;
  isComplete: boolean;
}
