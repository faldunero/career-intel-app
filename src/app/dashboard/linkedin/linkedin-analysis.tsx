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

export default function LinkedinAnalysis({
  linkedinId,
  canAnalyze,
  initialScore,
  initialAnalysis,
}: {
  linkedinId: string;
  canAnalyze: boolean;
  initialScore: number | null;
  initialAnalysis: Analysis | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(initialScore);
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis);

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
          <ListBlock
            title="Diferencias con tu CV"
            items={analysis.diferencias_con_cv}
          />
          <ListBlock
            title="Falta en LinkedIn"
            items={analysis.informacion_faltante_en_linkedin}
          />
          <ListBlock
            title="Palabras clave faltantes"
            items={analysis.palabras_clave_faltantes}
          />
          <ListBlock title="Logros omitidos" items={analysis.logros_omitidos} />
          <ListBlock
            title="Recomendaciones priorizadas"
            items={analysis.recomendaciones_priorizadas}
          />
        </div>
      )}
    </div>
  );
}
