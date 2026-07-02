"use client";

import { useState } from "react";

export default function CoverLetterButton({
  matchId,
  initialLetter,
}: {
  matchId: string;
  initialLetter?: string | null;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [letter, setLetter] = useState<string | null>(initialLetter ?? null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/matching/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al generar la carta");
        setLoading(false);
        return;
      }

      setLetter(data.coverLetter);
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setLoading(false);
  }

  async function handleCopy() {
    if (!letter) return;
    await navigator.clipboard.writeText(letter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="self-start rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
      >
        {loading
          ? "Redactando..."
          : letter
            ? "Regenerar carta de presentación"
            : "Generar carta de presentación"}
      </button>

      {error && <p className="text-xs text-red-600">{error}</p>}

      {letter && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <p className="whitespace-pre-line text-xs text-slate-700">
            {letter}
          </p>
          <button
            onClick={handleCopy}
            className="mt-2 text-xs font-medium text-slate-500 underline hover:text-slate-800"
          >
            {copied ? "¡Copiado!" : "Copiar texto"}
          </button>
        </div>
      )}
    </div>
  );
}
