import { requireUsuario } from "@/lib/require-usuario";

export default async function UserNotesPage() {
  const { supabase, user } = await requireUsuario();

  const { data: notes } = await supabase
    .from("coach_notes")
    .select("id, note, created_at, seen_by_user")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const unseenIds = (notes ?? [])
    .filter((n) => !n.seen_by_user)
    .map((n) => n.id);
  if (unseenIds.length > 0) {
    await supabase
      .from("coach_notes")
      .update({ seen_by_user: true })
      .in("id", unseenIds);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Notas de tu coach
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Observaciones que tu coach decidió compartir contigo
        directamente. No todas sus notas de seguimiento son visibles
        aquí — solo las que marcó como compartidas.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {(!notes || notes.length === 0) && (
          <p className="text-sm text-slate-400">
            Tu coach todavía no ha compartido ninguna nota contigo.
          </p>
        )}
        {(notes ?? []).map((n) => (
          <div
            key={n.id}
            className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Tu coach
            </p>
            <p className="mt-1 text-sm leading-relaxed text-slate-700">
              {n.note}
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {new Date(n.created_at).toLocaleDateString("es-CL", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
