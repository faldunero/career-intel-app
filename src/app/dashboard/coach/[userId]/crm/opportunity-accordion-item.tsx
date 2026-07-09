"use client";

import { useState } from "react";
import Link from "next/link";
import OpportunityCommentThread from "./opportunity-comment-thread";

const STATUS_LABELS: Record<string, string> = {
  por_postular: "Por postular",
  postulado: "Postulado",
  entrevista: "En entrevista",
  oferta: "Oferta recibida",
  rechazado: "Rechazado",
  abandonado: "Abandonado",
};

const STATUS_COLORS: Record<string, string> = {
  por_postular: "bg-slate-100 text-slate-700",
  postulado: "bg-blue-100 text-blue-700",
  entrevista: "bg-amber-100 text-amber-700",
  oferta: "bg-green-100 text-green-700",
  rechazado: "bg-red-100 text-red-700",
  abandonado: "bg-slate-100 text-slate-500",
};

type Comment = {
  id: string;
  comment: string;
  created_at: string;
};

type Opportunity = {
  id: string;
  company: string | null;
  job_title: string | null;
  industry: string | null;
  source: string | null;
  url: string | null;
  status: string;
  priority: string | null;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
  created_at: string;
  job_match_id: string | null;
};

export default function OpportunityAccordionItem({
  opp,
  coachId,
  userId,
  comments,
}: {
  opp: Opportunity;
  coachId: string;
  userId: string;
  comments: Comment[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">
            {opp.job_title ?? "Cargo sin definir"}
            {opp.company ? ` — ${opp.company}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Ingresada el{" "}
            {new Date(opp.created_at).toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {comments.length > 0 && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {comments.length} comentario{comments.length !== 1 ? "s" : ""}
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[opp.status] ?? "bg-slate-100 text-slate-700"}`}
          >
            {STATUS_LABELS[opp.status] ?? opp.status}
          </span>
          <span
            className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
          >
            ›
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-5 pt-3">
          {opp.job_match_id && (
            <p>
              <Link
                href={`/dashboard/coach/${userId}/matching`}
                className="text-xs font-medium text-slate-500 hover:text-slate-800"
              >
                Creada desde un análisis de Matching — ver detalle completo
              </Link>
            </p>
          )}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
            {opp.industry && <span>Industria: {opp.industry}</span>}
            {opp.source && <span>Fuente: {opp.source}</span>}
            {opp.priority && <span>Prioridad: {opp.priority}</span>}
          </div>

          {opp.url && (
            <a
              href={opp.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-xs text-slate-500 hover:text-slate-800"
            >
              Ver publicación
            </a>
          )}

          {(opp.next_action || opp.next_action_date) && (
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium">Próxima acción:</span>{" "}
              {opp.next_action ?? "—"}
              {opp.next_action_date
                ? ` (${new Date(opp.next_action_date + "T00:00:00").toLocaleDateString("es-CL")})`
                : ""}
            </p>
          )}

          {opp.notes && (
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-medium">Notas del usuario:</span>{" "}
              {opp.notes}
            </p>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4">
            <OpportunityCommentThread
              opportunityId={opp.id}
              coachId={coachId}
              comments={comments}
              placeholder="¿Esta postulación va bien? ¿Qué acción priorizar?"
            />
          </div>
        </div>
      )}
    </div>
  );
}
