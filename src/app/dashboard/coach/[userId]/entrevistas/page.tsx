import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import EnableInterviewForm from "../../enable-interview-form";
import InterviewSessionCard from "./interview-session-card";

const TYPE_LABELS: Record<string, string> = {
  recruiter: "Recruiter",
  rrhh: "RR.HH.",
  hiring_manager: "Hiring Manager",
  director: "Director",
  ceo: "CEO",
  panel_tecnico: "Panel Técnico",
};

function ScoreDot({ score }: { score: number }) {
  const color =
    score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

export default async function CoachUserInterviewsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, coachId, profile } = await getCoachViewedUser(userId);

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("id, interview_type, target_role, status, messages, feedback, created_at")
    .eq("user_id", userId)
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false });

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: allComments } = sessionIds.length
    ? await supabase
        .from("interview_comments")
        .select("id, session_id, message_index, comment, created_at")
        .in("session_id", sessionIds)
        .order("created_at", { ascending: true })
    : { data: [] };

  const commentsBySession = new Map<string, typeof allComments>();
  for (const c of allComments ?? []) {
    const list = commentsBySession.get(c.session_id) ?? [];
    list.push(c);
    commentsBySession.set(c.session_id, list);
  }

  const completedWithScore = (sessions ?? [])
    .filter((s) => s.status === "completada" && s.feedback)
    .map((s) => ({
      id: s.id,
      date: s.created_at,
      type: TYPE_LABELS[s.interview_type] ?? s.interview_type,
      score: (s.feedback as { puntaje?: number })?.puntaje ?? null,
    }))
    .filter((s) => s.score !== null)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

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
        Simulador de entrevistas
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Habilita una simulación para que tu usuario pueda practicar.
      </p>

      <div className="mt-6">
        <EnableInterviewForm coachId={coachId} userId={userId} />
      </div>

      {completedWithScore.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">
            Progreso ({completedWithScore.length} entrevistas completadas)
          </h2>
          <div className="mt-3 flex flex-col gap-2">
            {completedWithScore.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-slate-600">
                  {i + 1}. {s.type} —{" "}
                  {new Date(s.date).toLocaleDateString("es-CL", {
                    day: "2-digit",
                    month: "short",
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <ScoreDot score={s.score!} />
                  <span className="font-semibold text-slate-900">
                    {s.score}/100
                  </span>
                </span>
              </div>
            ))}
          </div>
          {completedWithScore.length >= 2 && (
            <p className="mt-3 text-xs text-slate-400">
              {completedWithScore[completedWithScore.length - 1].score! >
              completedWithScore[0].score!
                ? "Tendencia positiva desde la primera entrevista."
                : completedWithScore[completedWithScore.length - 1].score! <
                    completedWithScore[0].score!
                  ? "El puntaje bajó respecto a la primera entrevista — vale la pena reforzar."
                  : "Puntaje estable entre entrevistas."}
            </p>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {(!sessions || sessions.length === 0) && (
          <p className="text-sm text-slate-500">
            No has habilitado ninguna simulación todavía.
          </p>
        )}
        {(sessions ?? []).map((s) => (
          <InterviewSessionCard
            key={s.id}
            session={s}
            coachId={coachId}
            comments={commentsBySession.get(s.id) ?? []}
          />
        ))}
      </div>
    </div>
  );
}
