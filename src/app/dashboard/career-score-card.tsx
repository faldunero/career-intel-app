"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CareerScoreInfoModal from "./career-score-info-modal";

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

export default function CareerScoreCard({
  initialScore,
  initialAnalysis,
  realAtsScore,
}: {
  initialScore: number | null;
  initialAnalysis: Analysis | null;
  realAtsScore: number | null;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(initialScore);
  const [analysis, setAnalysis] = useState<Analysis | null>(initialAnalysis);

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
          <div className="flex items-center">
            <p className="text-3xl font-semibold text-slate-900">{score}</p>
            {analysis && (
              <CareerScoreInfoModal
                score={score}
                analysis={analysis}
                realAtsScore={realAtsScore}
              />
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4">
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
      </div>
    </div>
  );
}
