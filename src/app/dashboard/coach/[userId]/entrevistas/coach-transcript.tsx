"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Message = { role: "user" | "assistant"; content: string };
type Comment = {
  id: string;
  message_index: number | null;
  comment: string;
  created_at: string;
};

function AddCommentBox({
  sessionId,
  coachId,
  messageIndex,
}: {
  sessionId: string;
  coachId: string;
  messageIndex: number | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    await supabase.from("interview_comments").insert({
      session_id: sessionId,
      coach_id: coachId,
      message_index: messageIndex,
      comment: text.trim(),
    });
    setSaving(false);
    setText("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="mt-1 text-xs font-medium text-slate-400 underline hover:text-slate-700"
      >
        + Comentar
      </button>
    );
  }

  return (
    <div className="mt-1 flex flex-col gap-1">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        autoFocus
        className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none"
        placeholder="Tu comentario sobre esta respuesta..."
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={saving || !text.trim()}
          className="rounded-lg bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "..." : "Guardar"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

export default function CoachTranscript({
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
  const generalComments = comments.filter((c) => c.message_index === null);
  const commentsByIndex = new Map<number, Comment[]>();
  for (const c of comments) {
    if (c.message_index !== null) {
      const list = commentsByIndex.get(c.message_index) ?? [];
      list.push(c);
      commentsByIndex.set(c.message_index, list);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Comentario general
        </p>
        {generalComments.map((c) => (
          <p key={c.id} className="mt-1 text-sm text-slate-700">
            {c.comment}
          </p>
        ))}
        <AddCommentBox
          sessionId={sessionId}
          coachId={coachId}
          messageIndex={null}
        />
      </div>

      {messages.map((m, i) => {
        const msgComments = commentsByIndex.get(i) ?? [];
        return (
          <div
            key={i}
            className={`rounded-lg p-3 text-sm ${
              m.role === "assistant"
                ? "bg-slate-100 text-slate-800"
                : "ml-6 bg-white border border-slate-200"
            }`}
          >
            <p className="text-xs font-medium text-slate-400">
              {m.role === "assistant" ? "Entrevistador" : "Candidato"}
            </p>
            <p className="mt-1">{m.content}</p>

            {m.role === "user" && (
              <div className="mt-2 border-t border-slate-100 pt-2">
                {msgComments.map((c) => (
                  <p
                    key={c.id}
                    className="mb-1 rounded bg-amber-50 px-2 py-1 text-xs text-amber-800"
                  >
                    {c.comment}
                  </p>
                ))}
                <AddCommentBox
                  sessionId={sessionId}
                  coachId={coachId}
                  messageIndex={i}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
