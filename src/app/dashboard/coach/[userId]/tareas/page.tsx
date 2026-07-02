import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import TasksSection from "../../tasks-section";

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
        Tareas asignadas
      </h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <TasksSection
          coachId={coachId}
          userId={userId}
          initialTasks={tasks ?? []}
        />
      </div>
    </div>
  );
}
