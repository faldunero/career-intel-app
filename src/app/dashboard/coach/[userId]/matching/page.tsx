import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";

export default async function CoachUserMatchingPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, profile } = await getCoachViewedUser(userId);

  const { data: matches } = await supabase
    .from("job_matches")
    .select("id, company, job_title, matching_general, matching_ats, matching_tecnico, created_at")
    .eq("user_id", userId)
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
        Matching de vacantes
      </h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Vacantes analizadas ({matches?.length ?? 0})
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {(matches ?? []).map((m) => (
            <div
              key={m.id}
              className="rounded-lg border border-slate-100 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between">
                <span>
                  {m.job_title ?? "Cargo no identificado"}
                  {m.company ? ` — ${m.company}` : ""}
                </span>
                {m.matching_general !== null && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                    {m.matching_general}/100
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {m.matching_ats !== null ? `ATS: ${m.matching_ats} · ` : ""}
                {m.matching_tecnico !== null
                  ? `Técnico: ${m.matching_tecnico}`
                  : ""}
              </p>
            </div>
          ))}
          {(!matches || matches.length === 0) && (
            <p className="text-xs text-slate-400">
              Este usuario no ha analizado vacantes todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
