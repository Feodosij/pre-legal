import { afterEach, describe, expect, it, vi } from "vitest";
import { postNdaChatTurn } from "./nda-chat-client";

describe("postNdaChatTurn", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts the message history and fields to /api/chat/nda and returns the parsed response", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        reply: "What's the governing law?",
        fields: { purpose: "Partnership talks" },
        isComplete: false,
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await postNdaChatTurn({
      messages: [{ role: "user", content: "Let's start" }],
      fields: {},
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/chat/nda",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({
          messages: [{ role: "user", content: "Let's start" }],
          fields: {},
        }),
      })
    );
    expect(result.reply).toBe("What's the governing law?");
    expect(result.fields.purpose).toBe("Partnership talks");
    expect(result.isComplete).toBe(false);
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 502, json: async () => ({}) })
    );

    await expect(
      postNdaChatTurn({ messages: [{ role: "user", content: "hi" }], fields: {} })
    ).rejects.toThrow();
  });

  it("aborts and rejects if the request hangs longer than the timeout", async () => {
    vi.useFakeTimers();
    const fetchSpy = vi.fn((_url: string, options: RequestInit) => {
      return new Promise((_resolve, reject) => {
        options.signal?.addEventListener("abort", () => {
          reject(new DOMException("Aborted", "AbortError"));
        });
      });
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = postNdaChatTurn({ messages: [], fields: {} });
    const assertion = expect(result).rejects.toThrow();
    await vi.runAllTimersAsync();
    await assertion;

    vi.useRealTimers();
  });
});
