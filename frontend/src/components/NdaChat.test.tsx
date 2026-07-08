import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const postNdaChatTurn = vi.fn();
vi.mock("@/lib/nda-chat-client", () => ({
  postNdaChatTurn: (...args: unknown[]) => postNdaChatTurn(...args),
}));

import NdaChat from "./NdaChat";

describe("NdaChat", () => {
  afterEach(() => {
    postNdaChatTurn.mockReset();
  });

  it("sends the typed message and renders both the user message and the assistant reply", async () => {
    postNdaChatTurn.mockResolvedValueOnce({
      reply: "What's the governing law?",
      fields: {},
      isComplete: false,
    });

    render(<NdaChat onComplete={vi.fn()} onReview={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Let's start" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText("Let's start")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("What's the governing law?")).toBeInTheDocument()
    );
  });

  it("calls onReview with the current fields when the Review document button is clicked", async () => {
    const onReview = vi.fn();
    render(<NdaChat onComplete={vi.fn()} onReview={onReview} />);

    fireEvent.click(screen.getByRole("button", { name: "Review document" }));

    expect(onReview).toHaveBeenCalledWith({});
  });

  it("calls onComplete once the assistant marks the conversation complete", async () => {
    postNdaChatTurn.mockResolvedValueOnce({
      reply: "All set!",
      fields: { governingLaw: "Delaware" },
      isComplete: true,
    });
    const onComplete = vi.fn();

    render(<NdaChat onComplete={onComplete} onReview={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Delaware" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(onComplete).toHaveBeenCalledWith({ governingLaw: "Delaware" })
    );
  });

  it("shows an error banner and does not call onComplete when the request fails", async () => {
    postNdaChatTurn.mockRejectedValueOnce(new Error("network down"));

    render(<NdaChat onComplete={vi.fn()} onReview={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Let's start" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
