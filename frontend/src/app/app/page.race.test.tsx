import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const fetchRenderedDocument = vi.fn();
vi.mock("@/lib/document-render-client", () => ({
  fetchRenderedDocument: (...args: unknown[]) => fetchRenderedDocument(...args),
}));

type OnComplete = (documentId: string, fields: Record<string, unknown>) => void;
let latestOnComplete: OnComplete | null = null;
vi.mock("@/components/Chat", () => ({
  default: ({ onComplete }: { onComplete: OnComplete }) => {
    latestOnComplete = onComplete;
    return null;
  },
}));

import Home from "./page";

// This test bypasses the real Chat component (which independently guards against
// overlapping requests by disabling its "Review document" button) so it can exercise
// page.tsx's own request-sequencing guard directly, regardless of how a second
// completion might be triggered.
describe("Home render request sequencing", () => {
  it("shows the result of the latest render request even if an earlier one resolves later", async () => {
    let resolveFirst: (value: unknown) => void = () => {};
    let resolveSecond: (value: unknown) => void = () => {};
    fetchRenderedDocument
      .mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }))
      .mockImplementationOnce(() => new Promise((resolve) => { resolveSecond = resolve; }));

    render(<Home />);

    act(() => {
      latestOnComplete?.("pilot-agreement", { governingLaw: "Delaware" });
    });
    await waitFor(() => expect(fetchRenderedDocument).toHaveBeenCalledTimes(1));

    act(() => {
      latestOnComplete?.("pilot-agreement", { governingLaw: "Texas" });
    });
    await waitFor(() => expect(fetchRenderedDocument).toHaveBeenCalledTimes(2));

    // The second (newer) request resolves first; the first (stale) request
    // resolves after it. The stale response must not overwrite the fresh one.
    await act(async () => {
      resolveSecond({
        title: "Pilot Agreement",
        partyRoleLabels: [],
        partyRows: [],
        coverFields: [{ label: "Governing Law", value: "Texas" }],
        sections: [],
      });
    });
    await waitFor(() => expect(screen.getByText("Texas")).toBeInTheDocument());

    await act(async () => {
      resolveFirst({
        title: "Pilot Agreement",
        partyRoleLabels: [],
        partyRows: [],
        coverFields: [{ label: "Governing Law", value: "Delaware" }],
        sections: [],
      });
    });

    expect(screen.getByText("Texas")).toBeInTheDocument();
    expect(screen.queryByText("Delaware")).not.toBeInTheDocument();
  });
});
