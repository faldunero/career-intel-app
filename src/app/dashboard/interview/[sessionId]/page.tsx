import { notFound } from "next/navigation";
import Link from "next/link";
import { requireUsuario } from "@/lib/require-usuario";
import InterviewChat from "../interview-chat";

const TYPE_LABELS: Record<string, string> = {
  recruiter: "Recruiter",
  rrhh: "RR.HH.",
  hiring_manager: "Hiring Manager",
  director: "Director",
  ceo: "CEO",
  panel_tecnico: "Panel Técnico",
};

export default async function InterviewSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  const { supabase, user } = await requireUsuario();

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("id, user_id, interview_type, target_role, status, messages, feedback")
    .eq("id", sessionId)
    .single();

  if (!session || session.user_id !== user.id) {
    notFound();
  }

  const { data: comments } = await supabase
    .from("interview_comments")
    .select("id, message_index, comment, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/interview"
        className="text-sm text-slate-500 underline hover:text-slate-800"
      >
        ← Volver a mis entrevistas
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">
        Entrevista: {TYPE_LABELS[session.interview_type] ?? session.interview_type}
      </h1>
      {session.target_role && (
        <p className="mt-1 text-sm text-slate-500">
          Cargo objetivo: {session.target_role}
        </p>
      )}

      <div className="mt-6">
        <InterviewChat
          sessionId={session.id}
          initialMessages={session.messages ?? []}
          initialStatus={session.status}
          initialFeedback={session.feedback}
          comments={comments ?? []}
        />
      </div>
    </div>
  );
}
