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
  // Solo existe si el usuario entró con Google OAuth; para cuentas
  // creadas con correo/contraseña, queda null y se usa la inicial.
  const avatarUrl =
    (user.user_metadata?.avatar_url as string | undefined) ??
    (user.user_metadata?.picture as string | undefined) ??
    null;

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

    const { count: unseenMatchComments } = await supabase
      .from("job_match_comments")
      .select("id", { count: "exact", head: true })
      .eq("seen_by_user", false);

    const { count: unseenOppComments } = await supabase
      .from("opportunity_comments")
      .select("id", { count: "exact", head: true })
      .eq("seen_by_user", false);

    const { count: unseenNotes } = await supabase
      .from("coach_notes")
      .select("id", { count: "exact", head: true })
      .eq("seen_by_user", false)
      .eq("visible_to_user", true);

    const { count: unseenCalendarComments } = await supabase
      .from("calendar_event_comments")
      .select("id", { count: "exact", head: true })
      .eq("seen_by_user", false);

    if (pendingTasks) badges["/dashboard/tasks"] = pendingTasks;
    if (newInterviews) badges["/dashboard/interview"] = newInterviews;
    if (unseenCvComments) badges["/dashboard/cv"] = unseenCvComments;
    if (unseenLinkedinComments) badges["/dashboard/linkedin"] = unseenLinkedinComments;
    if (unseenMatchComments) badges["/dashboard/matching"] = unseenMatchComments;
    if (unseenOppComments) badges["/dashboard/opportunities"] = unseenOppComments;
    if (unseenNotes) badges["/dashboard/notes"] = unseenNotes;
    if (unseenCalendarComments) badges["/dashboard/calendar"] = unseenCalendarComments;
  }

  if (role === "coach") {
    let pendingSignal = 0;

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
      pendingSignal += sessionIds.filter((id) => !commentedSet.has(id)).length;
    }

    const { data: myCompletedTasks } = await supabase
      .from("coach_tasks")
      .select("id")
      .eq("coach_id", user.id)
      .eq("status", "completada");

    if (myCompletedTasks && myCompletedTasks.length > 0) {
      const taskIds = myCompletedTasks.map((t) => t.id);
      const { data: commentedTasks } = await supabase
        .from("coach_task_comments")
        .select("task_id")
        .in("task_id", taskIds);

      const commentedSet = new Set((commentedTasks ?? []).map((c) => c.task_id));
      pendingSignal += taskIds.filter((id) => !commentedSet.has(id)).length;
    }

    // Nota: el punto del sidebar solo mira entrevistas y tareas completadas
    // sin comentar (las señales más urgentes: alguien ya hizo algo y
    // espera respuesta). El inbox completo en /dashboard/coach revisa
    // 7 categorías en total (incluye CV, LinkedIn, Matching, CRM y
    // Calendario) — no se replica todo aquí para no sumar ~14 consultas
    // extra en cada navegación del coach.
    if (pendingSignal > 0) {
      badges["/dashboard/coach"] = pendingSignal;
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

    const { count: pendingHeadhunterRequests } = await supabase
      .from("headhunter_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "pendiente");

    if (pendingHeadhunterRequests) {
      badges["/dashboard/admin/headhunters"] = pendingHeadhunterRequests;
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
      avatarUrl={avatarUrl}
      roleLabel={ROLE_LABELS[role] ?? role}
      today={today}
    >
      {children}
    </DashboardShell>
  );
}
