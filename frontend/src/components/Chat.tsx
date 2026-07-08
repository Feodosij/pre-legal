"use client";

import { useEffect, useState } from "react";
import { useChat } from "@/hooks/useChat";

interface ChatProps {
  onComplete: (documentId: string, fields: Record<string, unknown>) => void;
  onReview: (documentId: string, fields: Record<string, unknown>) => void;
  isPreparingDocument?: boolean;
}

export default function Chat({ onComplete, onReview, isPreparingDocument = false }: ChatProps) {
  const { messages, documentId, fields, isComplete, isLoading, error, sendMessage } = useChat();
  const [input, setInput] = useState("");

  useEffect(() => {
    if (isComplete && documentId) {
      onComplete(documentId, fields);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isComplete]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const text = input;
    setInput("");
    sendMessage(text);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-3">
        <div className="mr-8 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Hi! What kind of legal document do you need today? Tell me a bit about the
          deal and I&apos;ll help you draft it.
        </div>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`rounded-lg px-4 py-3 text-sm ${
              message.role === "user"
                ? "ml-8 bg-[#209dd7] text-white"
                : "mr-8 bg-slate-50 text-slate-700"
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      {error && (
        <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Type your answer..."
          disabled={isLoading}
          className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#209dd7] focus:outline-none focus:ring-1 focus:ring-[#209dd7]"
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="rounded-md bg-[#753991] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          Send
        </button>
      </form>

      {documentId && (
        <button
          type="button"
          onClick={() => onReview(documentId, fields)}
          disabled={isPreparingDocument}
          className="self-start rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-[#032147] hover:bg-slate-50 disabled:opacity-50"
        >
          {isPreparingDocument ? "Preparing document..." : "Review document"}
        </button>
      )}
    </div>
  );
}
