import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RoleSelector from "../role-selector";
import CreateUserForm from "../create-user-form";
import CoachAssignSelector from "../coach-assign-selector";
import DeleteUserButton from "../delete-user-button";

export default async function AdminUsuariosPage() {
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

  const { data: usersOnly } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, profile_completed, career_score")
    .eq("role", "usuario")
    .order("created_at", { ascending: false });

  const { data: coaches } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "coach")
    .order("created_at", { ascending: false });

  const { data: assignments } = await supabase
    .from("coach_assignments")
    .select("id, coach_id, user_id");

  const userCoachMap = new Map(
    (assignments ?? []).map((a) => [a.user_id, a.coach_id])
  );

  const users = usersOnly ?? [];
  const coachList = coaches ?? [];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900">Usuarios</h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">
            Usuarios ({users.length})
          </h2>
          <CreateUserForm coaches={coachList} />
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
                <th className="pb-2 pr-4"></th>
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
                    <CoachAssignSelector
                      userId={u.id}
                      coaches={coachList}
                      currentCoachId={userCoachMap.get(u.id) ?? null}
                    />
                  </td>
                  <td className="py-2 pr-4">
                    <DeleteUserButton
                      userId={u.id}
                      label={u.full_name ?? u.email ?? "este usuario"}
                    />
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-4 text-center text-sm text-slate-400">
                    No hay usuarios todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
