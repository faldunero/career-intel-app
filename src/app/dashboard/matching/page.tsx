import { requireUsuario } from "@/lib/require-usuario";
import MatchingForm from "./matching-form";
import MatchHistoryItem from "./match-history-item";

export default async function MatchingPage() {
  const { supabase, user } = await requireUsuario();

  const { data: latestCv } = await supabase
    .from("cvs")
    .select("id, file_name")
    .eq("user_id", user.id)
    .eq("extraction_status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: matches } = await supabase
    .from("job_matches")
    .select(
      "id, job_title, company, matching_general, matching_ats, matching_tecnico, matching_liderazgo, matching_cultural, matching_experiencia, analysis, created_at, cover_letter"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  type MatchComment = {
    id: string;
    job_match_id: string;
    section: string | null;
    comment: string;
    seen_by_user: boolean;
  };

  const matchIds = (matches ?? []).map((m) => m.id);
  const { data: comments } = matchIds.length
    ? await supabase
        .from("job_match_comments")
        .select("id, job_match_id, section, comment, seen_by_user")
        .in("job_match_id", matchIds)
    : { data: [] as MatchComment[] };

  const unseenIds = (comments ?? [])
    .filter((c) => !c.seen_by_user)
    .map((c) => c.id);
  if (unseenIds.length > 0) {
    await supabase
      .from("job_match_comments")
      .update({ seen_by_user: true })
      .in("id", unseenIds);
  }

  const commentsByMatch = new Map<string, MatchComment[]>();
  for (const c of (comments ?? []) as MatchComment[]) {
    const list = commentsByMatch.get(c.job_match_id) ?? [];
    list.push(c);
    commentsByMatch.set(c.job_match_id, list);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Matching de vacantes
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Pega el texto completo de una oferta laboral y te decimos qué
        tan compatible eres, usando tu perfil y tu CV.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <MatchingForm
          userId={user.id}
          hasCv={Boolean(latestCv)}
          cvFileName={latestCv?.file_name ?? null}
        />
      </div>

      {matches && matches.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Historial ({matches.length})
          </h2>
          {matches.map((m) => (
            <MatchHistoryItem
              key={m.id}
              match={m}
              userId={user.id}
              comments={commentsByMatch.get(m.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}
