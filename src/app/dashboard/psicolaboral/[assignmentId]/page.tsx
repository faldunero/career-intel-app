import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUsuario } from "@/lib/require-usuario";
import {
  ESTILO_LABORAL_QUESTIONS,
  RASGOS_PROFESIONALES_QUESTIONS,
  publicChoiceQuestions,
  TOOLS,
  type ToolKey,
} from "@/lib/psych-tools";
import LikertForm from "@/components/psych/likert-form";
import ChoiceForm from "@/components/psych/choice-form";
import PsychResultView, { type PsychResult } from "@/components/psych/result-view";
import CommentList from "@/components/cv/comment-list";

export default async function PsicolaboralAssignmentPage({
  params,
}: {
  params: Promise<{ assignmentId: string }>;
}) {
  const { assignmentId } = await params;
  const { supabase, user } = await requireUsuario();

  const { data: assignment } = await supabase
    .from("psych_assignments")
    .select("id, user_id, tool_key, status, result")
    .eq("id", assignmentId)
    .maybeSingle();

  if (!assignment || assignment.user_id !== user.id) {
    notFound();
  }

  const toolKey = assignment.tool_key as ToolKey;
  const meta = TOOLS[toolKey];

  let comments: { id: string; comment: string; created_at: string }[] = [];
  if (assignment.status === "completado") {
    const { data } = await supabase
      .from("psych_comments")
      .select("id, comment, created_at")
      .eq("assignment_id", assignment.id)
      .order("created_at", { ascending: true });
    comments = data ?? [];
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/psicolaboral"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Volver a herramientas psicolaborales
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">
        {meta.title}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{meta.description}</p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {assignment.status === "asignado" ? (
          toolKey === "razonamiento_logico" ? (
            <ChoiceForm
              assignmentId={assignment.id}
              questions={publicChoiceQuestions()}
            />
          ) : (
            <LikertForm
              assignmentId={assignment.id}
              questions={(toolKey === "estilo_laboral"
                ? ESTILO_LABORAL_QUESTIONS
                : RASGOS_PROFESIONALES_QUESTIONS
              ).map(({ id, text }) => ({ id, text }))}
            />
          )
        ) : (
          <>
            <PsychResultView result={assignment.result as PsychResult} />
            {comments.length > 0 && (
              <div className="mt-5 border-t border-slate-100 pt-4">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Comentario de tu coach
                </h4>
                <CommentList comments={comments} />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
