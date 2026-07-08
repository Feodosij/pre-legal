import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const postNdaChatTurn = vi.fn();
vi.mock("@/lib/nda-chat-client", () => ({
  postNdaChatTurn: (...args: unknown[]) => postNdaChatTurn(...args),
}));

import Home from "./page";

describe("Home", () => {
  it("starts on the chat view", () => {
    render(<Home />);
    expect(
      screen.getByText(/Let's fill out your Mutual NDA together/)
    ).toBeInTheDocument();
  });

  it("switches to the document view when Review document is clicked", () => {
    render(<Home />);
    fireEvent.click(screen.getByRole("button", { name: "Review document" }));

    expect(screen.getByRole("button", { name: "Back to chat" })).toBeInTheDocument();
  });

  it("keeps the conversation when going back to chat after reviewing the document", async () => {
    postNdaChatTurn.mockResolvedValueOnce({
      reply: "What's the governing law?",
      fields: {},
      isComplete: false,
    });

    render(<Home />);

    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Let's start" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(await screen.findByText("What's the governing law?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Review document" }));
    fireEvent.click(screen.getByRole("button", { name: "Back to chat" }));

    expect(screen.getByText("Let's start")).toBeInTheDocument();
    expect(screen.getByText("What's the governing law?")).toBeInTheDocument();
  });
});
