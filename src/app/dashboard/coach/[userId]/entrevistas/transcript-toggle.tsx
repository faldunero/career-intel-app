"use client";

import { useState } from "react";
import CoachTranscript from "./coach-transcript";

type Message = { role: "user" | "assistant"; content: string };
type Comment = {
  id: string;
  message_index: number | null;
  comment: string;
  created_at: string;
};

export default function TranscriptToggle({
  sessionId,
  coachId,
  messages,
  comments,
}: {
  sessionId: string;
  coachId: string;
  messages: Message[];
  comments: Comment[];
}) {
  const [open, setOpen] = useState(false);

  if (messages.length === 0) {
    return (
      <p className="mt-2 text-xs text-slate-400">
        Todavía no hay mensajes en esta entrevista.
      </p>
    );
  }

  return (
    <div className="mt-3 border-t border-slate-100 pt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs font-medium text-slate-500 underline hover:text-slate-800"
      >
        {open
          ? "Ocultar transcripción"
          : `Ver transcripción y comentar (${messages.length} mensajes)`}
      </button>
      {open && (
        <div className="mt-3">
          <CoachTranscript
            sessionId={sessionId}
            coachId={coachId}
            messages={messages}
            comments={comments}
          />
        </div>
      )}
    </div>
  );
}
