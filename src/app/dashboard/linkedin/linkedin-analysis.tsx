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
  comment: string;
};

const CHIP_SECTIONS = new Set(["palabras_clave_faltantes"]);

function CommentBubbles({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {comments.map((c) => (
        <p
          key={c.id}
          className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-slate-700"
        >
          💬 <span className="font-medium">Tu coach:</span> {c.comment}
        </p>
      ))}
    </div>
  );
}

function KeywordChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function SectionBlock({
  title,
  items,
  section,
  commentsFor,
}: {
  title: string;
  items?: string[];
  section: string;
  commentsFor: (section: string) => Comment[];
}) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <div className="mt-2">
        {CHIP_SECTIONS.has(section) ? (
          <KeywordChips items={items} />
        ) : (
          <ul className="flex flex-col gap-2 pl-5 text-sm text-slate-700">
            {items.map((item, i) => (
              <li key={i} className="list-disc">
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
      <CommentBubbles comments={commentsFor(section)} />
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
        <div className="mt-3 flex flex-col gap-4">
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

          <SectionBlock
            title="Diferencias con tu CV"
            items={analysis.diferencias_con_cv}
            section="diferencias_con_cv"
            commentsFor={commentsFor}
          />
          <SectionBlock
            title="Falta en LinkedIn"
            items={analysis.informacion_faltante_en_linkedin}
            section="informacion_faltante_en_linkedin"
            commentsFor={commentsFor}
          />
          <SectionBlock
            title="Palabras clave faltantes"
            items={analysis.palabras_clave_faltantes}
            section="palabras_clave_faltantes"
            commentsFor={commentsFor}
          />
          <SectionBlock
            title="Logros omitidos"
            items={analysis.logros_omitidos}
            section="logros_omitidos"
            commentsFor={commentsFor}
          />
          <SectionBlock
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
