"use client";

import { useState } from "react";
import type { NdaFormData } from "@/lib/nda-types";

interface DownloadPdfButtonProps {
  data: NdaFormData;
  fileName: string;
}

export default function DownloadPdfButton({ data, fileName }: DownloadPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const [{ pdf }, { default: NdaPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("./NdaPdfDocument"),
      ]);
      const blob = await pdf(<NdaPdfDocument data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
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
