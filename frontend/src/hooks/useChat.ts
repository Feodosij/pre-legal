import { useState } from "react";
import { postChatTurn } from "@/lib/chat-client";
import type { ChatMessage } from "@/lib/chat-types";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [suggestedDocumentId, setSuggestedDocumentId] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, unknown>>({});
  const [isComplete, setIsComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const nextMessages = [...messages, { role: "user" as const, content: trimmed }];
    setMessages(nextMessages);
    setError(null);
    setIsLoading(true);

    try {
      const response = await postChatTurn({ messages: nextMessages, documentId, fields });
      setMessages([...nextMessages, { role: "assistant", content: response.reply }]);
      setDocumentId(response.documentId);
      setSuggestedDocumentId(response.suggestedDocumentId);
      setFields(response.fields);
      setIsComplete(response.isComplete);
    } catch {
      setError("Something went wrong talking to the assistant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return {
    messages,
    documentId,
    suggestedDocumentId,
    fields,
    isComplete,
    isLoading,
    error,
    sendMessage,
  };
}
