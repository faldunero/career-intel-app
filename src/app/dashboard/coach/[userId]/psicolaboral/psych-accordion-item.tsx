"use client";

import { useState } from "react";
import PsychCommentThread from "./psych-comment-thread";
import PsychResultView, { type PsychResult } from "@/components/psych/result-view";

type Assignment = {
  id: string;
  title: string;
  result: PsychResult;
  completed_at: string | null;
};

type Comment = {
  id: string;
  comment: string;
  created_at: string;
};

export default function PsychAccordionItem({
  assignment,
  coachId,
  comments,
}: {
  assignment: Assignment;
  coachId: string;
  comments: Comment[];
}) {
  const [open, setOpen] = useState(false);
  const totalComments = comments.length;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-5 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">
            {assignment.title}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Completado el{" "}
            {assignment.completed_at
              ? new Date(assignment.completed_at).toLocaleDateString("es-CL", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {totalComments > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {totalComments} comentario{totalComments !== 1 ? "s" : ""}
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
        <div className="border-t border-slate-100 px-5 py-5">
          <PsychResultView result={assignment.result} />
          <div className="mt-5 border-t border-slate-100 pt-4">
            <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Tu comentario
            </h4>
            <PsychCommentThread
              assignmentId={assignment.id}
              coachId={coachId}
              comments={comments}
            />
          </div>
        </div>
      )}
    </div>
  );
}
