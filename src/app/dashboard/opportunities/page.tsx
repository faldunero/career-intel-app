import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select(
      "id, company, job_title, industry, source, url, status, priority, next_action, next_action_date, notes, created_at"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const all = opportunities ?? [];
  const postulaciones = all.filter((o) => o.status !== "por_postular").length;
  const entrevistas = all.filter((o) => o.status === "entrevista").length;
  const ofertas = all.filter((o) => o.status === "oferta").length;
  const respondidas = all.filter((o) =>
    ["entrevista", "oferta", "rechazado"].includes(o.status)
  ).length;
  const tasaRespuesta =
    postulaciones > 0 ? Math.round((respondidas / postulaciones) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        CRM de oportunidades
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Registra cada postulación y su avance. Aquí se calculan tus
        métricas de búsqueda laboral.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Postulaciones" value={postulaciones} />
        <StatCard label="En entrevista" value={entrevistas} />
        <StatCard label="Ofertas" value={ofertas} />
        <StatCard label="Tasa de respuesta" value={`${tasaRespuesta}%`} />
      </div>

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
          <OpportunityCard key={opp.id} opp={opp} />
        ))}
      </div>
    </div>
  );
}
