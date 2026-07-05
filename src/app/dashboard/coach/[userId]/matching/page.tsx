import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import MatchAccordionItem from "./match-accordion-item";

type Comment = {
  id: string;
  job_match_id: string;
  section: string | null;
  comment: string;
  created_at: string;
};

export default async function CoachUserMatchingPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, coachId, profile } = await getCoachViewedUser(userId);

  const { data: matches } = await supabase
    .from("job_matches")
    .select(
      "id, company, job_title, job_description, matching_general, matching_ats, matching_tecnico, matching_liderazgo, matching_cultural, matching_experiencia, analysis, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const matchIds = (matches ?? []).map((m) => m.id);
  const { data: allComments } = matchIds.length
    ? await supabase
        .from("job_match_comments")
        .select("id, job_match_id, section, comment, created_at")
        .in("job_match_id", matchIds)
        .order("created_at", { ascending: true })
    : { data: [] as Comment[] };

  const commentsByMatch = new Map<string, Comment[]>();
  for (const c of (allComments ?? []) as Comment[]) {
    const list = commentsByMatch.get(c.job_match_id) ?? [];
    list.push(c);
    commentsByMatch.set(c.job_match_id, list);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/coach"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        Volver a mis usuarios
      </Link>
      <p className="mt-3 text-sm text-slate-500">
        {profile.full_name ?? profile.email}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">
        Matching de vacantes
      </h1>
      {matches && matches.length > 0 && (
        <p className="mt-1 text-sm text-slate-500">
          {matches.length} vacante{matches.length !== 1 ? "s" : ""} analizada
          {matches.length !== 1 ? "s" : ""}.
        </p>
      )}

      {(!matches || matches.length === 0) && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-400">
            Este usuario no ha analizado vacantes todavía.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {(matches ?? []).map((m) => (
          <MatchAccordionItem
            key={m.id}
            match={m}
            coachId={coachId}
            comments={commentsByMatch.get(m.id) ?? []}
          />
        ))}
      </div>
    </div>
  );
}
