import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Derecho de acceso / portabilidad (Ley 21.719, art. ARCO+).
//
// El contenido de la exportación depende del rol de quien la pide:
// - usuario: todo dato que le concierne, generado por él o por su
//   coach (comentarios, notas, historial de descargas de su CV).
// - coach/admin/headhunter: su propio perfil, más — para coach — el
//   trabajo que él mismo generó (notas, tareas, comentarios que
//   escribió sobre distintos usuarios), que es su propio dato de
//   autoría aunque también concierna a terceros.
export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "usuario";

  if (role === "coach") {
    return exportForCoach(user, profile);
  }

  if (role === "headhunter") {
    return exportForHeadhunter(user, profile);
  }

  return exportForUsuario(user, profile);

  // ---------------------------------------------------------------
  async function exportForHeadhunter(
    user: { id: string; email?: string },
    profile: Record<string, unknown> | null
  ) {
    const [myRequest, myDownloads] = await Promise.all([
      supabase
        .from("headhunter_requests")
        .select("*")
        .eq("email", user.email ?? "")
        .order("created_at", { ascending: false }),
      supabase
        .from("headhunter_cv_downloads")
        .select("id, downloaded_at, candidate:profiles!candidate_user_id(full_name)")
        .eq("headhunter_id", user.id),
    ]);

    const exportData = {
      exportado_el: new Date().toISOString(),
      nota: "Como headhunter, esta exportación incluye tu perfil, la solicitud de acceso que enviaste, y el historial de CVs que descargaste. No incluye los datos de los candidatos — esos les pertenecen a ellos.",
      cuenta: { id: user.id, email: user.email },
      perfil: profile,
      mi_solicitud_de_acceso: myRequest.data,
      mis_descargas_de_cv: myDownloads.data,
    };

    return NextResponse.json(exportData, {
      headers: { "Content-Disposition": 'attachment; filename="mis-datos.json"' },
    });
  }

  // ---------------------------------------------------------------
  async function exportForUsuario(
    user: { id: string; email?: string },
    profile: Record<string, unknown> | null
  ) {
    const [
      cvs,
      linkedinProfiles,
      opportunities,
      jobMatches,
      coachTasks,
      calendarEvents,
      interviewSessions,
      psychAssignments,
      coachNotes,
      coachAssignments,
      cvDownloadsByHeadhunters,
      notificationDismissals,
    ] = await Promise.all([
      supabase.from("cvs").select("*").eq("user_id", user.id),
      supabase.from("linkedin_profiles").select("*").eq("user_id", user.id),
      supabase.from("opportunities").select("*").eq("user_id", user.id),
      supabase.from("job_matches").select("*").eq("user_id", user.id),
      supabase.from("coach_tasks").select("*").eq("user_id", user.id),
      supabase.from("calendar_events").select("*").eq("user_id", user.id),
      supabase.from("interview_sessions").select("*").eq("user_id", user.id),
      supabase.from("psych_assignments").select("*").eq("user_id", user.id),
      supabase.from("coach_notes").select("*").eq("user_id", user.id),
      supabase.from("coach_assignments").select("*").eq("user_id", user.id),
      supabase
        .from("headhunter_cv_downloads")
        .select("id, downloaded_at")
        .eq("candidate_user_id", user.id),
      supabase.from("notification_dismissals").select("*").eq("user_id", user.id),
    ]);

    const cvIds = (cvs.data ?? []).map((r) => r.id);
    const linkedinIds = (linkedinProfiles.data ?? []).map((r) => r.id);
    const matchIds = (jobMatches.data ?? []).map((r) => r.id);
    const oppIds = (opportunities.data ?? []).map((r) => r.id);
    const taskIds = (coachTasks.data ?? []).map((r) => r.id);
    const eventIds = (calendarEvents.data ?? []).map((r) => r.id);
    const sessionIds = (interviewSessions.data ?? []).map((r) => r.id);
    const psychIds = (psychAssignments.data ?? []).map((r) => r.id);

    const [
      cvComments,
      linkedinComments,
      matchComments,
      oppComments,
      taskComments,
      eventComments,
      interviewComments,
      psychComments,
    ] = await Promise.all([
      cvIds.length
        ? supabase.from("cv_comments").select("*").in("cv_id", cvIds)
        : Promise.resolve({ data: [] }),
      linkedinIds.length
        ? supabase.from("linkedin_comments").select("*").in("linkedin_profile_id", linkedinIds)
        : Promise.resolve({ data: [] }),
      matchIds.length
        ? supabase.from("job_match_comments").select("*").in("job_match_id", matchIds)
        : Promise.resolve({ data: [] }),
      oppIds.length
        ? supabase.from("opportunity_comments").select("*").in("opportunity_id", oppIds)
        : Promise.resolve({ data: [] }),
      taskIds.length
        ? supabase.from("coach_task_comments").select("*").in("task_id", taskIds)
        : Promise.resolve({ data: [] }),
      eventIds.length
        ? supabase.from("calendar_event_comments").select("*").in("event_id", eventIds)
        : Promise.resolve({ data: [] }),
      sessionIds.length
        ? supabase.from("interview_comments").select("*").in("session_id", sessionIds)
        : Promise.resolve({ data: [] }),
      psychIds.length
        ? supabase.from("psych_comments").select("*").in("assignment_id", psychIds)
        : Promise.resolve({ data: [] }),
    ]);

    const exportData = {
      exportado_el: new Date().toISOString(),
      nota: "Esta exportación incluye todos los datos que te conciernen bajo la Ley 21.719, incluyendo comentarios y notas de tu coach sobre ti, aunque no todos te los hayamos mostrado dentro de la plataforma.",
      cuenta: { id: user.id, email: user.email },
      perfil: profile,
      coach_asignado: coachAssignments.data,
      cvs: cvs.data,
      comentarios_de_cv: cvComments.data,
      linkedin: linkedinProfiles.data,
      comentarios_de_linkedin: linkedinComments.data,
      matching_de_vacantes: jobMatches.data,
      comentarios_de_matching: matchComments.data,
      oportunidades: opportunities.data,
      comentarios_de_oportunidades: oppComments.data,
      tareas: coachTasks.data,
      comentarios_de_tareas: taskComments.data,
      calendario: calendarEvents.data,
      comentarios_de_calendario: eventComments.data,
      entrevistas: interviewSessions.data,
      comentarios_de_entrevistas: interviewComments.data,
      herramientas_psicolaborales: psychAssignments.data,
      comentarios_psicolaborales: psychComments.data,
      notas_de_tu_coach: coachNotes.data,
      descargas_de_tu_cv_por_headhunters: cvDownloadsByHeadhunters.data,
      notificaciones_descartadas: notificationDismissals.data,
    };

    return NextResponse.json(exportData, {
      headers: { "Content-Disposition": 'attachment; filename="mis-datos.json"' },
    });
  }

  // ---------------------------------------------------------------
  async function exportForCoach(
    user: { id: string; email?: string },
    profile: Record<string, unknown> | null
  ) {
    const [
      coachNotesWritten,
      coachTasksAssigned,
      coachAssignments,
      cvComments,
      linkedinComments,
      matchComments,
      oppComments,
      taskComments,
      eventComments,
      interviewComments,
      psychComments,
    ] = await Promise.all([
      supabase.from("coach_notes").select("*").eq("coach_id", user.id),
      supabase.from("coach_tasks").select("*").eq("coach_id", user.id),
      supabase.from("coach_assignments").select("*").eq("coach_id", user.id),
      supabase.from("cv_comments").select("*").eq("coach_id", user.id),
      supabase.from("linkedin_comments").select("*").eq("coach_id", user.id),
      supabase.from("job_match_comments").select("*").eq("coach_id", user.id),
      supabase.from("opportunity_comments").select("*").eq("coach_id", user.id),
      supabase.from("coach_task_comments").select("*").eq("coach_id", user.id),
      supabase.from("calendar_event_comments").select("*").eq("coach_id", user.id),
      supabase.from("interview_comments").select("*").eq("coach_id", user.id),
      supabase.from("psych_comments").select("*").eq("coach_id", user.id),
    ]);

    const exportData = {
      exportado_el: new Date().toISOString(),
      nota: "Como coach, esta exportación incluye tu perfil y todo el contenido que tú mismo escribiste (notas, tareas y comentarios) — no incluye los datos de los usuarios que acompañas, esos les pertenecen a ellos y los pueden exportar desde su propia cuenta.",
      cuenta: { id: user.id, email: user.email },
      perfil: profile,
      usuarios_asignados: coachAssignments.data,
      mis_notas_de_seguimiento: coachNotesWritten.data,
      mis_tareas_asignadas: coachTasksAssigned.data,
      mis_comentarios_de_cv: cvComments.data,
      mis_comentarios_de_linkedin: linkedinComments.data,
      mis_comentarios_de_matching: matchComments.data,
      mis_comentarios_de_oportunidades: oppComments.data,
      mis_comentarios_de_tareas: taskComments.data,
      mis_comentarios_de_calendario: eventComments.data,
      mis_comentarios_de_entrevistas: interviewComments.data,
      mis_comentarios_psicolaborales: psychComments.data,
    };

    return NextResponse.json(exportData, {
      headers: { "Content-Disposition": 'attachment; filename="mis-datos.json"' },
    });
  }
}
