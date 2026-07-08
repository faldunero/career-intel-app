"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CommentList from "@/components/cv/comment-list";

type Comment = {
  id: string;
  comment: string;
  created_at: string;
};

export default function CvCommentThread({
  cvId,
  coachId,
  section,
  comments,
  placeholder,
}: {
  cvId: string;
  coachId: string;
  section: string | null;
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
      item_index: null,
      comment: text.trim(),
    });
    setSaving(false);
    setText("");
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      <CommentList comments={comments} authorLabel="Tu comentario" />

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="inline-flex w-fit items-center rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-900"
        >
          {comments.length > 0 ? "Agregar comentario" : "Comentar esta sección"}
        </button>
      ) : (
        <div className="flex flex-col gap-1.5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={2}
            autoFocus
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            placeholder={placeholder ?? "Tu comentario..."}
          />
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !text.trim()}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar"}
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
