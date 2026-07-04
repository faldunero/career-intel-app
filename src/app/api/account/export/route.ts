import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const [
    profile,
    cvs,
    linkedinProfiles,
    opportunities,
    jobMatches,
    coachTasks,
    calendarEvents,
    interviewSessions,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("cvs").select("*").eq("user_id", user.id),
    supabase.from("linkedin_profiles").select("*").eq("user_id", user.id),
    supabase.from("opportunities").select("*").eq("user_id", user.id),
    supabase.from("job_matches").select("*").eq("user_id", user.id),
    supabase.from("coach_tasks").select("*").eq("user_id", user.id),
    supabase.from("calendar_events").select("*").eq("user_id", user.id),
    supabase.from("interview_sessions").select("*").eq("user_id", user.id),
  ]);

  const exportData = {
    exportado_el: new Date().toISOString(),
    cuenta: { id: user.id, email: user.email },
    perfil: profile.data,
    cvs: cvs.data,
    linkedin: linkedinProfiles.data,
    oportunidades: opportunities.data,
    matching_de_vacantes: jobMatches.data,
    tareas: coachTasks.data,
    calendario: calendarEvents.data,
    entrevistas: interviewSessions.data,
  };

  return NextResponse.json(exportData, {
    headers: {
      "Content-Disposition": 'attachment; filename="mis-datos.json"',
    },
  });
}
