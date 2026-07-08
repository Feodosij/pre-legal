"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import DownloadGenericPdfButton from "@/components/DownloadGenericPdfButton";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import GenericDocument from "@/components/GenericDocument";
import Header from "@/components/Header";
import NdaDocument from "@/components/NdaDocument";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { getDocument, listDocuments } from "@/lib/document-client";
import type { DocumentSummary } from "@/lib/document-types";
import { fetchRenderedDocument } from "@/lib/document-render-client";
import { toNdaFormData, type NdaFormData } from "@/lib/nda-types";
import type { RenderedDocument } from "@/lib/rendered-document-types";

export default function HistoryPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, signOut } = useRequireAuth();
  const [documents, setDocuments] = useState<DocumentSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isViewLoading, setIsViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [ndaData, setNdaData] = useState<NdaFormData | null>(null);
  const [renderedDocument, setRenderedDocument] = useState<RenderedDocument | null>(null);

  useEffect(() => {
    if (!user) return;
    listDocuments()
      .then(setDocuments)
      .catch(() => setListError("Could not load your documents."));
  }, [user]);

  const handleSelect = async (summary: DocumentSummary) => {
    setSelectedId(summary.id);
    setNdaData(null);
    setRenderedDocument(null);
    setViewError(null);
    setIsViewLoading(true);
    try {
      const detail = await getDocument(summary.id);
      if (detail.documentId === "mutual-nda") {
        setNdaData(toNdaFormData(detail.fields));
      } else {
        setRenderedDocument(await fetchRenderedDocument(detail.documentId, detail.fields));
      }
    } catch {
      setViewError("Could not load this document.");
    } finally {
      setIsViewLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  if (isAuthLoading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100 text-sm text-[#888888]">
        Loading...
      </div>
    );
  }

  const selectedTitle = documents?.find((doc) => doc.id === selectedId)?.title;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <Header userEmail={user.email} onSignOut={handleSignOut} active="history" />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-6">
        <div className="mx-auto flex h-full w-full min-h-0 max-w-[1600px] flex-1 flex-col gap-4">
          <div className="shrink-0">
            <h1 className="mb-1 text-2xl font-bold text-[#032147]">Your documents</h1>
            <p className="text-sm text-[#888888]">
              Documents you&apos;ve drafted with the assistant.
            </p>
          </div>

          <DisclaimerBanner />

          <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] gap-6 lg:grid-cols-[320px_1fr]">
            <div className="min-h-0 overflow-y-auto rounded-xl bg-white p-4 shadow-sm">
              {listError && <p className="text-sm text-red-700">{listError}</p>}
              {documents !== null && documents.length === 0 && (
                <p className="text-sm text-[#888888]">You haven&apos;t drafted a document yet.</p>
              )}
              <ul className="space-y-1">
                {documents?.map((doc) => (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(doc)}
                      className={`w-full rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        selectedId === doc.id
                          ? "bg-[#209dd7]/10 text-[#209dd7]"
                          : "text-[#032147] hover:bg-slate-50"
                      }`}
                    >
                      <div className="font-medium">{doc.title}</div>
                      <div className="text-xs text-[#888888]">
                        {doc.isComplete ? "Completed" : "In progress"} ·{" "}
                        {new Date(doc.updatedAt).toLocaleDateString()}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex min-h-0 flex-col rounded-xl bg-white shadow-sm">
              <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4">
                <h2 className="truncate text-sm font-semibold text-[#032147]">
                  {selectedTitle ?? "Document preview"}
                </h2>
                <div className="flex shrink-0 gap-2">
                  {ndaData && <DownloadPdfButton data={ndaData} fileName="mutual-nda.pdf" />}
                  {renderedDocument && (
                    <DownloadGenericPdfButton
                      document={renderedDocument}
                      fileName={`document-${selectedId}.pdf`}
                    />
                  )}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto">
                {!selectedId && (
                  <div className="flex h-full min-h-[400px] items-center justify-center p-6 text-center text-sm text-[#888888]">
                    Select a document on the left to view it.
                  </div>
                )}
                {isViewLoading && (
                  <div className="flex h-full min-h-[400px] items-center justify-center p-6 text-center text-sm text-[#888888]">
                    Loading document...
                  </div>
                )}
                {viewError && (
                  <div className="px-6 py-4 text-sm text-red-700" role="alert">
                    {viewError}
                  </div>
                )}
                {ndaData && <NdaDocument data={ndaData} />}
                {renderedDocument && <GenericDocument document={renderedDocument} />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
