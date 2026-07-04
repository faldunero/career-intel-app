"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  item_index: number | null;
  comment: string;
};

function CommentBubbles({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) return null;
  return (
    <div className="mt-1 flex flex-col gap-1">
      {comments.map((c) => (
        <p
          key={c.id}
          className="rounded-lg bg-blue-50 px-2 py-1 text-xs text-slate-700"
        >
          💬 <span className="font-medium">Tu coach:</span> {c.comment}
        </p>
      ))}
    </div>
  );
}

function ListBlock({
  title,
  items,
  section,
  commentsFor,
}: {
  title: string;
  items?: string[];
  section: string;
  commentsFor: (section: string, itemIndex: number | null) => Comment[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <ul className="mt-1 flex flex-col gap-2 pl-5 text-sm text-slate-700">
        {items.map((item, i) => (
          <li key={i} className="list-disc">
            {item}
            <CommentBubbles comments={commentsFor(section, i)} />
          </li>
        ))}
      </ul>
    </div>
  );
}

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

  function commentsFor(section: string | null, itemIndex: number | null) {
    return comments.filter(
      (c) => c.section === section && c.item_index === itemIndex
    );
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

  const generalComments = commentsFor(null, null);

  if (!canAnalyze) return null;

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button
        onClick={handleAnalyze}
        disabled={loading}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {loading
          ? "Comparando con tu CV..."
          : score !== null
            ? "Re-analizar"
            : "Comparar con mi CV"}
      </button>

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}

      {analysis && score !== null && (
        <div className="mt-3 flex flex-col gap-3">
          <p className="text-2xl font-semibold text-slate-900">
            {score}
            <span className="text-sm font-normal text-slate-400">
              /100 LinkedIn Score
            </span>
          </p>
          <p className="text-sm text-slate-600">{analysis.resumen}</p>

          {generalComments.length > 0 && (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Comentario general de tu coach
              </h4>
              <CommentBubbles comments={generalComments} />
            </div>
          )}

          <ListBlock
            title="Diferencias con tu CV"
            items={analysis.diferencias_con_cv}
            section="diferencias_con_cv"
            commentsFor={commentsFor}
          />
          <ListBlock
            title="Falta en LinkedIn"
            items={analysis.informacion_faltante_en_linkedin}
            section="informacion_faltante_en_linkedin"
            commentsFor={commentsFor}
          />
          <ListBlock
            title="Palabras clave faltantes"
            items={analysis.palabras_clave_faltantes}
            section="palabras_clave_faltantes"
            commentsFor={commentsFor}
          />
          <ListBlock
            title="Logros omitidos"
            items={analysis.logros_omitidos}
            section="logros_omitidos"
            commentsFor={commentsFor}
          />
          <ListBlock
            title="Recomendaciones priorizadas"
            items={analysis.recomendaciones_priorizadas}
            section="recomendaciones_priorizadas"
            commentsFor={commentsFor}
          />
        </div>
      )}
    </div>
  );
}
