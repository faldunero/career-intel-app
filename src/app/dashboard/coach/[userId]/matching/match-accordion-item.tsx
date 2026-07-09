"use client";

import { useState } from "react";
import MatchingCommentThread from "./matching-comment-thread";
import ScoreBar from "@/components/cv/score-bar";
import AnalysisSection from "@/components/cv/analysis-section";

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

const SECTIONS: Array<keyof MatchAnalysis> = [
  "fortalezas",
  "brechas",
  "riesgos",
  "acciones_prioritarias",
];

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
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
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
                {showDescription ? "Ocultar" : "Ver"} descripción original de la vacante
              </button>
              {showDescription && (
                <p className="mt-2 whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
                  {match.job_description}
                </p>
              )}
            </div>
          )}

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ScoreBar label="ATS" score={match.matching_ats} />
            <ScoreBar label="Técnico" score={match.matching_tecnico} />
            <ScoreBar label="Liderazgo" score={match.matching_liderazgo} />
            <ScoreBar label="Cultural (estimado)" score={match.matching_cultural} />
            <ScoreBar label="Experiencia" score={match.matching_experiencia} />
          </div>

          {!analysis && (
            <p className="mt-3 text-xs text-slate-400">
              Sin análisis detallado disponible para esta vacante.
            </p>
          )}

          {analysis && (
            <div className="mt-2 divide-y divide-slate-100">
              {SECTIONS.map((section) => {
                const items = analysis[section] as string[] | undefined;
                const sectionComments = commentsFor(section);
                return (
                  <AnalysisSection
                    key={section}
                    title={SECTION_LABELS[section]}
                    section={section}
                    items={items}
                    commentCount={sectionComments.length}
                  >
                    <MatchingCommentThread
                      jobMatchId={match.id}
                      coachId={coachId}
                      section={section}
                      comments={sectionComments}
                      placeholder={`Tu opinión sobre "${SECTION_LABELS[section]}"...`}
                    />
                  </AnalysisSection>
                );
              })}
            </div>
          )}

          <div className="border-t border-slate-100 pt-5">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
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
