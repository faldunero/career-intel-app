import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateUserForm from "../create-user-form";
import UsuariosTable from "../usuarios-table";

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
    .select("id, full_name, email, role, profile_completed, career_score, is_test_data")
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

  const userCoachMap: Record<string, string | null> = {};
  for (const a of assignments ?? []) {
    userCoachMap[a.user_id] = a.coach_id;
  }

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
        <div className="mt-4">
          <UsuariosTable
            users={users}
            coaches={coachList}
            userCoachMap={userCoachMap}
          />
        </div>
      </div>
    </div>
  );
}
