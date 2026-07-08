import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const postNdaChatTurn = vi.fn();
vi.mock("@/lib/nda-chat-client", () => ({
  postNdaChatTurn: (...args: unknown[]) => postNdaChatTurn(...args),
}));

import { useNdaChat } from "./useNdaChat";

describe("useNdaChat", () => {
  afterEach(() => {
    postNdaChatTurn.mockReset();
  });

  it("appends the user message immediately and the assistant reply once the request resolves", async () => {
    postNdaChatTurn.mockResolvedValueOnce({
      reply: "What's the governing law?",
      fields: { purpose: "Partnership talks" },
      isComplete: false,
    });

    const { result } = renderHook(() => useNdaChat());

    act(() => {
      result.current.sendMessage("Let's start");
    });

    expect(result.current.messages).toEqual([{ role: "user", content: "Let's start" }]);
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.messages).toEqual([
      { role: "user", content: "Let's start" },
      { role: "assistant", content: "What's the governing law?" },
    ]);
    expect(result.current.fields).toEqual({ purpose: "Partnership talks" });
    expect(result.current.isComplete).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("sends the accumulated fields and full history on the next turn", async () => {
    postNdaChatTurn.mockResolvedValueOnce({
      reply: "Got it.",
      fields: { purpose: "Partnership talks" },
      isComplete: false,
    });
    const { result } = renderHook(() => useNdaChat());
    await act(async () => {
      await result.current.sendMessage("Let's start");
    });

    postNdaChatTurn.mockResolvedValueOnce({
      reply: "Thanks!",
      fields: { purpose: "Partnership talks", governingLaw: "Delaware" },
      isComplete: false,
    });
    await act(async () => {
      await result.current.sendMessage("Delaware");
    });

    expect(postNdaChatTurn).toHaveBeenLastCalledWith({
      messages: [
        { role: "user", content: "Let's start" },
        { role: "assistant", content: "Got it." },
        { role: "user", content: "Delaware" },
      ],
      fields: { purpose: "Partnership talks" },
    });
  });

  it("sets an error and keeps the user message when the request fails", async () => {
    postNdaChatTurn.mockRejectedValueOnce(new Error("network down"));

    const { result } = renderHook(() => useNdaChat());
    await act(async () => {
      await result.current.sendMessage("Let's start");
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.messages).toEqual([{ role: "user", content: "Let's start" }]);
    expect(result.current.isLoading).toBe(false);
  });

  it("ignores blank input", async () => {
    const { result } = renderHook(() => useNdaChat());
    await act(async () => {
      await result.current.sendMessage("   ");
    });

    expect(result.current.messages).toEqual([]);
    expect(postNdaChatTurn).not.toHaveBeenCalled();
  });
});
