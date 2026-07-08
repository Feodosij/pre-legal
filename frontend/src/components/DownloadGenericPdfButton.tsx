"use client";

import { useState } from "react";
import type { RenderedDocument } from "@/lib/rendered-document-types";

interface DownloadGenericPdfButtonProps {
  document: RenderedDocument;
  fileName: string;
}

export default function DownloadGenericPdfButton({
  document: renderedDocument,
  fileName,
}: DownloadGenericPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const [{ pdf }, { default: GenericPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./GenericPdfDocument"),
      ]);
      const blob = await pdf(<GenericPdfDocument document={renderedDocument} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      className="rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-60"
    >
      {isGenerating ? "Generating PDF..." : "Download PDF"}
    </button>
  );
}
