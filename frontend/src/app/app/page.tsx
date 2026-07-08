"use client";

import { useRef, useState } from "react";
import Chat from "@/components/Chat";
import DownloadGenericPdfButton from "@/components/DownloadGenericPdfButton";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import GenericDocument from "@/components/GenericDocument";
import NdaDocument from "@/components/NdaDocument";
import { fetchRenderedDocument } from "@/lib/document-render-client";
import { defaultNdaFormData, toNdaFormData, type NdaFormData } from "@/lib/nda-types";
import type { RenderedDocument } from "@/lib/rendered-document-types";

export default function Home() {
  const [view, setView] = useState<"chat" | "document">("chat");
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [ndaData, setNdaData] = useState<NdaFormData>(() => defaultNdaFormData());
  const [renderedDocument, setRenderedDocument] = useState<RenderedDocument | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [isPreparingDocument, setIsPreparingDocument] = useState(false);
  const latestRenderRequestId = useRef(0);

  const showDocument = async (documentId: string, fields: Record<string, unknown>) => {
    setActiveDocumentId(documentId);
    setRenderError(null);

    if (documentId === "mutual-nda") {
      setNdaData(toNdaFormData(fields));
      setView("document");
      return;
    }

    const requestId = ++latestRenderRequestId.current;
    setIsPreparingDocument(true);
    try {
      const rendered = await fetchRenderedDocument(documentId, fields);
      if (requestId !== latestRenderRequestId.current) return;
      setRenderedDocument(rendered);
      setView("document");
    } catch {
      if (requestId !== latestRenderRequestId.current) return;
      setRenderError("Something went wrong preparing your document. Please try again.");
    } finally {
      if (requestId === latestRenderRequestId.current) setIsPreparingDocument(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-1 text-2xl font-bold text-[#032147]">Prelegal Document Creator</h1>
        <p className="mb-6 text-sm text-[#888888]">
          Chat with the assistant to draft a legal agreement, then download it as a PDF.
        </p>

        {renderError && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
            {renderError}
          </div>
        )}

        {/* Chat stays mounted across view switches so its conversation and
            extracted fields survive a trip to the document view and back. */}
        <div hidden={view !== "chat"} className="rounded-xl bg-white p-6 shadow-sm">
          <Chat
            onComplete={showDocument}
            onReview={showDocument}
            isPreparingDocument={isPreparingDocument}
          />
        </div>
        <div hidden={view !== "document"} className="space-y-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setView("chat")}
              className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to chat
            </button>
            {activeDocumentId === "mutual-nda" ? (
              <DownloadPdfButton data={ndaData} fileName="mutual-nda.pdf" />
            ) : (
              renderedDocument && (
                <DownloadGenericPdfButton
                  document={renderedDocument}
                  fileName={`${activeDocumentId ?? "document"}.pdf`}
                />
              )
            )}
          </div>
          <div className="overflow-hidden rounded-xl shadow-sm">
            {activeDocumentId === "mutual-nda" ? (
              <NdaDocument data={ndaData} />
            ) : (
              renderedDocument && <GenericDocument document={renderedDocument} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
