import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "./dashboard-shell";

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

    const { count: unseenCvComments } = await supabase
      .from("cv_comments")
      .select("id", { count: "exact", head: true })
      .eq("seen_by_user", false);

    const { count: unseenLinkedinComments } = await supabase
      .from("linkedin_comments")
      .select("id", { count: "exact", head: true })
      .eq("seen_by_user", false);

    if (pendingTasks) badges["/dashboard/tasks"] = pendingTasks;
    if (newInterviews) badges["/dashboard/interview"] = newInterviews;
    if (unseenCvComments) badges["/dashboard/cv"] = unseenCvComments;
    if (unseenLinkedinComments) badges["/dashboard/linkedin"] = unseenLinkedinComments;
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
    <DashboardShell
      role={role}
      careerScore={profile?.career_score ?? null}
      badges={badges}
      displayName={displayName}
      roleLabel={ROLE_LABELS[role] ?? role}
      today={today}
    >
      {children}
    </DashboardShell>
  );
}
