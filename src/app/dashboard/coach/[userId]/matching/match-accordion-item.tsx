"use client";

import { useState } from "react";
import MatchingCommentThread from "./matching-comment-thread";

type MatchAnalysis = {
  fortalezas?: string[];
  brechas?: string[];
  riesgos?: string[];
  acciones_prioritarias?: string[];
};

type Comment = {
  id: string;
  job_match_id: string;
  section: string | null;
  comment: string;
  created_at: string;
};

type Match = {
  id: string;
  company: string | null;
  job_title: string | null;
  job_description: string | null;
  matching_general: number | null;
  matching_ats: number | null;
  matching_tecnico: number | null;
  matching_liderazgo: number | null;
  matching_cultural: number | null;
  matching_experiencia: number | null;
  analysis: MatchAnalysis | null;
  created_at: string;
};

const SECTION_LABELS: Record<string, string> = {
  fortalezas: "Fortalezas",
  brechas: "Brechas",
  riesgos: "Riesgos",
  acciones_prioritarias: "Acciones prioritarias",
};

function ScoreDot({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

function SubScore({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <ScoreDot score={score} />
      {label}: {score}
    </span>
  );
}

export default function MatchAccordionItem({
  match,
  coachId,
  comments,
}: {
  match: Match;
  coachId: string;
  comments: Comment[];
}) {
  const [open, setOpen] = useState(false);
  const [showDescription, setShowDescription] = useState(false);
  const analysis = match.analysis;

  function commentsFor(section: string | null) {
    return comments.filter((c) => c.section === section);
  }

  const totalComments = comments.length;

  const sections: Array<keyof MatchAnalysis> = [
    "fortalezas",
    "brechas",
    "riesgos",
    "acciones_prioritarias",
  ];

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">
            {match.job_title ?? "Cargo no identificado"}
            {match.company ? ` — ${match.company}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Ingresada el{" "}
            {new Date(match.created_at).toLocaleDateString("es-CL", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {totalComments > 0 && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {totalComments} comentario{totalComments !== 1 ? "s" : ""}
            </span>
          )}
          {match.matching_general !== null && (
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
              {match.matching_general}/100
            </span>
          )}
          <span
            className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
          >
            ›
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-5">
          {match.job_description && (
            <div className="mt-3">
              <button
                onClick={() => setShowDescription((v) => !v)}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-800"
              >
                📄 {showDescription ? "Ocultar" : "Ver"} descripción original de la vacante
              </button>
              {showDescription && (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  {match.job_description}
                </p>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-wrap gap-3">
            <SubScore label="ATS" score={match.matching_ats} />
            <SubScore label="Técnico" score={match.matching_tecnico} />
            <SubScore label="Liderazgo" score={match.matching_liderazgo} />
            <SubScore label="Cultural" score={match.matching_cultural} />
            <SubScore label="Experiencia" score={match.matching_experiencia} />
          </div>

          {!analysis && (
            <p className="mt-3 text-xs text-slate-400">
              Sin análisis detallado disponible para esta vacante.
            </p>
          )}

          {analysis &&
            sections.map((section) => {
              const items = analysis[section] as string[] | undefined;
              if (!items || items.length === 0) return null;
              const sectionComments = commentsFor(section);
              return (
                <div key={section} className="border-t border-slate-100 py-5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {SECTION_LABELS[section]}
                    </h4>
                    {sectionComments.length > 0 && (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {sectionComments.length} comentario
                        {sectionComments.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  <ul className="mt-3 flex flex-col gap-2 pl-5 text-sm text-slate-700">
                    {items.map((item, i) => (
                      <li key={i} className="list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>
                  <MatchingCommentThread
                    jobMatchId={match.id}
                    coachId={coachId}
                    section={section}
                    comments={sectionComments}
                    placeholder={`Tu opinión sobre "${SECTION_LABELS[section]}"...`}
                  />
                </div>
              );
            })}

          <div className="border-t border-slate-100 pt-5">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Comentario general de esta vacante
            </h4>
            <MatchingCommentThread
              jobMatchId={match.id}
              coachId={coachId}
              section={null}
              comments={commentsFor(null)}
              placeholder="¿Esta vacante vale la pena? ¿Qué priorizar antes de postular?"
            />
          </div>
        </div>
      )}
    </div>
  );
}
