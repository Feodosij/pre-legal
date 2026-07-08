import { afterEach, describe, expect, it, vi } from "vitest";
import { postChatTurn } from "./chat-client";

describe("postChatTurn", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the message history, documentId and fields to /api/chat/message", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "What's the pilot period?",
        documentId: "pilot-agreement",
        suggestedDocumentId: null,
        fields: { governingLaw: "Delaware" },
        isComplete: false,
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await postChatTurn({
      messages: [{ role: "user", content: "Let's start" }],
      documentId: "pilot-agreement",
      fields: {},
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/chat/message",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          messages: [{ role: "user", content: "Let's start" }],
          documentId: "pilot-agreement",
          fields: {},
        }),
      })
    );
    expect(result.documentId).toBe("pilot-agreement");
    expect(result.fields.governingLaw).toBe("Delaware");
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({}) })
    );

    await expect(
      postChatTurn({ messages: [{ role: "user", content: "hi" }], documentId: null, fields: {} })
    ).rejects.toThrow();
  });
});
