"use client";

import { useState } from "react";

export default function ExportDataCard({
  description,
}: {
  description: string;
}) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    const res = await fetch("/api/account/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mis-datos.json";
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-slate-900">
        Acceso y portabilidad
      </h2>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {downloading ? "Preparando…" : "Descargar mis datos"}
      </button>
    </div>
  );
}
