import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import EnableInterviewForm from "../../enable-interview-form";

const TYPE_LABELS: Record<string, string> = {
  recruiter: "Recruiter",
  rrhh: "RR.HH.",
  hiring_manager: "Hiring Manager",
  director: "Director",
  ceo: "CEO",
  panel_tecnico: "Panel Técnico",
};

const STATUS_LABELS: Record<string, string> = {
  disponible: "Disponible (aún no empieza)",
  en_progreso: "En progreso",
  completada: "Completada",
};

const STATUS_COLORS: Record<string, string> = {
  disponible: "bg-slate-100 text-slate-700",
  en_progreso: "bg-amber-100 text-amber-700",
  completada: "bg-green-100 text-green-700",
};

export default async function CoachUserInterviewsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, coachId, profile } = await getCoachViewedUser(userId);

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("id, interview_type, target_role, status, feedback, created_at")
    .eq("user_id", userId)
    .eq("coach_id", coachId)
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
        Simulador de entrevistas
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Habilita una simulación para que tu usuario pueda practicar.
      </p>

      <div className="mt-6">
        <EnableInterviewForm coachId={coachId} userId={userId} />
      </div>

      <div className="mt-6 flex flex-col gap-3">
        {(!sessions || sessions.length === 0) && (
          <p className="text-sm text-slate-500">
            No has habilitado ninguna simulación todavía.
          </p>
        )}
        {(sessions ?? []).map((s) => {
          const feedback = s.feedback as
            | {
                evaluacion_general?: string;
                fortalezas?: string[];
                areas_de_mejora?: string[];
                recomendacion?: string;
              }
            | null;
          return (
            <div
              key={s.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {TYPE_LABELS[s.interview_type] ?? s.interview_type}
                  {s.target_role ? ` — ${s.target_role}` : ""}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[s.status] ?? ""}`}
                >
                  {STATUS_LABELS[s.status] ?? s.status}
                </span>
              </div>

              {feedback && (
                <div className="mt-3 border-t border-slate-100 pt-3">
                  {feedback.evaluacion_general && (
                    <p className="text-sm text-slate-600">
                      {feedback.evaluacion_general}
                    </p>
                  )}
                  {feedback.fortalezas && feedback.fortalezas.length > 0 && (
                    <div className="mt-2">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Fortalezas
                      </h4>
                      <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                        {feedback.fortalezas.map((f, i) => (
                          <li key={i}>{f}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedback.areas_de_mejora &&
                    feedback.areas_de_mejora.length > 0 && (
                      <div className="mt-2">
                        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Áreas de mejora
                        </h4>
                        <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                          {feedback.areas_de_mejora.map((a, i) => (
                            <li key={i}>{a}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
