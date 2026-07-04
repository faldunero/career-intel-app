import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import MatchingCommentThread from "./matching-comment-thread";

type MatchAnalysis = {
  fortalezas?: string[];
  brechas?: string[];
  riesgos?: string[];
  acciones_prioritarias?: string[];
};

type Comment = {
  id: string;
  job_match_id: string;
  section: string | null;
  comment: string;
  created_at: string;
};

const SECTION_LABELS: Record<string, string> = {
  fortalezas: "Fortalezas",
  brechas: "Brechas",
  riesgos: "Riesgos",
  acciones_prioritarias: "Acciones prioritarias",
};

function ScoreDot({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}

function SubScore({ label, score }: { label: string; score: number | null }) {
  if (score === null) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <ScoreDot score={score} />
      {label}: {score}
    </span>
  );
}

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
      "id, company, job_title, matching_general, matching_ats, matching_tecnico, matching_liderazgo, matching_cultural, matching_experiencia, analysis, created_at"
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

  function commentsFor(matchId: string, section: string | null) {
    return (commentsByMatch.get(matchId) ?? []).filter(
      (c) => c.section === section
    );
  }

  const sections: Array<keyof MatchAnalysis> = [
    "fortalezas",
    "brechas",
    "riesgos",
    "acciones_prioritarias",
  ];

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

      {(!matches || matches.length === 0) && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-400">
            Este usuario no ha analizado vacantes todavía.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {(matches ?? []).map((m) => {
          const analysis = m.analysis as MatchAnalysis | null;
          return (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {m.job_title ?? "Cargo no identificado"}
                    {m.company ? ` — ${m.company}` : ""}
                  </p>
                </div>
                {m.matching_general !== null && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {m.matching_general}/100
                  </span>
                )}
              </div>

              <div className="mt-3 flex flex-wrap gap-3">
                <SubScore label="ATS" score={m.matching_ats} />
                <SubScore label="Técnico" score={m.matching_tecnico} />
                <SubScore label="Liderazgo" score={m.matching_liderazgo} />
                <SubScore label="Cultural" score={m.matching_cultural} />
                <SubScore label="Experiencia" score={m.matching_experiencia} />
              </div>

              {!analysis && (
                <p className="mt-3 text-xs text-slate-400">
                  Sin análisis detallado disponible para esta vacante.
                </p>
              )}

              {analysis &&
                sections.map((section, idx) => {
                  const items = analysis[section] as string[] | undefined;
                  if (!items || items.length === 0) return null;
                  const sectionComments = commentsFor(m.id, section);
                  return (
                    <div
                      key={section}
                      className={`py-5 ${idx > 0 ? "border-t border-slate-100" : ""}`}
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {SECTION_LABELS[section]}
                        </h4>
                        {sectionComments.length > 0 && (
                          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                            {sectionComments.length} comentario
                            {sectionComments.length !== 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <ul className="mt-3 flex flex-col gap-2 pl-5 text-sm text-slate-700">
                        {items.map((item, i) => (
                          <li key={i} className="list-disc">
                            {item}
                          </li>
                        ))}
                      </ul>
                      <MatchingCommentThread
                        jobMatchId={m.id}
                        coachId={coachId}
                        section={section}
                        comments={sectionComments}
                        placeholder={`Tu opinión sobre "${SECTION_LABELS[section]}"...`}
                      />
                    </div>
                  );
                })}

              <div className="border-t border-slate-100 pt-5">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Comentario general de esta vacante
                </h4>
                <MatchingCommentThread
                  jobMatchId={m.id}
                  coachId={coachId}
                  section={null}
                  comments={commentsFor(m.id, null)}
                  placeholder="¿Esta vacante vale la pena? ¿Qué priorizar antes de postular?"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
