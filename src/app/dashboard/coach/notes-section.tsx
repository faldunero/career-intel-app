"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Note = {
  id: string;
  note: string;
  created_at: string;
  visible_to_user: boolean;
};

export default function NotesSection({
  coachId,
  userId,
  initialNotes,
}: {
  coachId: string;
  userId: string;
  initialNotes: Note[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [text, setText] = useState("");
  const [shareNew, setShareNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  async function handleAdd() {
    if (!text.trim()) return;
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("coach_notes").insert({
      coach_id: coachId,
      user_id: userId,
      note: text.trim(),
      visible_to_user: shareNew,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setText("");
    setShareNew(false);
    router.refresh();
  }

  async function toggleVisibility(noteId: string, current: boolean) {
    setTogglingId(noteId);
    await supabase
      .from("coach_notes")
      .update({ visible_to_user: !current })
      .eq("id", noteId);
    setTogglingId(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Agrega una observación de seguimiento..."
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={shareNew}
            onChange={(e) => setShareNew(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          Compartir esta nota con el usuario (si no marcas esto, queda
          privada — solo tú la ves)
        </label>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          onClick={handleAdd}
          disabled={saving || !text.trim()}
          className="self-start rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Agregar nota"}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {initialNotes.length === 0 && (
          <p className="text-xs text-slate-400">Sin notas todavía.</p>
        )}
        {initialNotes.map((n) => (
          <div key={n.id} className="rounded-lg bg-slate-50 p-3 text-xs">
            <p className="text-slate-700">{n.note}</p>
            <div className="mt-2 flex items-center justify-between">
              <p className="text-slate-400">
                {new Date(n.created_at).toLocaleDateString("es-CL", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
              <button
                onClick={() => toggleVisibility(n.id, n.visible_to_user)}
                disabled={togglingId === n.id}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium transition disabled:opacity-50 ${
                  n.visible_to_user
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                }`}
              >
                {togglingId === n.id
                  ? "..."
                  : n.visible_to_user
                    ? "👁 Compartida — click para hacer privada"
                    : "🔒 Privada — click para compartir"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
