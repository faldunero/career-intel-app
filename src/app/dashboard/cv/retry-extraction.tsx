"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RetryExtraction({ cvId }: { cvId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetry() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cv/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al reintentar");
        setLoading(false);
        return;
      }

      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setLoading(false);
  }

  return (
    <div className="mt-2 flex flex-col gap-1">
      <button
        onClick={handleRetry}
        disabled={loading}
        className="self-start text-xs font-medium text-slate-600 underline hover:text-slate-900 disabled:opacity-50"
      >
        {loading ? "Reintentando..." : "Reintentar extracción"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
