import { requireUsuario } from "@/lib/require-usuario";
import UserTaskCard from "./user-task-card";

export default async function TasksPage() {
  const { supabase, user } = await requireUsuario();

  const { data: tasks } = await supabase
    .from("coach_tasks")
    .select("id, title, description, due_date, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const { data: dismissals } = await supabase
    .from("notification_dismissals")
    .select("item_id")
    .eq("user_id", user.id)
    .eq("item_type", "task");

  const dismissedIds = new Set((dismissals ?? []).map((d) => d.item_id));

  const all = (tasks ?? []).filter((t) => !dismissedIds.has(t.id));
  const pendientes = all.filter((t) => t.status !== "completada");
  const completadas = all.filter((t) => t.status === "completada");

  type TaskComment = {
    id: string;
    task_id: string;
    comment: string;
    seen_by_user: boolean;
  };

  const taskIds = all.map((t) => t.id);
  const { data: comments } = taskIds.length
    ? await supabase
        .from("coach_task_comments")
        .select("id, task_id, comment, seen_by_user")
        .in("task_id", taskIds)
    : { data: [] as TaskComment[] };

  const unseenIds = (comments ?? [])
    .filter((c) => !c.seen_by_user)
    .map((c) => c.id);
  if (unseenIds.length > 0) {
    await supabase
      .from("coach_task_comments")
      .update({ seen_by_user: true })
      .in("id", unseenIds);
  }

  const commentsByTask = new Map<string, TaskComment[]>();
  for (const c of (comments ?? []) as TaskComment[]) {
    const list = commentsByTask.get(c.task_id) ?? [];
    list.push(c);
    commentsByTask.set(c.task_id, list);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Tareas asignadas por tu coach
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Marca cada tarea con su estado a medida que avanzas. Si algo no
        te aplica, puedes descartarlo sin marcarlo como completado.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {all.length === 0 && (
          <p className="text-sm text-slate-500">
            Todavía no tienes tareas asignadas. Si tienes un coach
            asignado, va a asignarte tareas desde su panel.
          </p>
        )}

        {pendientes.length > 0 && completadas.length > 0 && (
          <p className="text-xs text-slate-400">
            {completadas.length} de {all.length} tareas resueltas
          </p>
        )}

        {pendientes.map((t) => (
          <UserTaskCard
            key={t.id}
            task={t}
            comments={commentsByTask.get(t.id) ?? []}
          />
        ))}

        {completadas.length > 0 && (
          <>
            <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Completadas
            </h2>
            {completadas.map((t) => (
              <UserTaskCard
                key={t.id}
                task={t}
                comments={commentsByTask.get(t.id) ?? []}
                completed
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
