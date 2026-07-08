import { useState } from "react";
import type { ChatMessage } from "@/lib/chat-types";
import { postNdaChatTurn } from "@/lib/nda-chat-client";
import type { PartialNdaFormData } from "@/lib/nda-types";

export function useNdaChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [fields, setFields] = useState<PartialNdaFormData>({});
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
      const response = await postNdaChatTurn({ messages: nextMessages, fields });
      setMessages([...nextMessages, { role: "assistant", content: response.reply }]);
      setFields(response.fields);
      setIsComplete(response.isComplete);
    } catch {
      setError("Something went wrong talking to the assistant. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return { messages, fields, isComplete, isLoading, error, sendMessage };
}
