"use client";

import { useState } from "react";
import DeleteMatchButton from "./delete-match-button";
import ConvertToOpportunityButton from "./convert-to-opportunity-button";
import CoverLetterButton from "./cover-letter-button";
import ScoreBar from "@/components/cv/score-bar";
import AnalysisSection from "@/components/cv/analysis-section";
import CommentList from "@/components/cv/comment-list";

type MatchAnalysis = {
  fortalezas?: string[];
  brechas?: string[];
  riesgos?: string[];
  acciones_prioritarias?: string[];
};

type Comment = {
  id: string;
  section: string | null;
  comment: string;
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

export default function MatchHistoryItem({
  match,
  userId,
  comments,
}: {
  match: {
    id: string;
    job_title: string | null;
    company: string | null;
    matching_general: number | null;
    matching_ats: number | null;
    matching_tecnico: number | null;
    matching_liderazgo: number | null;
    matching_cultural: number | null;
    matching_experiencia: number | null;
    analysis: MatchAnalysis | null;
    created_at: string;
    cover_letter: string | null;
  };
  userId: string;
  comments: Comment[];
}) {
  const [open, setOpen] = useState(false);
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
        <div className="border-t border-slate-100 px-4 pb-5 pt-4">
          {analysis && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <ScoreBar label="ATS" score={match.matching_ats} />
              <ScoreBar label="Técnico" score={match.matching_tecnico} />
              <ScoreBar label="Liderazgo" score={match.matching_liderazgo} />
              <ScoreBar label="Cultural (estimado)" score={match.matching_cultural} />
              <ScoreBar label="Experiencia" score={match.matching_experiencia} />
            </div>
          )}

          {analysis && (
            <div className="mt-2 divide-y divide-slate-100">
              {SECTIONS.map((section) => {
                const items = analysis[section] as string[] | undefined;
                return (
                  <AnalysisSection
                    key={section}
                    title={SECTION_LABELS[section]}
                    section={section}
                    items={items}
                  >
                    <CommentList comments={commentsFor(section)} />
                  </AnalysisSection>
                );
              })}
            </div>
          )}

          {commentsFor(null).length > 0 && (
            <div className="border-t border-slate-100 pt-4">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Comentario general de tu coach
              </h4>
              <CommentList comments={commentsFor(null)} />
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 border-t border-slate-100 pt-4">
            <ConvertToOpportunityButton
              matchId={match.id}
              userId={userId}
              jobTitle={match.job_title}
              company={match.company}
            />
            <CoverLetterButton
              matchId={match.id}
              initialLetter={match.cover_letter}
            />
            <DeleteMatchButton matchId={match.id} />
          </div>
        </div>
      )}
    </div>
  );
}
