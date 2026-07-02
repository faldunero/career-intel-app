import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import NotesSection from "../../notes-section";

export default async function CoachUserNotesPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, coachId, profile } = await getCoachViewedUser(userId);

  const { data: notes } = await supabase
    .from("coach_notes")
    .select("id, note, created_at")
    .eq("user_id", userId)
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/coach"
        className="text-sm text-slate-500 underline hover:text-slate-800"
      >
        ← Volver a mis usuarios
      </Link>
      <p className="mt-3 text-sm text-slate-500">
        {profile.full_name ?? profile.email}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">
        Observaciones de seguimiento
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Solo tú (este coach) puedes ver tus propias notas.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <NotesSection
          coachId={coachId}
          userId={userId}
          initialNotes={notes ?? []}
        />
      </div>
    </div>
  );
}
