"use client";

import { useState } from "react";

export default function AtsScoreInfoModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-300 text-[10px] font-semibold text-slate-500 hover:border-slate-500 hover:text-slate-800"
        aria-label="¿Cómo se calcula el ATS Score?"
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
                ¿Cómo se calcula el ATS Score?
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Una IA analiza el texto de tu CV más reciente simulando
              exactamente cómo lo leería un ATS (el software que filtra
              CVs antes de que los vea una persona). Evalúa:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm text-slate-600">
              <li>Palabras clave relevantes para tu cargo objetivo</li>
              <li>Formato y estructura del documento</li>
              <li>
                Uso de tablas o columnas (perjudica el parseo automático)
              </li>
              <li>Logros con métricas concretas vs. descripciones vagas</li>
              <li>Verbos de acción, competencias y tecnologías mencionadas</li>
              <li>Extensión general del documento</li>
            </ul>
            <p className="mt-3 text-sm text-slate-600">
              La IA nunca inventa experiencia que no esté en tu CV — si
              algo no aparece, lo marca como ausente y eso afecta el
              puntaje. El detalle completo (qué agregar, eliminar o
              reescribir) está en la sección &quot;Mi CV&quot;.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
