import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoleSelector from "./role-selector";
import CreateCoachForm from "./create-coach-form";
import CreateUserForm from "./create-user-form";
import CoachCard from "./coach-card";
import CoachAssignSelector from "./coach-assign-selector";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (myProfile?.role !== "administrador") {
    redirect("/dashboard");
  }

  const { data: allUsers } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, profile_completed, career_score, created_at")
    .order("created_at", { ascending: false });

  const { data: assignments } = await supabase
    .from("coach_assignments")
    .select("id, coach_id, user_id");

  const users = allUsers ?? [];
  const coaches = users.filter((u) => u.role === "coach");
  const assignmentsList = assignments ?? [];

  // Mapa: user_id -> coach_id actual (si tiene uno)
  const userCoachMap = new Map(
    assignmentsList.map((a) => [a.user_id, a.coach_id])
  );
  // Conteo de usuarios asignados por coach
  const coachCounts = new Map<string, number>();
  for (const a of assignmentsList) {
    coachCounts.set(a.coach_id, (coachCounts.get(a.coach_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Panel de administrador
      </h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">
            Coaches ({coaches.length})
          </h2>
          <CreateCoachForm />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {coaches.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay coaches todavía. Crea el primero con el botón de
              arriba.
            </p>
          )}
          {coaches.map((c) => (
            <CoachCard
              key={c.id}
              coach={c}
              assignedCount={coachCounts.get(c.id) ?? 0}
            />
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">
            Usuarios ({users.length})
          </h2>
          <CreateUserForm coaches={coaches} />
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="pb-2 pr-4">Nombre</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Rol</th>
                <th className="pb-2 pr-4">Perfil</th>
                <th className="pb-2 pr-4">Career Score</th>
                <th className="pb-2 pr-4">Coach asignado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">{u.full_name ?? "—"}</td>
                  <td className="py-2 pr-4 text-slate-500">
                    {u.email ?? "—"}
                  </td>
                  <td className="py-2 pr-4">
                    <RoleSelector userId={u.id} currentRole={u.role} />
                  </td>
                  <td className="py-2 pr-4">
                    {u.profile_completed ? "Completo" : "Pendiente"}
                  </td>
                  <td className="py-2 pr-4">{u.career_score ?? "—"}</td>
                  <td className="py-2 pr-4">
                    {u.role === "usuario" ? (
                      <CoachAssignSelector
                        userId={u.id}
                        coaches={coaches}
                        currentCoachId={userCoachMap.get(u.id) ?? null}
                      />
                    ) : (
                      <span className="text-xs text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
