import Link from "next/link";
import { requireUsuario } from "@/lib/require-usuario";

const TYPE_LABELS: Record<string, string> = {
  recruiter: "Recruiter",
  rrhh: "RR.HH.",
  hiring_manager: "Hiring Manager",
  director: "Director",
  ceo: "CEO",
  panel_tecnico: "Panel Técnico",
};

const STATUS_LABELS: Record<string, string> = {
  disponible: "Disponible — no iniciada",
  en_progreso: "En progreso",
  completada: "Completada",
};

const STATUS_COLORS: Record<string, string> = {
  disponible: "bg-blue-100 text-blue-700",
  en_progreso: "bg-amber-100 text-amber-700",
  completada: "bg-green-100 text-green-700",
};

export default async function InterviewListPage() {
  const { supabase, user } = await requireUsuario();

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("id, interview_type, target_role, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Simulador de entrevistas
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Tu coach habilita cada simulación. Aquí las ves y las practicas.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {(!sessions || sessions.length === 0) && (
          <p className="text-sm text-slate-500">
            Todavía no tienes ninguna simulación habilitada. Pídele a tu
            coach que te habilite una.
          </p>
        )}
        {(sessions ?? []).map((s) => (
          <Link
            key={s.id}
            href={`/dashboard/interview/${s.id}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {TYPE_LABELS[s.interview_type] ?? s.interview_type}
                {s.target_role ? ` — ${s.target_role}` : ""}
              </p>
              <p className="text-xs text-slate-400">
                {new Date(s.created_at).toLocaleDateString("es-CL", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] ?? ""}`}
            >
              {STATUS_LABELS[s.status] ?? s.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
