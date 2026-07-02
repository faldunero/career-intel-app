"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Desglose = {
  experiencia: number | null;
  liderazgo: number | null;
  innovacion: number | null;
  proyectos_resultados: number | null;
  certificaciones: number | null;
  idiomas: number | null;
  networking: number | null;
  linkedin: number | null;
  ats: number | null;
  marca_personal: number | null;
};

type Analysis = {
  career_score: number;
  explicacion: string;
  desglose: Desglose;
  fortalezas: string[];
  oportunidades_mejora: string[];
};

const DIMENSION_LABELS: Record<keyof Desglose, string> = {
  experiencia: "Experiencia",
  liderazgo: "Liderazgo",
  innovacion: "Innovación",
  proyectos_resultados: "Proyectos y resultados",
  certificaciones: "Certificaciones",
  idiomas: "Idiomas",
  networking: "Networking",
  linkedin: "LinkedIn",
  ats: "ATS",
  marca_personal: "Marca personal",
};

export default function CareerScoreCard({
  initialScore,
  initialAnalysis,
}: {
  initialScore: number | null;
  initialAnalysis: Analysis | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(initialScore);
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis);
  const [expanded, setExpanded] = useState(false);

  async function handleCalculate() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/career-score/calculate", {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al calcular el Career Score");
        setLoading(false);
        return;
      }

      setScore(data.career_score);
      setAnalysis(data.analysis);
      setExpanded(true);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setLoading(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium text-slate-900">Career Score</h2>
          <p className="mt-1 text-sm text-slate-600">
            Puntaje consolidado de tu perfil y CV.
          </p>
        </div>
        {score !== null && (
          <p className="text-3xl font-semibold text-slate-900">{score}</p>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex items-center gap-3">
        <button
          onClick={handleCalculate}
          disabled={loading}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {loading
            ? "Calculando..."
            : score !== null
              ? "Recalcular"
              : "Calcular Career Score"}
        </button>
        {analysis && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-sm font-medium text-slate-500 underline hover:text-slate-800"
          >
            {expanded ? "Ocultar detalle" : "Ver detalle"}
          </button>
        )}
      </div>

      {expanded && analysis && (
        <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-600">{analysis.explicacion}</p>

          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {(Object.keys(DIMENSION_LABELS) as (keyof Desglose)[]).map(
              (key) => (
                <div key={key} className="text-xs">
                  <span className="text-slate-500">
                    {DIMENSION_LABELS[key]}:
                  </span>{" "}
                  <span className="font-medium text-slate-800">
                    {analysis.desglose[key] ?? "Sin datos"}
                  </span>
                </div>
              )
            )}
          </div>

          {analysis.fortalezas?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fortalezas
              </h4>
              <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                {analysis.fortalezas.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.oportunidades_mejora?.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Oportunidades de mejora
              </h4>
              <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                {analysis.oportunidades_mejora.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
