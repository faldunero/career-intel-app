"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScoreRing from "@/components/cv/score-ring";
import AnalysisSection from "@/components/cv/analysis-section";
import CommentList from "@/components/cv/comment-list";

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

type Comment = {
  id: string;
  section: string | null;
  comment: string;
};

const SECTION_ORDER: Array<{ key: keyof AtsAnalysis; title: string }> = [
  { key: "fortalezas", title: "Fortalezas" },
  { key: "palabras_clave_faltantes", title: "Palabras clave faltantes" },
  { key: "que_eliminar", title: "Qué eliminar" },
  { key: "que_agregar", title: "Qué agregar" },
  { key: "que_reescribir", title: "Qué reescribir" },
  { key: "que_cuantificar", title: "Qué cuantificar" },
];

export default function CvAnalysis({
  cvId,
  canAnalyze,
  initialScore,
  initialAnalysis,
  comments,
}: {
  cvId: string;
  canAnalyze: boolean;
  initialScore: number | null;
  initialAnalysis: AtsAnalysis | null;
  comments: Comment[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AtsAnalysis | null>(
    initialAnalysis
  );
  const [score, setScore] = useState<number | null>(initialScore);

  function commentsFor(section: string | null) {
    return comments.filter((c) => c.section === section);
  }

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

  const generalComments = commentsFor(null);

  if (!canAnalyze) return null;

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      {!analysis && (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {loading ? "Analizando con IA…" : "Analizar ATS con IA"}
        </button>
      )}

      {error && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {error}
        </p>
      )}

      {analysis && score !== null && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <ScoreRing score={score} label="ATS Score" size="sm" />
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="text-xs font-medium text-slate-500 hover:text-slate-800 disabled:opacity-50"
            >
              {loading ? "Re-analizando…" : "Re-analizar"}
            </button>
          </div>
          <p className="text-sm text-slate-600">{analysis.score_explicado}</p>

          {generalComments.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Comentario general de tu coach
              </h4>
              <CommentList comments={generalComments} />
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {SECTION_ORDER.map(({ key, title }) => (
              <AnalysisSection
                key={key}
                title={title}
                section={key}
                items={analysis[key] as string[]}
              >
                <CommentList comments={commentsFor(key)} />
              </AnalysisSection>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
