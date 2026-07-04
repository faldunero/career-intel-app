"use client";

import { useState } from "react";
import DeleteMatchButton from "./delete-match-button";
import ConvertToOpportunityButton from "./convert-to-opportunity-button";
import CoverLetterButton from "./cover-letter-button";

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

function CommentBubbles({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) return null;
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {comments.map((c) => (
        <p
          key={c.id}
          className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-slate-700"
        >
          💬 <span className="font-medium">Tu coach:</span> {c.comment}
        </p>
      ))}
    </div>
  );
}

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
          {analysis && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-3">
              {match.matching_ats !== null && <span>ATS: {match.matching_ats}</span>}
              <span>Técnico: {match.matching_tecnico ?? "—"}</span>
              <span>Liderazgo: {match.matching_liderazgo ?? "N/A"}</span>
              <span>Cultural: {match.matching_cultural ?? "—"}</span>
              <span>Experiencia: {match.matching_experiencia ?? "—"}</span>
            </div>
          )}

          {analysis &&
            sections.map((section) => {
              const items = analysis[section] as string[] | undefined;
              if (!items || items.length === 0) return null;
              return (
                <div key={section} className="mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {SECTION_LABELS[section]}
                  </h4>
                  <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                    {items.map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                  <CommentBubbles comments={commentsFor(section)} />
                </div>
              );
            })}

          <CommentBubbles comments={commentsFor(null)} />

          <div className="mt-4 flex flex-col gap-3">
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
