"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PsychResultView, { type PsychResult } from "./result-view";

export default function ChoiceForm({
  assignmentId,
  questions,
}: {
  assignmentId: string;
  questions: { id: string; text: string; options: string[] }[];
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PsychResult | null>(null);

  const answeredCount = Object.keys(answers).length;
  const complete = answeredCount === questions.length;

  async function handleSubmit() {
    if (!complete) return;
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/psych/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, answers }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al enviar tus respuestas");
        setSubmitting(false);
        return;
      }

      setResult(data.result);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setSubmitting(false);
  }

  if (result) {
    return <PsychResultView result={result} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-10 -mx-6 border-b border-slate-100 bg-white/95 px-6 py-3 backdrop-blur">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            {answeredCount} de {questions.length} respondidas
          </span>
          <span>{Math.round((answeredCount / questions.length) * 100)}%</span>
        </div>
        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-slate-900 transition-all"
            style={{ width: `${(answeredCount / questions.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {questions.map((q, i) => (
          <div key={q.id}>
            <p className="text-sm font-medium text-slate-900">
              <span className="mr-2 text-slate-400">{i + 1}.</span>
              {q.text}
            </p>
            <div className="mt-3 flex flex-col gap-2">
              {q.options.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() =>
                    setAnswers((prev) => ({ ...prev, [q.id]: idx }))
                  }
                  className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                    answers[q.id] === idx
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-700 hover:border-slate-400"
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!complete || submitting}
        className="self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {submitting
          ? "Calculando tu resultado…"
          : complete
            ? "Enviar respuestas"
            : `Responde las ${questions.length - answeredCount} restantes`}
      </button>
    </div>
  );
}
