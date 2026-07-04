import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";

const STATUS_LABELS: Record<string, string> = {
  por_postular: "Por postular",
  postulado: "Postulado",
  entrevista: "En entrevista",
  oferta: "Oferta recibida",
  rechazado: "Rechazado",
  abandonado: "Abandonado",
};

export default async function CoachUserCrmPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, profile } = await getCoachViewedUser(userId);

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id, company, job_title, status, priority, next_action, next_action_date, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const opps = opportunities ?? [];
  const postulaciones = opps.filter((o) => o.status !== "por_postular").length;
  const entrevistas = opps.filter((o) => o.status === "entrevista").length;
  const ofertas = opps.filter((o) => o.status === "oferta").length;

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

      <div className="mt-6 grid grid-cols-3 gap-3">
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

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Pipeline ({opps.length})
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {opps.map((o) => (
            <div
              key={o.id}
              className="rounded-lg border border-slate-100 px-3 py-2 text-sm"
            >
              <div className="flex items-center justify-between">
                <span>
                  {o.job_title ?? "Cargo sin definir"}
                  {o.company ? ` — ${o.company}` : ""}
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {STATUS_LABELS[o.status] ?? o.status}
                </span>
              </div>
              {o.next_action && (
                <p className="mt-1 text-xs text-slate-500">
                  Próxima acción: {o.next_action}
                  {o.next_action_date
                    ? ` (${new Date(o.next_action_date + "T00:00:00").toLocaleDateString("es-CL")})`
                    : ""}
                </p>
              )}
            </div>
          ))}
          {opps.length === 0 && (
            <p className="text-xs text-slate-400">
              Este usuario no ha registrado oportunidades todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
