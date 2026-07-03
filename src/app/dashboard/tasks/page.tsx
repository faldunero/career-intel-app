import { requireUsuario } from "@/lib/require-usuario";
import UserTaskCard from "./user-task-card";

export default async function TasksPage() {
  const { supabase, user } = await requireUsuario();

  const { data: tasks } = await supabase
    .from("coach_tasks")
    .select("id, title, description, due_date, status, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const all = tasks ?? [];
  const pendientes = all.filter((t) => t.status !== "completada");
  const completadas = all.filter((t) => t.status === "completada");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Tareas asignadas por tu coach
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Marca cada tarea con su estado a medida que avanzas.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {all.length === 0 && (
          <p className="text-sm text-slate-500">
            Todavía no tienes tareas asignadas. Si tienes un coach
            asignado, va a asignarte tareas desde su panel.
          </p>
        )}

        {pendientes.map((t) => (
          <UserTaskCard key={t.id} task={t} />
        ))}

        {completadas.length > 0 && (
          <>
            <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Completadas
            </h2>
            {completadas.map((t) => (
              <UserTaskCard key={t.id} task={t} completed />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
