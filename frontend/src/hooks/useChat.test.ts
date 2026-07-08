import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const postChatTurn = vi.fn();
vi.mock("@/lib/chat-client", () => ({
  postChatTurn: (...args: unknown[]) => postChatTurn(...args),
}));

import { useChat } from "./useChat";

describe("useChat", () => {
  afterEach(() => {
    postChatTurn.mockReset();
  });

  it("starts with no document selected and adopts the documentId once routing resolves it", async () => {
    postChatTurn.mockResolvedValueOnce({
      reply: "Let's draft a Pilot Agreement.",
      documentId: "pilot-agreement",
      suggestedDocumentId: null,
      fields: {},
      isComplete: false,
    });

    const { result } = renderHook(() => useChat());
    expect(result.current.documentId).toBeNull();

    await act(async () => {
      await result.current.sendMessage("I need a pilot agreement");
    });

    expect(result.current.documentId).toBe("pilot-agreement");
    expect(result.current.messages).toEqual([
      { role: "user", content: "I need a pilot agreement" },
      { role: "assistant", content: "Let's draft a Pilot Agreement." },
    ]);
  });

  it("surfaces suggestedDocumentId when the request is unsupported", async () => {
    postChatTurn.mockResolvedValueOnce({
      reply: "We can't draft a CSA yet, but a Pilot Agreement is close.",
      documentId: null,
      suggestedDocumentId: "pilot-agreement",
      fields: {},
      isComplete: false,
    });

    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage("I need a cloud service agreement");
    });

    expect(result.current.documentId).toBeNull();
    expect(result.current.suggestedDocumentId).toBe("pilot-agreement");
  });

  it("sends the current documentId and fields on subsequent turns", async () => {
    postChatTurn.mockResolvedValueOnce({
      reply: "Got it.",
      documentId: "pilot-agreement",
      suggestedDocumentId: null,
      fields: { governingLaw: "Delaware" },
      isComplete: false,
    });
    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage("Delaware law");
    });

    postChatTurn.mockResolvedValueOnce({
      reply: "Thanks!",
      documentId: "pilot-agreement",
      suggestedDocumentId: null,
      fields: { governingLaw: "Delaware", pilotPeriod: "90 days" },
      isComplete: false,
    });
    await act(async () => {
      await result.current.sendMessage("90 days");
    });

    expect(postChatTurn).toHaveBeenLastCalledWith({
      messages: [
        { role: "user", content: "Delaware law" },
        { role: "assistant", content: "Got it." },
        { role: "user", content: "90 days" },
      ],
      documentId: "pilot-agreement",
      fields: { governingLaw: "Delaware" },
    });
  });

  it("sets an error and keeps the user message when the request fails", async () => {
    postChatTurn.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useChat());
    await act(async () => {
      await result.current.sendMessage("Let's start");
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.messages).toEqual([{ role: "user", content: "Let's start" }]);
  });
});
