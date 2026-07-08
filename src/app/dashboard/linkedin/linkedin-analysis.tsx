"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ScoreRing from "@/components/cv/score-ring";
import AnalysisSection from "@/components/cv/analysis-section";
import CommentList from "@/components/cv/comment-list";

type Analysis = {
  linkedin_score: number;
  resumen: string;
  diferencias_con_cv: string[];
  informacion_faltante_en_linkedin: string[];
  palabras_clave_faltantes: string[];
  logros_omitidos: string[];
  recomendaciones_priorizadas: string[];
};

type Comment = {
  id: string;
  section: string | null;
  comment: string;
};

const SECTION_ORDER: Array<{ key: keyof Analysis; title: string }> = [
  { key: "diferencias_con_cv", title: "Diferencias con tu CV" },
  { key: "informacion_faltante_en_linkedin", title: "Falta en LinkedIn" },
  { key: "palabras_clave_faltantes", title: "Palabras clave faltantes" },
  { key: "logros_omitidos", title: "Logros omitidos" },
  { key: "recomendaciones_priorizadas", title: "Recomendaciones priorizadas" },
];

export default function LinkedinAnalysis({
  linkedinId,
  canAnalyze,
  initialScore,
  initialAnalysis,
  comments,
}: {
  linkedinId: string;
  canAnalyze: boolean;
  initialScore: number | null;
  initialAnalysis: Analysis | null;
  comments: Comment[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(initialScore);
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis);

  function commentsFor(section: string | null) {
    return comments.filter((c) => c.section === section);
  }

  async function handleAnalyze() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/linkedin/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al analizar");
        setLoading(false);
        return;
      }

      setScore(data.linkedin_score);
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
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {loading
          ? "Comparando con tu CV…"
          : score !== null
            ? "Re-analizar"
            : "Comparar con mi CV"}
      </button>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {analysis && score !== null && (
        <div className="mt-4 flex flex-col gap-4">
          <ScoreRing score={score} label="LinkedIn Score" size="sm" />
          <p className="text-sm text-slate-600">{analysis.resumen}</p>

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
