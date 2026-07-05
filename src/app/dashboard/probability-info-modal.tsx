"use client";

import { useState } from "react";

type Input = {
  label: string;
  value: number | null;
  note?: string;
};

export default function ProbabilityInfoModal({
  result,
  inputs,
}: {
  result: number | null;
  inputs: Input[];
}) {
  const [open, setOpen] = useState(false);
  const available = inputs.filter((i) => i.value !== null);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500 hover:border-slate-500 hover:text-slate-800"
        aria-label="¿Cómo se calcula este número?"
      >
        i
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                ¿Cómo se calcula este número?
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Es un promedio simple de los puntajes que ya tienes
              calculados. No es un modelo predictivo real ni usa datos
              de otras personas — solo combina tus propios resultados.
            </p>

            <div className="mt-4 flex flex-col gap-2">
              {inputs.map((input, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-sm"
                >
                  <span className="text-slate-600">{input.label}</span>
                  <span
                    className={
                      input.value !== null
                        ? "font-medium text-slate-900"
                        : "text-slate-400"
                    }
                  >
                    {input.value !== null ? input.value : "No disponible todavía"}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-sm text-slate-600">
                Promedio de {available.length} puntaje
                {available.length !== 1 ? "s" : ""} disponible
                {available.length !== 1 ? "s" : ""}:
              </p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">
                {result !== null ? `${result}%` : "Sin datos suficientes"}
              </p>
              {inputs.some((i) => i.value === null) && (
                <p className="mt-2 text-xs text-slate-400">
                  Los puntajes marcados como &quot;No disponible&quot; no
                  entran al promedio — a medida que los completes, esta
                  estimación se va a ajustar.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
