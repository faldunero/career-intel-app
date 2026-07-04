import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "./sidebar";
import GlobalSearch from "@/components/global-search";
import {
  BackHomeNav,
  FullscreenToggle,
  UserMenu,
} from "@/components/topbar-actions";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, career_score")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || user.email || "Usuario";
  const role = profile?.role ?? "usuario";

  // Badges tipo "hay algo nuevo" — solo lo que representa información
  // pendiente real, no un contador de todo lo que existe.
  const badges: Record<string, number> = {};

  if (role === "usuario") {
    const { count: pendingTasks } = await supabase
      .from("coach_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "completada");

    const { count: newInterviews } = await supabase
      .from("interview_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "disponible");

    if (pendingTasks) badges["/dashboard/tasks"] = pendingTasks;
    if (newInterviews) badges["/dashboard/interview"] = newInterviews;
  }

  if (role === "coach") {
    const { data: myCompletedSessions } = await supabase
      .from("interview_sessions")
      .select("id")
      .eq("coach_id", user.id)
      .eq("status", "completada");

    if (myCompletedSessions && myCompletedSessions.length > 0) {
      const sessionIds = myCompletedSessions.map((s) => s.id);
      const { data: commentedSessions } = await supabase
        .from("interview_comments")
        .select("session_id")
        .in("session_id", sessionIds);

      const commentedSet = new Set(
        (commentedSessions ?? []).map((c) => c.session_id)
      );
      const uncommented = sessionIds.filter((id) => !commentedSet.has(id));
      if (uncommented.length > 0) {
        badges["/dashboard/coach"] = uncommented.length;
      }
    }
  }

  if (role === "administrador") {
    const { data: usuarios } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "usuario");

    if (usuarios && usuarios.length > 0) {
      const { data: assignments } = await supabase
        .from("coach_assignments")
        .select("user_id");

      const assignedSet = new Set(
        (assignments ?? []).map((a) => a.user_id)
      );
      const unassignedCount = usuarios.filter(
        (u) => !assignedSet.has(u.id)
      ).length;

      if (unassignedCount > 0) {
        badges["/dashboard/admin/usuarios"] = unassignedCount;
      }
    }
  }

  const ROLE_LABELS: Record<string, string> = {
    usuario: "Usuario",
    coach: "Coach",
    administrador: "Administrador",
  };

  const today = new Date().toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} careerScore={profile?.career_score ?? null} badges={badges} />
      <div className="flex flex-1 flex-col overflow-y-auto bg-slate-50">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
          <BackHomeNav />
          <GlobalSearch />
          <div className="flex items-center gap-3">
            <FullscreenToggle />
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                {displayName}
              </p>
              <p className="text-xs text-slate-500">
                {ROLE_LABELS[role] ?? role} · {today}
              </p>
            </div>
            <UserMenu displayName={displayName} />
          </div>
        </div>
        <main className="flex-1 px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
