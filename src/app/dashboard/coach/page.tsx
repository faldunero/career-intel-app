import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AssignedUsersTable from "./assigned-users-table";
import { TOOLS, type ToolKey } from "@/lib/psych-tools";

const SESSION_TYPE_LABELS: Record<string, string> = {
  recruiter: "Recruiter",
  rrhh: "RR.HH.",
  hiring_manager: "Hiring Manager",
  director: "Director",
  ceo: "CEO",
  panel_tecnico: "Panel Técnico",
};

type PendingItem = {
  type: "interview" | "task" | "calendar" | "cv" | "linkedin" | "matching" | "opportunity" | "psych";
  userId: string;
  userName: string;
  title: string;
  date: string | null;
  href: string;
};

const TYPE_META: Record<
  PendingItem["type"],
  { label: string; icon: string; verb: string }
> = {
  interview: { label: "Entrevista completada sin comentar", icon: "🎤", verb: "Comentar" },
  task: { label: "Tarea completada sin comentar", icon: "✅", verb: "Comentar" },
  calendar: { label: "Evento pasado sin seguimiento", icon: "📅", verb: "Dejar seguimiento" },
  cv: { label: "CV analizado sin revisar", icon: "📄", verb: "Revisar" },
  linkedin: { label: "LinkedIn analizado sin revisar", icon: "💼", verb: "Revisar" },
  matching: { label: "Vacante analizada sin revisar", icon: "🎯", verb: "Revisar" },
  opportunity: { label: "Postulación activa sin comentar", icon: "📌", verb: "Comentar" },
  psych: { label: "Herramienta psicolaboral completada sin comentar", icon: "🧭", verb: "Comentar" },
};

export default async function CoachPage() {
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

  if (myProfile?.role !== "coach") {
    redirect("/dashboard");
  }

  const coachId = user.id;

  const { data: assignments } = await supabase
    .from("coach_assignments")
    .select(
      "user_id, profiles:user_id (id, full_name, email, profile_completed, career_score)"
    )
    .eq("coach_id", coachId);

  const assigned = assignments ?? [];
  const userIds = assigned.map((a) => a.user_id);
  const userNameById = new Map<string, string>();
  for (const a of assigned) {
    const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
    userNameById.set(a.user_id, p?.full_name ?? p?.email ?? "Usuario");
  }

  const pending: PendingItem[] = [];

  if (userIds.length > 0) {
    // ---------- Entrevistas completadas sin comentar ----------
    const { data: sessions } = await supabase
      .from("interview_sessions")
      .select("id, user_id, session_type, created_at")
      .in("user_id", userIds)
      .eq("coach_id", coachId)
      .eq("status", "completada");

    if (sessions && sessions.length > 0) {
      const ids = sessions.map((s) => s.id);
      const { data: commented } = await supabase
        .from("interview_comments")
        .select("session_id")
        .in("session_id", ids);
      const commentedSet = new Set((commented ?? []).map((c) => c.session_id));
      for (const s of sessions) {
        if (commentedSet.has(s.id)) continue;
        pending.push({
          type: "interview",
          userId: s.user_id,
          userName: userNameById.get(s.user_id) ?? "Usuario",
          title: SESSION_TYPE_LABELS[s.session_type] ?? s.session_type,
          date: s.created_at,
          href: `/dashboard/coach/${s.user_id}/entrevistas`,
        });
      }
    }

    // ---------- Tareas completadas sin comentar ----------
    const { data: tasks } = await supabase
      .from("coach_tasks")
      .select("id, user_id, title, due_date, created_at")
      .in("user_id", userIds)
      .eq("coach_id", coachId)
      .eq("status", "completada");

    if (tasks && tasks.length > 0) {
      const ids = tasks.map((t) => t.id);
      const { data: commented } = await supabase
        .from("coach_task_comments")
        .select("task_id")
        .in("task_id", ids);
      const commentedSet = new Set((commented ?? []).map((c) => c.task_id));
      for (const t of tasks) {
        if (commentedSet.has(t.id)) continue;
        pending.push({
          type: "task",
          userId: t.user_id,
          userName: userNameById.get(t.user_id) ?? "Usuario",
          title: t.title,
          date: t.due_date ?? t.created_at,
          href: `/dashboard/coach/${t.user_id}/tareas`,
        });
      }
    }

    // ---------- Eventos pasados sin seguimiento ----------
    const todayStr = new Date().toISOString().slice(0, 10);
    const { data: events } = await supabase
      .from("calendar_events")
      .select("id, user_id, title, event_date")
      .in("user_id", userIds)
      .lt("event_date", todayStr);

    if (events && events.length > 0) {
      const ids = events.map((e) => e.id);
      const { data: commented } = await supabase
        .from("calendar_event_comments")
        .select("event_id")
        .in("event_id", ids);
      const commentedSet = new Set((commented ?? []).map((c) => c.event_id));
      for (const e of events) {
        if (commentedSet.has(e.id)) continue;
        pending.push({
          type: "calendar",
          userId: e.user_id,
          userName: userNameById.get(e.user_id) ?? "Usuario",
          title: e.title,
          date: e.event_date,
          href: `/dashboard/coach/${e.user_id}/calendario`,
        });
      }
    }

    // ---------- CVs analizados sin ningún comentario ----------
    const { data: cvs } = await supabase
      .from("cvs")
      .select("id, user_id, file_name, created_at, ats_analysis")
      .in("user_id", userIds)
      .not("ats_analysis", "is", null);

    if (cvs && cvs.length > 0) {
      const ids = cvs.map((c) => c.id);
      const { data: commented } = await supabase
        .from("cv_comments")
        .select("cv_id")
        .in("cv_id", ids);
      const commentedSet = new Set((commented ?? []).map((c) => c.cv_id));
      for (const c of cvs) {
        if (commentedSet.has(c.id)) continue;
        pending.push({
          type: "cv",
          userId: c.user_id,
          userName: userNameById.get(c.user_id) ?? "Usuario",
          title: c.file_name,
          date: c.created_at,
          href: `/dashboard/coach/${c.user_id}/cv`,
        });
      }
    }

    // ---------- LinkedIn analizado sin ningún comentario ----------
    const { data: linkedinProfiles } = await supabase
      .from("linkedin_profiles")
      .select("id, user_id, analyzed_at, linkedin_analysis")
      .in("user_id", userIds)
      .not("linkedin_analysis", "is", null);

    if (linkedinProfiles && linkedinProfiles.length > 0) {
      const ids = linkedinProfiles.map((l) => l.id);
      const { data: commented } = await supabase
        .from("linkedin_comments")
        .select("linkedin_profile_id")
        .in("linkedin_profile_id", ids);
      const commentedSet = new Set(
        (commented ?? []).map((c) => c.linkedin_profile_id)
      );
      for (const l of linkedinProfiles) {
        if (commentedSet.has(l.id)) continue;
        pending.push({
          type: "linkedin",
          userId: l.user_id,
          userName: userNameById.get(l.user_id) ?? "Usuario",
          title: "Análisis de LinkedIn",
          date: l.analyzed_at,
          href: `/dashboard/coach/${l.user_id}/linkedin`,
        });
      }
    }

    // ---------- Vacantes analizadas sin ningún comentario ----------
    const { data: matches } = await supabase
      .from("job_matches")
      .select("id, user_id, job_title, company, created_at")
      .in("user_id", userIds);

    if (matches && matches.length > 0) {
      const ids = matches.map((m) => m.id);
      const { data: commented } = await supabase
        .from("job_match_comments")
        .select("job_match_id")
        .in("job_match_id", ids);
      const commentedSet = new Set((commented ?? []).map((c) => c.job_match_id));
      for (const m of matches) {
        if (commentedSet.has(m.id)) continue;
        pending.push({
          type: "matching",
          userId: m.user_id,
          userName: userNameById.get(m.user_id) ?? "Usuario",
          title: `${m.job_title ?? "Cargo no identificado"}${m.company ? ` — ${m.company}` : ""}`,
          date: m.created_at,
          href: `/dashboard/coach/${m.user_id}/matching`,
        });
      }
    }

    // ---------- Postulaciones activas sin ningún comentario ----------
    const { data: opps } = await supabase
      .from("opportunities")
      .select("id, user_id, job_title, company, created_at")
      .in("user_id", userIds)
      .neq("status", "por_postular");

    if (opps && opps.length > 0) {
      const ids = opps.map((o) => o.id);
      const { data: commented } = await supabase
        .from("opportunity_comments")
        .select("opportunity_id")
        .in("opportunity_id", ids);
      const commentedSet = new Set(
        (commented ?? []).map((c) => c.opportunity_id)
      );
      for (const o of opps) {
        if (commentedSet.has(o.id)) continue;
        pending.push({
          type: "opportunity",
          userId: o.user_id,
          userName: userNameById.get(o.user_id) ?? "Usuario",
          title: `${o.job_title ?? "Cargo sin definir"}${o.company ? ` — ${o.company}` : ""}`,
          date: o.created_at,
          href: `/dashboard/coach/${o.user_id}/crm`,
        });
      }
    }
    // ---------- Herramientas psicolaborales completadas sin comentar ----------
    const { data: psychAssignments } = await supabase
      .from("psych_assignments")
      .select("id, user_id, tool_key, completed_at")
      .in("user_id", userIds)
      .eq("status", "completado");

    if (psychAssignments && psychAssignments.length > 0) {
      const ids = psychAssignments.map((p) => p.id);
      const { data: commented } = await supabase
        .from("psych_comments")
        .select("assignment_id")
        .in("assignment_id", ids);
      const commentedSet = new Set((commented ?? []).map((c) => c.assignment_id));
      for (const p of psychAssignments) {
        if (commentedSet.has(p.id)) continue;
        pending.push({
          type: "psych",
          userId: p.user_id,
          userName: userNameById.get(p.user_id) ?? "Usuario",
          title: TOOLS[p.tool_key as ToolKey]?.title ?? p.tool_key,
          date: p.completed_at,
          href: `/dashboard/coach/${p.user_id}/psicolaboral`,
        });
      }
    }
  }

  // Prioridad: entrevistas y tareas completadas primero (alguien ya hizo
  // algo y espera respuesta), después seguimiento de calendario, después
  // contenido nuevo por revisar. Dentro de cada tipo, lo más antiguo primero.
  const TYPE_PRIORITY: Record<PendingItem["type"], number> = {
    interview: 0,
    task: 1,
    calendar: 2,
    opportunity: 3,
    psych: 4,
    cv: 5,
    linkedin: 6,
    matching: 7,
  };
  pending.sort((a, b) => {
    const pa = TYPE_PRIORITY[a.type];
    const pb = TYPE_PRIORITY[b.type];
    if (pa !== pb) return pa - pb;
    const da = a.date ? new Date(a.date).getTime() : 0;
    const db = b.date ? new Date(b.date).getTime() : 0;
    return da - db;
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Mis usuarios asignados
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        {assigned.length} usuario{assigned.length !== 1 ? "s" : ""}{" "}
        asignado{assigned.length !== 1 ? "s" : ""}.
      </p>

      <div className="mt-6 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pendientes ({pending.length})
        </h2>
      </div>

      {pending.length === 0 && userIds.length > 0 && (
        <p className="mt-2 text-sm text-slate-400">
          Estás al día — no hay nada pendiente entre tus usuarios. 🎉
        </p>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {pending.map((item, i) => {
          const meta = TYPE_META[item.type];
          return (
            <Link
              key={`${item.type}-${item.href}-${i}`}
              href={item.href}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-slate-300"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">{meta.icon}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {item.userName}
                    <span className="ml-2 font-normal text-slate-500">
                      — {item.title}
                    </span>
                  </p>
                  <p className="text-xs text-slate-400">
                    {meta.label}
                    {item.date
                      ? ` · ${new Date(item.date).toLocaleDateString("es-CL", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}`
                      : ""}
                  </p>
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {meta.verb}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Tus usuarios
        </h2>
      </div>

      <div className="mt-3">
        <AssignedUsersTable
          users={assigned
            .map((a) => {
              const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
              if (!p) return null;
              return {
                id: a.user_id,
                full_name: p.full_name,
                email: p.email,
                profile_completed: p.profile_completed,
                career_score: p.career_score,
                pendingCount: pending.filter((x) => x.userId === a.user_id).length,
              };
            })
            .filter((u): u is NonNullable<typeof u> => u !== null)}
        />
      </div>
    </div>
  );
}
