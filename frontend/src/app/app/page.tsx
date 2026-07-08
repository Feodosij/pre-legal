"use client";

import { useEffect, useRef, useState } from "react";
import Chat from "@/components/Chat";
import DownloadGenericPdfButton from "@/components/DownloadGenericPdfButton";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import GenericDocument from "@/components/GenericDocument";
import NdaDocument from "@/components/NdaDocument";
import { useChat } from "@/hooks/useChat";
import { fetchRenderedDocument } from "@/lib/document-render-client";
import { toNdaFormData } from "@/lib/nda-types";
import type { RenderedDocument } from "@/lib/rendered-document-types";

export default function Home() {
  const { messages, documentId, fields, isLoading, error, sendMessage } = useChat();
  const [renderedDocument, setRenderedDocument] = useState<RenderedDocument | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [resolvedFields, setResolvedFields] = useState<Record<string, unknown> | null>(null);
  const latestRenderRequestId = useRef(0);

  const isNda = documentId === "mutual-nda";
  const isGenericDocument = documentId !== null && !isNda;
  const isPreparingDocument = isGenericDocument && resolvedFields !== fields;

  useEffect(() => {
    if (!isGenericDocument) return;

    const requestId = ++latestRenderRequestId.current;
    const requestFields = fields;

    fetchRenderedDocument(documentId, requestFields)
      .then((rendered) => {
        if (requestId !== latestRenderRequestId.current) return;
        setRenderedDocument(rendered);
        setRenderError(null);
        setResolvedFields(requestFields);
      })
      .catch(() => {
        if (requestId !== latestRenderRequestId.current) return;
        setRenderError("Something went wrong preparing your document preview.");
        setResolvedFields(requestFields);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, fields]);

  const ndaData = isNda ? toNdaFormData(fields) : null;

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="mb-1 text-2xl font-bold text-[#032147]">Prelegal Document Creator</h1>
        <p className="mb-6 text-sm text-[#888888]">
          Chat with the assistant to draft a legal agreement — your document preview
          updates live on the right as you go.
        </p>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <Chat messages={messages} isLoading={isLoading} error={error} onSend={sendMessage} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#032147]">Document preview</h2>
              {isNda && ndaData && <DownloadPdfButton data={ndaData} fileName="mutual-nda.pdf" />}
              {isGenericDocument && renderedDocument && (
                <DownloadGenericPdfButton
                  document={renderedDocument}
                  fileName={`${documentId}.pdf`}
                />
              )}
            </div>

            {renderError && (
              <div className="rounded-md bg-red-50 px-4 py-2 text-sm text-red-700" role="alert">
                {renderError}
              </div>
            )}

            <div
              data-testid="document-preview"
              className="min-h-[400px] overflow-y-auto rounded-xl bg-white shadow-sm"
            >
              {!documentId && (
                <div className="flex h-full min-h-[400px] items-center justify-center p-6 text-center text-sm text-[#888888]">
                  Tell the assistant what document you need — your draft will appear
                  here as you fill in the details.
                </div>
              )}
              {isNda && ndaData && <NdaDocument data={ndaData} />}
              {isGenericDocument && renderedDocument && (
                <GenericDocument document={renderedDocument} />
              )}
              {isGenericDocument && !renderedDocument && isPreparingDocument && (
                <div className="flex h-full min-h-[400px] items-center justify-center p-6 text-center text-sm text-[#888888]">
                  Preparing your document preview...
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
