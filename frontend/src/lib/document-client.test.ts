import { afterEach, describe, expect, it, vi } from "vitest";
import { createDocument, getDocument, listDocuments, updateDocument } from "./document-client";

describe("document-client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("creates a document via POST /api/documents", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 1,
        documentId: "mutual-nda",
        title: "Mutual Non-Disclosure Agreement",
        fields: {},
        isComplete: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-01",
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    const doc = await createDocument("mutual-nda", { purpose: "test" }, true);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/documents",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ documentId: "mutual-nda", fields: { purpose: "test" }, isComplete: true }),
      })
    );
    expect(doc.id).toBe(1);
  });

  it("updates a document via PUT /api/documents/:id", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 5,
        documentId: "mutual-nda",
        title: "Mutual Non-Disclosure Agreement",
        fields: { purpose: "updated" },
        isComplete: true,
        createdAt: "2024-01-01",
        updatedAt: "2024-01-02",
      }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await updateDocument(5, { purpose: "updated" }, true);

    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/documents/5",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({ fields: { purpose: "updated" }, isComplete: true }),
      })
    );
  });

  it("lists documents via GET /api/documents", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: true, json: async () => [{ id: 1 }] })
    );
    const documents = await listDocuments();
    expect(documents).toEqual([{ id: 1 }]);
  });

  it("gets a single document via GET /api/documents/:id", async () => {
    const fetchSpy = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 7 }) });
    vi.stubGlobal("fetch", fetchSpy);

    await getDocument(7);

    expect(fetchSpy).toHaveBeenCalledWith("/api/documents/7");
  });

  it("throws when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));
    await expect(listDocuments()).rejects.toThrow();
  });
});
