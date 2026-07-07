"use client";

import { useState } from "react";
import DownloadPdfButton from "@/components/DownloadPdfButton";
import NdaDocument from "@/components/NdaDocument";
import NdaForm from "@/components/NdaForm";
import { defaultNdaFormData, type NdaFormData } from "@/lib/nda-types";

export default function Home() {
  const [view, setView] = useState<"form" | "document">("form");
  const [formData, setFormData] = useState<NdaFormData>(() => defaultNdaFormData());

  return (
    <div className="min-h-screen bg-slate-100 py-10">
      <div className="mx-auto max-w-3xl px-4">
        <h1 className="mb-1 text-2xl font-bold text-slate-900">
          Mutual NDA Creator
        </h1>
        <p className="mb-6 text-sm text-slate-600">
          Fill in the details below to generate a Common Paper Mutual Non-Disclosure
          Agreement, then download it as a PDF.
        </p>

        {view === "form" ? (
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <NdaForm
              initialData={formData}
              onSubmit={(data) => {
                setFormData(data);
                setView("document");
              }}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setView("form")}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to form
              </button>
              <DownloadPdfButton data={formData} fileName="mutual-nda.pdf" />
            </div>
            <div className="overflow-hidden rounded-xl shadow-sm">
              <NdaDocument data={formData} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
