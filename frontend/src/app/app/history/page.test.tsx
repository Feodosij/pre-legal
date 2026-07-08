import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const listDocuments = vi.fn();
const getDocument = vi.fn();
vi.mock("@/lib/document-client", () => ({
  listDocuments: (...args: unknown[]) => listDocuments(...args),
  getDocument: (...args: unknown[]) => getDocument(...args),
}));

const fetchRenderedDocument = vi.fn();
vi.mock("@/lib/document-render-client", () => ({
  fetchRenderedDocument: (...args: unknown[]) => fetchRenderedDocument(...args),
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

import HistoryPage from "./page";

describe("HistoryPage", () => {
  afterEach(() => {
    listDocuments.mockReset();
    getDocument.mockReset();
    fetchRenderedDocument.mockReset();
  });

  it("lists the user's documents and shows an empty state when there are none", async () => {
    listDocuments.mockResolvedValueOnce([]);
    render(<HistoryPage />);
    expect(await screen.findByText(/haven't drafted a document yet/)).toBeInTheDocument();
  });

  it("loads and displays a selected mutual NDA document", async () => {
    listDocuments.mockResolvedValueOnce([
      {
        id: 1,
        documentId: "mutual-nda",
        title: "Mutual NDA: Acme & Beta",
        isComplete: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      },
    ]);
    getDocument.mockResolvedValueOnce({
      id: 1,
      documentId: "mutual-nda",
      title: "Mutual NDA: Acme & Beta",
      fields: { governingLaw: "New York" },
      isComplete: true,
      createdAt: "2024-01-01",
      updatedAt: "2024-01-01",
    });

    render(<HistoryPage />);
    fireEvent.click(await screen.findByText("Mutual NDA: Acme & Beta"));

    await waitFor(() => expect(getDocument).toHaveBeenCalledWith(1));
    expect(await screen.findByText("Mutual Non-Disclosure Agreement")).toBeInTheDocument();
  });
});
