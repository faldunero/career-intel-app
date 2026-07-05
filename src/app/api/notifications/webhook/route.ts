import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, baseEmailTemplate } from "@/lib/email";

// URL base de la app para armar los links de los correos.
const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://career-intel-app.vercel.app";

// Payload que manda Supabase Database Webhooks en cada INSERT/UPDATE:
// { type: "INSERT" | "UPDATE" | "DELETE", table: string, schema: string,
//   record: {...}, old_record: {...} | null }
type WebhookPayload = {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, unknown>;
  old_record: Record<string, unknown> | null;
};

export async function POST(request: Request) {
  // Seguridad: Supabase manda el secreto compartido en este header,
  // configurado al crear cada webhook (ver instrucciones de setup).
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.SUPABASE_WEBHOOK_SECRET}`;
  if (!process.env.SUPABASE_WEBHOOK_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const payload = (await request.json()) as WebhookPayload;
  const supabase = createAdminClient();

  try {
    switch (payload.table) {
      case "cv_comments":
        await handleCvComment(supabase, payload);
        break;
      case "linkedin_comments":
        await handleLinkedinComment(supabase, payload);
        break;
      case "job_match_comments":
        await handleMatchComment(supabase, payload);
        break;
      case "opportunity_comments":
        await handleOpportunityComment(supabase, payload);
        break;
      case "coach_task_comments":
        await handleTaskComment(supabase, payload);
        break;
      case "calendar_event_comments":
        await handleCalendarComment(supabase, payload);
        break;
      case "interview_comments":
        await handleInterviewComment(supabase, payload);
        break;
      case "coach_notes":
        await handleCoachNote(supabase, payload);
        break;
      default:
        break;
    }
  } catch (err) {
    // Nunca devolvemos error 500 por un fallo de email: no queremos
    // que Supabase reintente indefinidamente ni que esto bloquee el
    // insert original (que de todas formas ya ocurrió).
    console.error("notifications/webhook error:", err);
  }

  return NextResponse.json({ ok: true });
}

type AdminClient = ReturnType<typeof createAdminClient>;

async function getUserEmail(supabase: AdminClient, userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("email, full_name")
    .eq("id", userId)
    .single();
  return data;
}

async function getCoachName(supabase: AdminClient, coachId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", coachId)
    .single();
  return data?.full_name ?? "Tu coach";
}

async function notifyUser({
  userEmail,
  userName,
  coachName,
  heading,
  bodyHtml,
  ctaLabel,
  path,
}: {
  userEmail: string;
  userName: string | null;
  coachName: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  path: string;
}) {
  await sendEmail({
    to: userEmail,
    subject: heading,
    html: baseEmailTemplate({
      preheader: `${coachName} dejó feedback nuevo para ti`,
      heading,
      bodyHtml: `<p>Hola${userName ? ` ${userName}` : ""},</p>${bodyHtml}`,
      ctaLabel,
      ctaUrl: `${APP_URL}${path}`,
    }),
  });
}

async function handleCvComment(supabase: AdminClient, payload: WebhookPayload) {
  if (payload.type !== "INSERT") return;
  const cvId = payload.record.cv_id as string;
  const coachId = payload.record.coach_id as string;

  const { data: cv } = await supabase
    .from("cvs")
    .select("user_id, file_name")
    .eq("id", cvId)
    .single();
  if (!cv) return;

  const user = await getUserEmail(supabase, cv.user_id);
  if (!user?.email) return;
  const coachName = await getCoachName(supabase, coachId);

  await notifyUser({
    userEmail: user.email,
    userName: user.full_name,
    coachName,
    heading: "Tu coach comentó tu CV",
    bodyHtml: `<p><strong>${coachName}</strong> dejó feedback sobre tu CV (${cv.file_name}).</p>`,
    ctaLabel: "Ver comentario",
    path: "/dashboard/cv",
  });
}

async function handleLinkedinComment(
  supabase: AdminClient,
  payload: WebhookPayload
) {
  if (payload.type !== "INSERT") return;
  const profileId = payload.record.linkedin_profile_id as string;
  const coachId = payload.record.coach_id as string;

  const { data: li } = await supabase
    .from("linkedin_profiles")
    .select("user_id")
    .eq("id", profileId)
    .single();
  if (!li) return;

  const user = await getUserEmail(supabase, li.user_id);
  if (!user?.email) return;
  const coachName = await getCoachName(supabase, coachId);

  await notifyUser({
    userEmail: user.email,
    userName: user.full_name,
    coachName,
    heading: "Tu coach comentó tu LinkedIn",
    bodyHtml: `<p><strong>${coachName}</strong> dejó feedback sobre el análisis de tu perfil de LinkedIn.</p>`,
    ctaLabel: "Ver comentario",
    path: "/dashboard/linkedin",
  });
}

async function handleMatchComment(
  supabase: AdminClient,
  payload: WebhookPayload
) {
  if (payload.type !== "INSERT") return;
  const matchId = payload.record.job_match_id as string;
  const coachId = payload.record.coach_id as string;

  const { data: match } = await supabase
    .from("job_matches")
    .select("user_id, job_title, company")
    .eq("id", matchId)
    .single();
  if (!match) return;

  const user = await getUserEmail(supabase, match.user_id);
  if (!user?.email) return;
  const coachName = await getCoachName(supabase, coachId);
  const jobLabel = `${match.job_title ?? "una vacante"}${match.company ? ` — ${match.company}` : ""}`;

  await notifyUser({
    userEmail: user.email,
    userName: user.full_name,
    coachName,
    heading: "Tu coach comentó una vacante",
    bodyHtml: `<p><strong>${coachName}</strong> dejó feedback sobre el análisis de matching de <strong>${jobLabel}</strong>.</p>`,
    ctaLabel: "Ver comentario",
    path: "/dashboard/matching",
  });
}

async function handleOpportunityComment(
  supabase: AdminClient,
  payload: WebhookPayload
) {
  if (payload.type !== "INSERT") return;
  const oppId = payload.record.opportunity_id as string;
  const coachId = payload.record.coach_id as string;

  const { data: opp } = await supabase
    .from("opportunities")
    .select("user_id, job_title, company")
    .eq("id", oppId)
    .single();
  if (!opp) return;

  const user = await getUserEmail(supabase, opp.user_id);
  if (!user?.email) return;
  const coachName = await getCoachName(supabase, coachId);
  const jobLabel = `${opp.job_title ?? "una postulación"}${opp.company ? ` — ${opp.company}` : ""}`;

  await notifyUser({
    userEmail: user.email,
    userName: user.full_name,
    coachName,
    heading: "Tu coach comentó una postulación",
    bodyHtml: `<p><strong>${coachName}</strong> dejó feedback sobre <strong>${jobLabel}</strong> en tu CRM.</p>`,
    ctaLabel: "Ver comentario",
    path: "/dashboard/opportunities",
  });
}

async function handleTaskComment(
  supabase: AdminClient,
  payload: WebhookPayload
) {
  if (payload.type !== "INSERT") return;
  const taskId = payload.record.task_id as string;
  const coachId = payload.record.coach_id as string;

  const { data: task } = await supabase
    .from("coach_tasks")
    .select("user_id, title")
    .eq("id", taskId)
    .single();
  if (!task) return;

  const user = await getUserEmail(supabase, task.user_id);
  if (!user?.email) return;
  const coachName = await getCoachName(supabase, coachId);

  await notifyUser({
    userEmail: user.email,
    userName: user.full_name,
    coachName,
    heading: "Tu coach comentó una tarea",
    bodyHtml: `<p><strong>${coachName}</strong> dejó feedback en tu tarea "<strong>${task.title}</strong>".</p>`,
    ctaLabel: "Ver comentario",
    path: "/dashboard/tasks",
  });
}

async function handleCalendarComment(
  supabase: AdminClient,
  payload: WebhookPayload
) {
  if (payload.type !== "INSERT") return;
  const eventId = payload.record.event_id as string;
  const coachId = payload.record.coach_id as string;

  const { data: event } = await supabase
    .from("calendar_events")
    .select("user_id, title")
    .eq("id", eventId)
    .single();
  if (!event) return;

  const user = await getUserEmail(supabase, event.user_id);
  if (!user?.email) return;
  const coachName = await getCoachName(supabase, coachId);

  await notifyUser({
    userEmail: user.email,
    userName: user.full_name,
    coachName,
    heading: "Tu coach dejó seguimiento de un evento",
    bodyHtml: `<p><strong>${coachName}</strong> dejó seguimiento sobre "<strong>${event.title}</strong>" en tu calendario.</p>`,
    ctaLabel: "Ver comentario",
    path: "/dashboard/calendar",
  });
}

async function handleInterviewComment(
  supabase: AdminClient,
  payload: WebhookPayload
) {
  if (payload.type !== "INSERT") return;
  const sessionId = payload.record.session_id as string;
  const coachId = payload.record.coach_id as string;

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("user_id, session_type")
    .eq("id", sessionId)
    .single();
  if (!session) return;

  const user = await getUserEmail(supabase, session.user_id);
  if (!user?.email) return;
  const coachName = await getCoachName(supabase, coachId);

  await notifyUser({
    userEmail: user.email,
    userName: user.full_name,
    coachName,
    heading: "Tu coach comentó tu simulación de entrevista",
    bodyHtml: `<p><strong>${coachName}</strong> revisó tu simulación de entrevista y dejó comentarios.</p>`,
    ctaLabel: "Ver comentarios",
    path: "/dashboard/interview",
  });
}

async function handleCoachNote(supabase: AdminClient, payload: WebhookPayload) {
  const record = payload.record;
  const oldRecord = payload.old_record;

  const isNewSharedNote =
    payload.type === "INSERT" && record.visible_to_user === true;
  const justBecameShared =
    payload.type === "UPDATE" &&
    oldRecord?.visible_to_user === false &&
    record.visible_to_user === true;

  if (!isNewSharedNote && !justBecameShared) return;

  const userId = record.user_id as string;
  const coachId = record.coach_id as string;
  const note = record.note as string;

  const user = await getUserEmail(supabase, userId);
  if (!user?.email) return;
  const coachName = await getCoachName(supabase, coachId);

  await notifyUser({
    userEmail: user.email,
    userName: user.full_name,
    coachName,
    heading: "Tu coach compartió una nota contigo",
    bodyHtml: `<p><strong>${coachName}</strong> compartió esta observación contigo:</p><p style="background:#f5f5f5;border:1px solid #000;padding:12px;">${note}</p>`,
    ctaLabel: "Ver nota",
    path: "/dashboard/notes",
  });
}
