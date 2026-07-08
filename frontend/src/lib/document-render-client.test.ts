import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchRenderedDocument } from "./document-render-client";

describe("fetchRenderedDocument", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts fields to /api/documents/{id}/render and returns the parsed document", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        title: "Pilot Agreement",
        partyRoleLabels: ["Provider", "Customer"],
        partyRows: [],
        coverFields: [],
        sections: [],
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await fetchRenderedDocument("pilot-agreement", { governingLaw: "Delaware" });

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/documents/pilot-agreement/render",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json" }),
        body: JSON.stringify({ governingLaw: "Delaware" }),
      })
    );
    expect(result.title).toBe("Pilot Agreement");
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 404, json: async () => ({}) })
    );

    await expect(fetchRenderedDocument("unknown-doc", {})).rejects.toThrow();
  });
});
