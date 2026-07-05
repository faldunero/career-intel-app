import { requireUsuario } from "@/lib/require-usuario";
import AddOpportunityForm from "./add-opportunity-form";
import OpportunityCard from "./opportunity-card";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default async function OpportunitiesPage() {
  const { supabase, user } = await requireUsuario();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id, company, job_title, industry, source, url, status, priority, next_action, next_action_date, notes, created_at, job_match_id"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const all = opportunities ?? [];
  const porPostular = all.filter((o) => o.status === "por_postular").length;
  const postulaciones = all.filter((o) => o.status !== "por_postular").length;
  const entrevistas = all.filter((o) => o.status === "entrevista").length;
  const ofertas = all.filter((o) => o.status === "oferta").length;
  const respondidas = all.filter((o) =>
    ["entrevista", "oferta", "rechazado"].includes(o.status)
  ).length;
  const tasaRespuesta =
    postulaciones > 0 ? Math.round((respondidas / postulaciones) * 100) : 0;

  type OppComment = {
    id: string;
    opportunity_id: string;
    comment: string;
    seen_by_user: boolean;
  };

  const oppIds = all.map((o) => o.id);
  const { data: comments } = oppIds.length
    ? await supabase
        .from("opportunity_comments")
        .select("id, opportunity_id, comment, seen_by_user")
        .in("opportunity_id", oppIds)
    : { data: [] as OppComment[] };

  const commentsByOpp = new Map<string, OppComment[]>();
  for (const c of (comments ?? []) as OppComment[]) {
    const list = commentsByOpp.get(c.opportunity_id) ?? [];
    list.push(c);
    commentsByOpp.set(c.opportunity_id, list);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        CRM de oportunidades
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Registra cada postulación y su avance. Aquí se calculan tus
        métricas de búsqueda laboral.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Por postular" value={porPostular} />
        <StatCard label="Postulaciones" value={postulaciones} />
        <StatCard label="En entrevista" value={entrevistas} />
        <StatCard label="Ofertas" value={ofertas} />
        <StatCard label="Tasa de respuesta" value={`${tasaRespuesta}%`} />
      </div>
      <p className="mt-2 text-xs text-slate-400">
        &quot;Por postular&quot; son vacantes que guardaste pero todavía no
        envías tu postulación.
      </p>

      <div className="mt-6">
        <AddOpportunityForm userId={user.id} />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {all.length === 0 && (
          <p className="text-sm text-slate-500">
            Todavía no registras oportunidades. Agrega la primera con el
            botón de arriba.
          </p>
        )}
        {all.map((opp) => (
          <OpportunityCard
            key={opp.id}
            opp={opp}
            comments={commentsByOpp.get(opp.id) ?? []}
          />
        ))}
      </div>
    </div>
  );
}
