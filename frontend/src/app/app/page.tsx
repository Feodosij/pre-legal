"use client";

import { useState } from "react";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import NdaChat from "@/components/NdaChat";
import NdaDocument from "@/components/NdaDocument";
import { defaultNdaFormData, toNdaFormData, type NdaFormData, type PartialNdaFormData } from "@/lib/nda-types";

export default function Home() {
  const [view, setView] = useState<"chat" | "document">("chat");
  const [formData, setFormData] = useState<NdaFormData>(() => defaultNdaFormData());

  const showDocument = (fields: PartialNdaFormData) => {
    setFormData(toNdaFormData(fields));
    setView("document");
  };

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-1 text-2xl font-bold text-[#032147]">
          Mutual NDA Creator
        </h1>
        <p className="mb-6 text-sm text-[#888888]">
          Chat with the assistant to fill in a Common Paper Mutual Non-Disclosure
          Agreement, then download it as a PDF.
        </p>

        {/* NdaChat stays mounted across view switches so its conversation and
            extracted fields survive a trip to the document view and back. */}
        <div hidden={view !== "chat"} className="rounded-xl bg-white p-6 shadow-sm">
          <NdaChat onComplete={showDocument} onReview={showDocument} />
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
            <DownloadPdfButton data={formData} fileName="mutual-nda.pdf" />
          </div>
          <div className="overflow-hidden rounded-xl shadow-sm">
            <NdaDocument data={formData} />
          </div>
        </div>
      </div>
    </div>
  );
}
