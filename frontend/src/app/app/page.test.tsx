import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

const postChatTurn = vi.fn();
vi.mock("@/lib/chat-client", () => ({
  postChatTurn: (...args: unknown[]) => postChatTurn(...args),
}));

const fetchRenderedDocument = vi.fn();
vi.mock("@/lib/document-render-client", () => ({
  fetchRenderedDocument: (...args: unknown[]) => fetchRenderedDocument(...args),
}));

const createDocument = vi.fn();
const updateDocument = vi.fn();
vi.mock("@/lib/document-client", () => ({
  createDocument: (...args: unknown[]) => createDocument(...args),
  updateDocument: (...args: unknown[]) => updateDocument(...args),
}));

const mockUser = { id: 1, email: "test@example.com", created_at: "2024-01-01" };
const mockSignOut = vi.fn();
vi.mock("@/hooks/useRequireAuth", () => ({
  useRequireAuth: () => ({
    user: mockUser,
    isLoading: false,
    signOut: mockSignOut,
  }),
}));

import Home from "./page";

describe("Home", () => {
  afterEach(() => {
    push.mockReset();
    postChatTurn.mockReset();
    fetchRenderedDocument.mockReset();
    createDocument.mockReset();
    updateDocument.mockReset();
  });

  it("starts on the chat view with a placeholder in the preview panel", () => {
    render(<Home />);
    expect(screen.getByText(/What kind of legal document do you need/)).toBeInTheDocument();
    expect(
      screen.getByText(/your draft will appear here as you fill in the details/)
    ).toBeInTheDocument();
  });

  it("shows the live Mutual NDA preview as soon as documentId resolves, without any extra click", async () => {
    postChatTurn.mockResolvedValueOnce({
      reply: "Got it.",
      documentId: "mutual-nda",
      suggestedDocumentId: null,
      fields: { governingLaw: "Delaware" },
      isComplete: false,
    });

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Delaware" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    await waitFor(() => expect(screen.getAllByText(/Delaware/).length).toBeGreaterThan(0));
    expect(fetchRenderedDocument).not.toHaveBeenCalled();
    // The chat panel is still visible alongside the live preview.
    expect(screen.getByPlaceholderText("Type your answer...")).toBeInTheDocument();
  });

  it("fetches and shows a live generic preview for other supported document types", async () => {
    postChatTurn.mockResolvedValueOnce({
      reply: "Got it.",
      documentId: "pilot-agreement",
      suggestedDocumentId: null,
      fields: { governingLaw: "Delaware" },
      isComplete: false,
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

  it("re-fetches the generic preview on every subsequent turn, showing the latest even if an earlier request resolves later", async () => {
    postChatTurn
      .mockResolvedValueOnce({
        reply: "Got it.",
        documentId: "pilot-agreement",
        suggestedDocumentId: null,
        fields: { governingLaw: "Delaware" },
        isComplete: false,
      })
      .mockResolvedValueOnce({
        reply: "Updated.",
        documentId: "pilot-agreement",
        suggestedDocumentId: null,
        fields: { governingLaw: "Texas" },
        isComplete: false,
      });

    let resolveFirst: (value: unknown) => void = () => {};
    let resolveSecond: (value: unknown) => void = () => {};
    fetchRenderedDocument
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));

    render(<Home />);

    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Delaware" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(fetchRenderedDocument).toHaveBeenCalledTimes(1));

    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Texas" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    await waitFor(() => expect(fetchRenderedDocument).toHaveBeenCalledTimes(2));

    const preview = screen.getByTestId("document-preview");

    resolveSecond({
      title: "Pilot Agreement",
      partyRoleLabels: [],
      partyRows: [],
      coverFields: [{ label: "Governing Law", value: "Texas" }],
      sections: [],
    });
    await waitFor(() => expect(within(preview).getByText("Texas")).toBeInTheDocument());

    resolveFirst({
      title: "Pilot Agreement",
      partyRoleLabels: [],
      partyRows: [],
      coverFields: [{ label: "Governing Law", value: "Delaware" }],
      sections: [],
    });

    expect(within(preview).getByText("Texas")).toBeInTheDocument();
    expect(within(preview).queryByText("Delaware")).not.toBeInTheDocument();
  });

  it("shows a typing indicator in the chat panel while a turn is in flight", async () => {
    let resolveTurn: (value: unknown) => void = () => {};
    postChatTurn.mockImplementationOnce(() => new Promise((resolve) => { resolveTurn = resolve; }));

    render(<Home />);
    fireEvent.change(screen.getByPlaceholderText("Type your answer..."), {
      target: { value: "Hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByRole("status", { name: /typing/i })).toBeInTheDocument();

    resolveTurn({
      reply: "Hi!",
      documentId: null,
      suggestedDocumentId: null,
      fields: {},
      isComplete: false,
    });
    await waitFor(() =>
      expect(screen.queryByRole("status", { name: /typing/i })).not.toBeInTheDocument()
    );
  });

  it("saves the document to history once a turn reports isComplete", async () => {
    createDocument.mockResolvedValueOnce({
      id: 42,
      documentId: "mutual-nda",
      title: "Mutual Non-Disclosure Agreement",
      fields: {},
      isComplete: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    });
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

    await waitFor(() => expect(createDocument).toHaveBeenCalledWith(
      "mutual-nda",
      { governingLaw: "Delaware" },
      true
    ));
    expect(await screen.findByText("Saved to your documents")).toBeInTheDocument();
  });
});
