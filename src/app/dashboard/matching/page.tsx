import { requireUsuario } from "@/lib/require-usuario";
import MatchingForm from "./matching-form";
import DeleteMatchButton from "./delete-match-button";
import LocalDateTime from "./local-datetime";
import ConvertToOpportunityButton from "./convert-to-opportunity-button";
import CoverLetterButton from "./cover-letter-button";

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

  function commentsFor(matchId: string, section: string | null) {
    return (commentsByMatch.get(matchId) ?? []).filter(
      (c) => c.section === section
    );
  }

  function CommentBubbles({ matchId, section }: { matchId: string; section: string | null }) {
    const list = commentsFor(matchId, section);
    if (list.length === 0) return null;
    return (
      <div className="mt-2 flex flex-col gap-1.5">
        {list.map((c) => (
          <p
            key={c.id}
            className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-slate-700"
          >
            💬 <span className="font-medium">Tu coach:</span> {c.comment}
          </p>
        ))}
      </div>
    );
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
            Historial
          </h2>
          {matches.map((m) => (
            <div
              key={m.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {m.job_title ?? "Cargo no identificado"}
                    {m.company ? ` — ${m.company}` : ""}
                  </p>
                  <p className="text-xs text-slate-400">
                    <LocalDateTime iso={m.created_at} />
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  {m.matching_general !== null && (
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {m.matching_general}/100
                    </span>
                  )}
                  <DeleteMatchButton matchId={m.id} />
                </div>
              </div>

              {m.analysis && (
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-3">
                  {m.matching_ats !== null && (
                    <span>ATS: {m.matching_ats}</span>
                  )}
                  <span>Técnico: {m.matching_tecnico ?? "—"}</span>
                  <span>Liderazgo: {m.matching_liderazgo ?? "N/A"}</span>
                  <span>Cultural: {m.matching_cultural ?? "—"}</span>
                  <span>Experiencia: {m.matching_experiencia ?? "—"}</span>
                </div>
              )}

              {m.analysis?.fortalezas?.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Fortalezas
                  </h4>
                  <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                    {m.analysis.fortalezas.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  <CommentBubbles matchId={m.id} section="fortalezas" />
                </div>
              )}

              {m.analysis?.brechas?.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Brechas
                  </h4>
                  <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                    {m.analysis.brechas.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  <CommentBubbles matchId={m.id} section="brechas" />
                </div>
              )}

              {m.analysis?.riesgos?.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Riesgos
                  </h4>
                  <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                    {m.analysis.riesgos.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  <CommentBubbles matchId={m.id} section="riesgos" />
                </div>
              )}

              {m.analysis?.acciones_prioritarias?.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Acciones prioritarias
                  </h4>
                  <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                    {m.analysis.acciones_prioritarias.map((b: string, i: number) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                  <CommentBubbles matchId={m.id} section="acciones_prioritarias" />
                </div>
              )}

              <CommentBubbles matchId={m.id} section={null} />

              <div className="mt-3 flex flex-col gap-3">
                <ConvertToOpportunityButton
                  matchId={m.id}
                  userId={user.id}
                  jobTitle={m.job_title}
                  company={m.company}
                />
                <CoverLetterButton
                  matchId={m.id}
                  initialLetter={m.cover_letter}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
