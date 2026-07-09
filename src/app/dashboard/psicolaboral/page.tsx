import Link from "next/link";
import { requireUsuario } from "@/lib/require-usuario";
import { TOOLS, TOOL_ORDER, type ToolKey } from "@/lib/psych-tools";
import PsychConsentGate from "@/components/psych/consent-gate";

type Assignment = {
  id: string;
  tool_key: ToolKey;
  status: "asignado" | "completado";
  assigned_at: string;
  completed_at: string | null;
};

export default async function PsicolaboralPage() {
  const { supabase, user } = await requireUsuario();

  const { data: profile } = await supabase
    .from("profiles")
    .select("psych_consent_at")
    .eq("id", user.id)
    .single();

  if (!profile?.psych_consent_at) {
    return <PsychConsentGate />;
  }

  const { data: assignments } = await supabase
    .from("psych_assignments")
    .select("id, tool_key, status, assigned_at, completed_at")
    .eq("user_id", user.id)
    .order("assigned_at", { ascending: false });

  const list = (assignments ?? []) as Assignment[];

  // Al abrir esta página se marcan como vistos los comentarios
  // pendientes de tu coach, igual que en CV y LinkedIn.
  const assignmentIds = list.map((a) => a.id);
  if (assignmentIds.length > 0) {
    const { data: unseen } = await supabase
      .from("psych_comments")
      .select("id")
      .in("assignment_id", assignmentIds)
      .eq("seen_by_user", false);
    const unseenIds = (unseen ?? []).map((c) => c.id);
    if (unseenIds.length > 0) {
      await supabase
        .from("psych_comments")
        .update({ seen_by_user: true })
        .in("id", unseenIds);
    }
  }

  const byTool = new Map<ToolKey, Assignment>();
  for (const a of list) byTool.set(a.tool_key, a);

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Herramientas psicolaborales
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Autoevaluaciones de desarrollo profesional que tu coach te
        habilita. No son un instrumento psicométrico certificado ni un
        diagnóstico clínico — su valor está en la conversación que
        abren con tu coach.
      </p>

      {list.length === 0 && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-400">
            Tu coach todavía no te ha habilitado ninguna herramienta.
          </p>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-4">
        {TOOL_ORDER.filter((key) => byTool.has(key)).map((key) => {
          const a = byTool.get(key)!;
          const meta = TOOLS[key];
          return (
            <Link
              key={a.id}
              href={`/dashboard/psicolaboral/${a.id}`}
              className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">
                  {meta.title}
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  {meta.subtitle}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {a.status === "completado"
                    ? `Completado el ${new Date(a.completed_at!).toLocaleDateString("es-CL", { day: "numeric", month: "long", year: "numeric" })}`
                    : `~${meta.estimatedMinutes} minutos`}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  a.status === "completado"
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {a.status === "completado" ? "Ver resultado" : "Responder"}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
