"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Chat from "@/components/Chat";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import DownloadGenericPdfButton from "@/components/DownloadGenericPdfButton";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import GenericDocument from "@/components/GenericDocument";
import Header from "@/components/Header";
import NdaDocument from "@/components/NdaDocument";
import { useChat } from "@/hooks/useChat";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { createDocument, updateDocument } from "@/lib/document-client";
import { fetchRenderedDocument } from "@/lib/document-render-client";
import { toNdaFormData } from "@/lib/nda-types";
import type { RenderedDocument } from "@/lib/rendered-document-types";

export default function Home() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, signOut } = useRequireAuth();
  const { messages, documentId, fields, isComplete, isLoading, error, sendMessage } = useChat();
  const [renderedDocument, setRenderedDocument] = useState<RenderedDocument | null>(null);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [resolvedFields, setResolvedFields] = useState<Record<string, unknown> | null>(null);
  const latestRenderRequestId = useRef(0);

  const [savedDocumentId, setSavedDocumentId] = useState<number | null>(null);
  const lastPersistedFieldsRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!documentId || !isComplete) return;

    // Skip re-saving a snapshot we've already persisted - without this, a
    // successful save's own setSavedDocumentId re-triggers this effect (it's
    // a dependency), which would otherwise fire a redundant update call.
    const fieldsSnapshot = JSON.stringify(fields);
    if (fieldsSnapshot === lastPersistedFieldsRef.current) return;
    lastPersistedFieldsRef.current = fieldsSnapshot;

    const persist = savedDocumentId
      ? updateDocument(savedDocumentId, fields, true)
      : createDocument(documentId, fields, true);

    persist.then((saved) => setSavedDocumentId(saved.id)).catch(() => {
      // Best-effort save: if it fails, the user still has their finished
      // document on screen and can retry via download. Clear the snapshot
      // so a later change to fields (or a manual retry) can try again.
      lastPersistedFieldsRef.current = null;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [documentId, isComplete, fields, savedDocumentId]);

  const ndaData = isNda ? toNdaFormData(fields) : null;

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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-100">
      <Header userEmail={user.email} onSignOut={handleSignOut} active="creator" />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 py-6">
        <div className="mx-auto flex h-full w-full min-h-0 max-w-[1600px] flex-1 flex-col gap-4">
          <div className="flex shrink-0 items-start justify-between gap-4">
            <div>
              <h1 className="mb-1 text-2xl font-bold text-[#032147]">Prelegal Document Creator</h1>
              <p className="text-sm text-[#888888]">
                Chat with the assistant to draft a legal agreement — your document preview
                updates live on the right as you go.
              </p>
            </div>
            {savedDocumentId && (
              <span className="shrink-0 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                Saved to your documents
              </span>
            )}
          </div>

          <DisclaimerBanner />

          <div className="grid min-h-0 flex-1 grid-cols-1 grid-rows-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
            <div className="flex min-h-0 flex-col rounded-xl bg-white p-6 shadow-sm">
              <Chat messages={messages} isLoading={isLoading} error={error} onSend={sendMessage} />
            </div>

            <div className="flex min-h-0 flex-col gap-3">
              <div className="flex shrink-0 items-center justify-between">
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
                <div
                  className="shrink-0 rounded-md bg-red-50 px-4 py-2 text-sm text-red-700"
                  role="alert"
                >
                  {renderError}
                </div>
              )}

              <div
                data-testid="document-preview"
                className="min-h-0 flex-1 overflow-y-auto rounded-xl bg-white shadow-sm"
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
    </div>
  );
}
