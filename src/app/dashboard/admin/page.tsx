import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoleSelector from "./role-selector";
import AssignCoachForm from "./assign-coach-form";
import UnassignButton from "./unassign-button";

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
    .select("id, coach_id, user_id, created_at")
    .order("created_at", { ascending: false });

  const users = allUsers ?? [];
  const coaches = users.filter((u) => u.role === "coach");
  const regularUsers = users.filter((u) => u.role === "usuario");

  const userMap = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Panel de administrador
      </h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Usuarios ({users.length})
        </h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <th className="pb-2 pr-4">Nombre</th>
                <th className="pb-2 pr-4">Email</th>
                <th className="pb-2 pr-4">Rol</th>
                <th className="pb-2 pr-4">Perfil</th>
                <th className="pb-2 pr-4">Career Score</th>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Asignar coach a usuario
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Primero cambia el rol de alguien a &quot;coach&quot; arriba,
          luego asígnale usuarios aquí.
        </p>
        <div className="mt-4">
          <AssignCoachForm
            coaches={coaches}
            users={regularUsers}
            adminId={user.id}
          />
        </div>
      </div>

      {assignments && assignments.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">
            Asignaciones actuales
          </h2>
          <div className="mt-4 flex flex-col gap-2">
            {assignments.map((a) => {
              const coach = userMap.get(a.coach_id);
              const usr = userMap.get(a.user_id);
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                >
                  <span>
                    <strong>{coach?.full_name ?? coach?.email}</strong>{" "}
                    → {usr?.full_name ?? usr?.email}
                  </span>
                  <UnassignButton assignmentId={a.id} />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
