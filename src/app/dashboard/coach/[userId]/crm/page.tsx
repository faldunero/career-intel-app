import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import OpportunityAccordionItem from "./opportunity-accordion-item";

type Comment = {
  id: string;
  opportunity_id: string;
  comment: string;
  created_at: string;
};

export default async function CoachUserCrmPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, coachId, profile } = await getCoachViewedUser(userId);

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id, company, job_title, industry, source, url, status, priority, next_action, next_action_date, notes, created_at, job_match_id"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const opps = opportunities ?? [];
  const porPostular = opps.filter((o) => o.status === "por_postular").length;
  const postulaciones = opps.filter((o) => o.status !== "por_postular").length;
  const entrevistas = opps.filter((o) => o.status === "entrevista").length;
  const ofertas = opps.filter((o) => o.status === "oferta").length;

  const oppIds = opps.map((o) => o.id);
  const { data: allComments } = oppIds.length
    ? await supabase
        .from("opportunity_comments")
        .select("id, opportunity_id, comment, created_at")
        .in("opportunity_id", oppIds)
        .order("created_at", { ascending: true })
    : { data: [] as Comment[] };

  const commentsByOpp = new Map<string, Comment[]>();
  for (const c of (allComments ?? []) as Comment[]) {
    const list = commentsByOpp.get(c.opportunity_id) ?? [];
    list.push(c);
    commentsByOpp.set(c.opportunity_id, list);
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
        CRM de oportunidades
      </h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xl font-semibold text-slate-900">
            {porPostular}
          </p>
          <p className="text-xs text-slate-500">Por postular</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xl font-semibold text-slate-900">
            {postulaciones}
          </p>
          <p className="text-xs text-slate-500">Postulaciones</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xl font-semibold text-slate-900">
            {entrevistas}
          </p>
          <p className="text-xs text-slate-500">En entrevista</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xl font-semibold text-slate-900">{ofertas}</p>
          <p className="text-xs text-slate-500">Ofertas</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-slate-400">
        &quot;Por postular&quot; son candidatas que el usuario guardó pero
        todavía no envía; no cuentan como postulación hasta que cambien de
        estado.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pipeline ({opps.length})
        </h2>
        {opps.length === 0 && (
          <p className="text-sm text-slate-400">
            Este usuario no ha registrado oportunidades todavía.
          </p>
        )}
        {opps.map((o) => (
          <OpportunityAccordionItem
            key={o.id}
            opp={o}
            coachId={coachId}
            userId={userId}
            comments={commentsByOpp.get(o.id) ?? []}
          />
        ))}
      </div>
    </div>
  );
}
