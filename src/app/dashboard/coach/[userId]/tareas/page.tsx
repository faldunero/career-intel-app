import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import TasksSection from "../../tasks-section";

type Comment = {
  id: string;
  task_id: string;
  comment: string;
  created_at: string;
};

export default async function CoachUserTasksPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, coachId, profile } = await getCoachViewedUser(userId);

  const { data: tasks } = await supabase
    .from("coach_tasks")
    .select("id, title, description, due_date, status")
    .eq("user_id", userId)
    .eq("coach_id", coachId)
    .order("created_at", { ascending: false });

  const taskIds = (tasks ?? []).map((t) => t.id);
  const { data: allComments } = taskIds.length
    ? await supabase
        .from("coach_task_comments")
        .select("id, task_id, comment, created_at")
        .in("task_id", taskIds)
        .order("created_at", { ascending: true })
    : { data: [] as Comment[] };

  const commentsByTask: Record<string, Comment[]> = {};
  for (const c of (allComments ?? []) as Comment[]) {
    if (!commentsByTask[c.task_id]) commentsByTask[c.task_id] = [];
    commentsByTask[c.task_id].push(c);
  }

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
        Tareas asignadas
      </h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <TasksSection
          coachId={coachId}
          userId={userId}
          initialTasks={tasks ?? []}
          commentsByTask={commentsByTask}
        />
      </div>
    </div>
  );
}
