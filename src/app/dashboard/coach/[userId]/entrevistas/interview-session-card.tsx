"use client";

import { useState } from "react";
import TranscriptToggle from "./transcript-toggle";

type Message = { role: "user" | "assistant"; content: string };
type Comment = {
  id: string;
  session_id: string;
  message_index: number | null;
  comment: string;
  created_at: string;
};
type Feedback = {
  puntaje?: number;
  evaluacion_general?: string;
  fortalezas?: string[];
  areas_de_mejora?: string[];
};

const TYPE_LABELS: Record<string, string> = {
  recruiter: "Recruiter",
  rrhh: "RR.HH.",
  hiring_manager: "Hiring Manager",
  director: "Director",
  ceo: "CEO",
  panel_tecnico: "Panel Técnico",
};

const STATUS_LABELS: Record<string, string> = {
  disponible: "Disponible (aún no empieza)",
  en_progreso: "En progreso",
  completada: "Completada",
};

const STATUS_COLORS: Record<string, string> = {
  disponible: "bg-slate-100 text-slate-700",
  en_progreso: "bg-amber-100 text-amber-700",
  completada: "bg-green-100 text-green-700",
};

export default function InterviewSessionCard({
  session,
  coachId,
  comments,
}: {
  session: {
    id: string;
    interview_type: string;
    target_role: string | null;
    status: string;
    messages: Message[];
    feedback: Feedback | null;
    created_at: string;
  };
  coachId: string;
  comments: Comment[];
}) {
  const [open, setOpen] = useState(false);
  const feedback = session.feedback;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between p-4 text-left"
      >
        <div>
          <p className="text-sm font-medium text-slate-900">
            {TYPE_LABELS[session.interview_type] ?? session.interview_type}
            {session.target_role ? ` — ${session.target_role}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {new Date(session.created_at).toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {feedback?.puntaje !== undefined && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
              {feedback.puntaje}/100
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[session.status] ?? ""}`}
          >
            {STATUS_LABELS[session.status] ?? session.status}
          </span>
          <span
            className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
          >
            ›
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4">
          {feedback && (
            <div className="pt-3">
              {feedback.evaluacion_general && (
                <p className="text-sm text-slate-600">
                  {feedback.evaluacion_general}
                </p>
              )}
              {feedback.fortalezas && feedback.fortalezas.length > 0 && (
                <div className="mt-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fortalezas
                  </h4>
                  <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                    {feedback.fortalezas.map((f, i) => (
                      <li key={i}>{f}</li>
                    ))}
                  </ul>
                </div>
              )}
              {feedback.areas_de_mejora &&
                feedback.areas_de_mejora.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Áreas de mejora
                    </h4>
                    <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                      {feedback.areas_de_mejora.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                )}
            </div>
          )}

          <TranscriptToggle
            sessionId={session.id}
            coachId={coachId}
            messages={session.messages ?? []}
            comments={comments}
          />
        </div>
      )}
    </div>
  );
}
