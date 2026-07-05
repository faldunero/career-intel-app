"use client";

import { useState } from "react";

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
  ats: "Optimización ATS",
  marca_personal: "Marca personal",
};

export default function CareerScoreInfoModal({
  score,
  analysis,
  realAtsScore,
}: {
  score: number;
  analysis: Analysis;
  realAtsScore: number | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="ml-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-xs font-semibold text-slate-500 hover:border-slate-500 hover:text-slate-800"
        aria-label="¿Cómo se calcula el Career Score?"
      >
        i
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                ¿Cómo se calcula tu Career Score?
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Una IA evalúa tu perfil y tu CV en <strong>10 dimensiones</strong>{" "}
              y calcula un promedio ponderado. Dos dimensiones
              (Networking y LinkedIn) siempre quedan sin evaluar aquí
              porque este cálculo no tiene acceso a datos reales de esos
              módulos — eso se evalúa aparte cuando analizas tu
              LinkedIn.
            </p>

            <p className="mt-2 text-sm text-slate-600">{analysis.explicacion}</p>

            <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 rounded-lg bg-slate-50 p-3 sm:grid-cols-3">
              {(Object.keys(DIMENSION_LABELS) as (keyof Desglose)[]).map(
                (key) => (
                  <div key={key} className="text-xs">
                    <span className="text-slate-500">
                      {DIMENSION_LABELS[key]}:
                    </span>{" "}
                    <span className="font-medium text-slate-800">
                      {analysis.desglose[key] ?? "No evaluado"}
                    </span>
                  </div>
                )
              )}
            </div>

            <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/50 p-3">
              <p className="text-xs text-slate-600">
                <strong>Sobre &quot;Optimización ATS&quot; arriba:</strong> es
                el juicio de esta misma IA como parte del promedio general
                (
                {analysis.desglose.ats ?? "no evaluado"}
                ). Es distinto del <strong>ATS Score real de tu CV</strong>{" "}
                (
                {realAtsScore !== null ? realAtsScore : "no calculado todavía"}
                ), que viene de un análisis específico y detallado de tu
                documento — ese es el que te dice exactamente qué
                agregar, quitar o reescribir. Puedes verlo con detalle en
                la sección &quot;Mi CV&quot;.
              </p>
            </div>

            {analysis.fortalezas?.length > 0 && (
              <div className="mt-4">
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
              <div className="mt-4">
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

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600">Career Score final:</p>
              <p className="text-2xl font-semibold text-slate-900">{score}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
