import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import StatCard from "./stat-card";

export default async function AdminDashboardPage() {
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

  const { data: allProfiles } = await supabase
    .from("profiles")
    .select("id, role, career_score, profile_completed");

  const { data: assignments } = await supabase
    .from("coach_assignments")
    .select("user_id");

  const { data: interviewSessions } = await supabase
    .from("interview_sessions")
    .select("id, status");

  const profiles = allProfiles ?? [];
  const admins = profiles.filter((p) => p.role === "administrador");
  const coaches = profiles.filter((p) => p.role === "coach");
  const usuarios = profiles.filter((p) => p.role === "usuario");

  const assignedIds = new Set((assignments ?? []).map((a) => a.user_id));
  const sinCoach = usuarios.filter((u) => !assignedIds.has(u.id)).length;

  const sessions = interviewSessions ?? [];
  const entrevistasCompletadas = sessions.filter(
    (s) => s.status === "completada"
  ).length;

  const perfilesCompletos = usuarios.filter((u) => u.profile_completed).length;
  const porcentajePerfiles = usuarios.length
    ? Math.round((perfilesCompletos / usuarios.length) * 100)
    : 0;

  const scores = usuarios
    .map((u) => u.career_score)
    .filter((s): s is number => s !== null && s !== undefined);
  const promedioScore = scores.length
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>
      <p className="mt-1 text-sm text-slate-500">
        Resumen general de la plataforma.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Usuarios"
          value={usuarios.length}
          href="/dashboard/admin/usuarios"
        />
        <StatCard
          label="Coaches"
          value={coaches.length}
          href="/dashboard/admin/coaches"
        />
        <StatCard
          label="Administradores"
          value={admins.length}
          href="/dashboard/admin/administradores"
        />
        <StatCard
          label="Usuarios sin coach"
          value={sinCoach}
          href="/dashboard/admin/usuarios"
          tone={sinCoach > 0 ? "warning" : "default"}
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="border border-black bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-black">
            Perfiles completos
          </h2>
          <p className="mt-3 text-3xl font-semibold text-black">
            {porcentajePerfiles}%
          </p>
          <div className="mt-3 h-2 w-full bg-[#eee]">
            <div
              className="h-2 bg-black"
              style={{ width: `${porcentajePerfiles}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[#666]">
            {perfilesCompletos} de {usuarios.length} usuarios completaron su
            perfil profesional.
          </p>
        </div>

        <div className="border border-black bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-black">
            Career Score promedio
          </h2>
          <p className="mt-3 text-3xl font-semibold text-black">
            {promedioScore ?? "—"}
            <span className="text-base font-normal text-[#999]">/100</span>
          </p>
          <p className="mt-2 text-xs text-[#666]">
            Calculado sobre {scores.length} usuario
            {scores.length !== 1 ? "s" : ""} con score disponible.
          </p>
        </div>
      </div>

      <div className="mt-6 border border-black bg-white p-6">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-black">
          Simulador de entrevistas
        </h2>
        <p className="mt-3 text-3xl font-semibold text-black">
          {entrevistasCompletadas}
        </p>
        <p className="mt-1 text-xs text-[#666]">
          Entrevistas completadas en toda la plataforma.
        </p>
      </div>
    </div>
  );
}
