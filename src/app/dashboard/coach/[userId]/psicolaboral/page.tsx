import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import { TOOLS, TOOL_ORDER, type ToolKey } from "@/lib/psych-tools";
import AssignToolsPanel from "./assign-tools-panel";
import PsychAccordionItem from "./psych-accordion-item";
import { type PsychResult } from "@/components/psych/result-view";

type Assignment = {
  id: string;
  tool_key: ToolKey;
  status: "asignado" | "completado";
  result: PsychResult | null;
  completed_at: string | null;
};

type Comment = {
  id: string;
  assignment_id: string;
  comment: string;
  created_at: string;
};

export default async function CoachUserPsicolaboralPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, coachId, profile } = await getCoachViewedUser(userId);

  const { data: assignments } = await supabase
    .from("psych_assignments")
    .select("id, tool_key, status, result, completed_at")
    .eq("user_id", userId);

  const list = (assignments ?? []) as Assignment[];
  const assignedByTool: Partial<Record<ToolKey, { id: string; status: "asignado" | "completado" }>> = {};
  for (const a of list) {
    assignedByTool[a.tool_key] = { id: a.id, status: a.status };
  }

  const assignmentIds = list.map((a) => a.id);
  const { data: allComments } = assignmentIds.length
    ? await supabase
        .from("psych_comments")
        .select("id, assignment_id, comment, created_at")
        .in("assignment_id", assignmentIds)
        .order("created_at", { ascending: true })
    : { data: [] as Comment[] };

  const commentsByAssignment = new Map<string, Comment[]>();
  for (const c of (allComments ?? []) as Comment[]) {
    const arr = commentsByAssignment.get(c.assignment_id) ?? [];
    arr.push(c);
    commentsByAssignment.set(c.assignment_id, arr);
  }

  const completed = list.filter((a) => a.status === "completado" && a.result);

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
        Herramientas psicolaborales
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Batería propia de Career Intelligence AI — autoevaluaciones de
        desarrollo profesional, no instrumentos psicométricos
        certificados.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Asignar
        </h2>
        <div className="mt-3">
          <AssignToolsPanel
            userId={userId}
            coachId={coachId}
            assignedByTool={assignedByTool}
          />
        </div>
      </div>

      {completed.length === 0 && (
        <p className="mt-6 text-sm text-slate-400">
          Todavía no hay resultados de este usuario para revisar.
        </p>
      )}

      <div className="mt-6 flex flex-col gap-3">
        {TOOL_ORDER.filter((key) =>
          completed.some((a) => a.tool_key === key)
        ).map((key) => {
          const a = completed.find((x) => x.tool_key === key)!;
          return (
            <PsychAccordionItem
              key={a.id}
              assignment={{
                id: a.id,
                title: TOOLS[key].title,
                result: a.result as PsychResult,
                completed_at: a.completed_at,
              }}
              coachId={coachId}
              comments={commentsByAssignment.get(a.id) ?? []}
            />
          );
        })}
      </div>
    </div>
  );
}
