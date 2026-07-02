"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type AtsAnalysis = {
  ats_score: number;
  score_explicado: string;
  fortalezas: string[];
  palabras_clave_faltantes: string[];
  que_eliminar: string[];
  que_agregar: string[];
  que_reescribir: string[];
  que_cuantificar: string[];
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? "bg-green-100 text-green-700"
      : score >= 50
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${color}`}>
      ATS Score: {score}/100
    </span>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function CvAnalysis({
  cvId,
  canAnalyze,
  initialScore,
  initialAnalysis,
}: {
  cvId: string;
  canAnalyze: boolean;
  initialScore: number | null;
  initialAnalysis: AtsAnalysis | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AtsAnalysis | null>(
    initialAnalysis
  );
  const [score, setScore] = useState<number | null>(initialScore);

  async function handleAnalyze() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cv/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al analizar el CV");
        setLoading(false);
        return;
      }

      setScore(data.ats_score);
      setAnalysis(data.analysis);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setLoading(false);
  }

  if (!canAnalyze) return null;

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      {!analysis && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Analizando con IA..." : "Analizar ATS con IA"}
        </button>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {analysis && score !== null && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <ScoreBadge score={score} />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="text-xs font-medium text-slate-500 underline hover:text-slate-800 disabled:opacity-50"
            >
              {loading ? "Re-analizando..." : "Re-analizar"}
            </button>
          </div>
          <p className="text-sm text-slate-600">{analysis.score_explicado}</p>

          <ListBlock title="Fortalezas" items={analysis.fortalezas} />
          <ListBlock
            title="Palabras clave faltantes"
            items={analysis.palabras_clave_faltantes}
          />
          <ListBlock title="Qué eliminar" items={analysis.que_eliminar} />
          <ListBlock title="Qué agregar" items={analysis.que_agregar} />
          <ListBlock title="Qué reescribir" items={analysis.que_reescribir} />
          <ListBlock
            title="Qué cuantificar"
            items={analysis.que_cuantificar}
          />
        </div>
      )}
    </div>
  );
}
