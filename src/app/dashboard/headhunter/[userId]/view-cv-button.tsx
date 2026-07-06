"use client";

import { useState } from "react";

export default function ViewCvButton({ cvId }: { cvId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    const confirmed = confirm(
      "Vas a descargar el CV de este candidato. Esta acción queda registrada y se notifica al administrador con fecha y hora. ¿Quieres continuar?"
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/headhunter/download-cv", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo descargar el archivo");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setLoading(false);
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {loading ? "Preparando descarga..." : "Descargar CV"}
      </button>
      <p className="mt-1 text-xs text-slate-400">
        Descargar (no solo previsualizar) queda registrado y se
        notifica al administrador.
      </p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
