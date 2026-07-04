"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Comment = {
  id: string;
  comment: string;
  created_at: string;
};

export default function CvCommentThread({
  cvId,
  coachId,
  section,
  itemIndex,
  comments,
  placeholder,
}: {
  cvId: string;
  coachId: string;
  section: string | null;
  itemIndex: number | null;
  comments: Comment[];
  placeholder?: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    await supabase.from("cv_comments").insert({
      cv_id: cvId,
      coach_id: coachId,
      section,
      item_index: itemIndex,
      comment: text.trim(),
    });
    setSaving(false);
    setText("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="mt-1 flex flex-col gap-1">
      {comments.map((c) => (
        <p
          key={c.id}
          className="rounded-lg bg-slate-50 px-2 py-1 text-xs text-slate-600"
        >
          💬 {c.comment}
        </p>
      ))}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="w-fit text-left text-xs font-medium text-slate-400 underline hover:text-slate-700"
        >
          + Comentar
        </button>
      ) : (
        <div className="flex flex-col gap-1">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            autoFocus
            className="w-full rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none"
            placeholder={placeholder ?? "Tu comentario..."}
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
      )}
    </div>
  );
}
