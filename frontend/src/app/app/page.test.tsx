import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const postChatTurn = vi.fn();
vi.mock("@/lib/chat-client", () => ({
  postChatTurn: (...args: unknown[]) => postChatTurn(...args),
}));

const fetchRenderedDocument = vi.fn();
vi.mock("@/lib/document-render-client", () => ({
  fetchRenderedDocument: (...args: unknown[]) => fetchRenderedDocument(...args),
}));

import Home from "./page";

describe("Home", () => {
  it("starts on the chat view", () => {
    render(<Home />);
    expect(screen.getByText(/What kind of legal document do you need/)).toBeInTheDocument();
  });

  it("shows the Mutual NDA document view via the existing NDA renderer when documentId is mutual-nda", async () => {
    postChatTurn.mockResolvedValueOnce({
      reply: "All set!",
      documentId: "mutual-nda",
      suggestedDocumentId: null,
      fields: { governingLaw: "Delaware" },
      isComplete: true,
    });

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Delaware" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Back to chat" })).toBeInTheDocument()
    );
    expect(fetchRenderedDocument).not.toHaveBeenCalled();
    expect(screen.getAllByText(/Delaware/).length).toBeGreaterThan(0);
  });

  it("fetches and shows a generic rendered document for other supported document types", async () => {
    postChatTurn.mockResolvedValueOnce({
      reply: "All set!",
      documentId: "pilot-agreement",
      suggestedDocumentId: null,
      fields: { governingLaw: "Delaware" },
      isComplete: true,
    });
    fetchRenderedDocument.mockResolvedValueOnce({
      title: "Pilot Agreement",
      partyRoleLabels: ["Provider", "Customer"],
      partyRows: [],
      coverFields: [{ label: "Governing Law", value: "Delaware" }],
      sections: [],
    });

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Delaware" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getByText("Pilot Agreement")).toBeInTheDocument());
    expect(fetchRenderedDocument).toHaveBeenCalledWith("pilot-agreement", {
      governingLaw: "Delaware",
    });
  });

  it("disables Review document and shows a preparing message while a render request is in flight", async () => {
    postChatTurn.mockResolvedValueOnce({
      reply: "What's the governing law?",
      documentId: "pilot-agreement",
      suggestedDocumentId: null,
      fields: {},
      isComplete: false,
    });
    let resolveRender: (value: unknown) => void = () => {};
    fetchRenderedDocument.mockImplementationOnce(
      () => new Promise((resolve) => { resolveRender = resolve; })
    );

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Let's start" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await screen.findByText("What's the governing law?");

    fireEvent.click(screen.getByRole("button", { name: "Review document" }));
    const preparingButton = await screen.findByRole("button", { name: "Preparing document..." });
    expect(preparingButton).toBeDisabled();

    resolveRender({
      title: "Pilot Agreement",
      partyRoleLabels: [],
      partyRows: [],
      coverFields: [],
      sections: [],
    });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Back to chat" })).toBeInTheDocument()
    );
  });

  it("keeps the conversation when going back to chat after reviewing the document", async () => {
    postChatTurn.mockResolvedValueOnce({
      reply: "What's the governing law?",
      documentId: "mutual-nda",
      suggestedDocumentId: null,
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
