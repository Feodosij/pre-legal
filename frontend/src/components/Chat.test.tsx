import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const postChatTurn = vi.fn();
vi.mock("@/lib/chat-client", () => ({
  postChatTurn: (...args: unknown[]) => postChatTurn(...args),
}));

import Chat from "./Chat";

describe("Chat", () => {
  afterEach(() => {
    postChatTurn.mockReset();
  });

  it("sends the typed message and renders both the user message and the assistant reply", async () => {
    postChatTurn.mockResolvedValueOnce({
      reply: "What kind of document do you need?",
      documentId: null,
      suggestedDocumentId: null,
      fields: {},
      isComplete: false,
    });

    render(<Chat onComplete={vi.fn()} onReview={vi.fn()} />);

    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "I need an NDA" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText("I need an NDA")).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByText("What kind of document do you need?")).toBeInTheDocument()
    );
  });

  it("does not show the Review document button until a document has been selected", async () => {
    render(<Chat onComplete={vi.fn()} onReview={vi.fn()} />);
    expect(screen.queryByRole("button", { name: "Review document" })).not.toBeInTheDocument();

    postChatTurn.mockResolvedValueOnce({
      reply: "Let's draft a Pilot Agreement.",
      documentId: "pilot-agreement",
      suggestedDocumentId: null,
      fields: {},
      isComplete: false,
    });
    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "A pilot agreement" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Review document" })).toBeInTheDocument()
    );
  });

  it("calls onReview with the documentId and current fields when clicked", async () => {
    const onReview = vi.fn();
    postChatTurn.mockResolvedValueOnce({
      reply: "Let's draft a Pilot Agreement.",
      documentId: "pilot-agreement",
      suggestedDocumentId: null,
      fields: { governingLaw: "Delaware" },
      isComplete: false,
    });

    render(<Chat onComplete={vi.fn()} onReview={onReview} />);
    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "A pilot agreement" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Review document" })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole("button", { name: "Review document" }));

    expect(onReview).toHaveBeenCalledWith("pilot-agreement", { governingLaw: "Delaware" });
  });

  it("calls onComplete once the assistant marks the conversation complete", async () => {
    postChatTurn.mockResolvedValueOnce({
      reply: "All set!",
      documentId: "pilot-agreement",
      suggestedDocumentId: null,
      fields: { governingLaw: "Delaware" },
      isComplete: true,
    });
    const onComplete = vi.fn();

    render(<Chat onComplete={onComplete} onReview={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Delaware" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(onComplete).toHaveBeenCalledWith("pilot-agreement", { governingLaw: "Delaware" })
    );
  });

  it("shows an error banner when the request fails", async () => {
    postChatTurn.mockRejectedValueOnce(new Error("network down"));

    render(<Chat onComplete={vi.fn()} onReview={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "hi" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeInTheDocument());
  });
});
