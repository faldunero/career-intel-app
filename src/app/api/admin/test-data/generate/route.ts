import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

const TEST_PASSWORD = "TestData2026!";
const RUN_TAG = () => Date.now().toString().slice(-6);

const INDUSTRIES = ["Tecnología", "Retail", "Banca", "Salud", "Minería", "Educación", "Construcción"];
const POSITIONS = [
  "Gerente de Operaciones",
  "Subgerente de Tecnología",
  "Jefe de Proyectos",
  "Analista Senior",
  "Director Comercial",
  "Product Manager",
  "Jefe de Finanzas",
  "Coordinador de RRHH",
];
const SENIORITIES = ["Jefatura", "Gerencia", "Dirección", "Senior", "Semi-Senior"];
const COMPANIES = ["Acme Corp", "Norte Retail", "Banco Andino", "Salud Total", "Minera Sur"];
const OPP_STATUSES = ["por_postular", "postulado", "entrevista", "oferta", "rechazado"];
const TASK_STATUSES = ["pendiente", "en_progreso", "completada"];

function pick<T>(arr: T[], i: number): T {
  return arr[i % arr.length];
}

export async function POST() {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const admin = createAdminClient();
  const tag = RUN_TAG();
  const created = {
    coaches: 0,
    users: 0,
    headhunters: 0,
    opportunities: 0,
    tasks: 0,
    events: 0,
    errors: [] as string[],
  };
  const accounts = {
    coaches: [] as { email: string; full_name: string }[],
    users: [] as { email: string; full_name: string }[],
    headhunters: [] as { email: string; full_name: string }[],
  };

  // ---------- Coaches ----------
  const coachIds: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const email = `test.coach${i}.${tag}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: `TEST Coach ${i}` },
    });
    if (error || !data.user) {
      created.errors.push(`Coach ${i}: ${error?.message}`);
      continue;
    }
    await admin
      .from("profiles")
      .update({ role: "coach", must_change_password: false, is_test_data: true })
      .eq("id", data.user.id);
    coachIds.push(data.user.id);
    created.coaches++;
    accounts.coaches.push({ email, full_name: `TEST Coach ${i}` });
  }

  // ---------- Usuarios ----------
  const userIds: string[] = [];
  for (let i = 1; i <= 15; i++) {
    const email = `test.usuario${i}.${tag}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: `TEST Usuario ${i}` },
    });
    if (error || !data.user) {
      created.errors.push(`Usuario ${i}: ${error?.message}`);
      continue;
    }

    const industry = pick(INDUSTRIES, i);
    const position = pick(POSITIONS, i);
    const seniority = pick(SENIORITIES, i);
    const profileCompleted = i % 3 !== 0;
    const visibleToHeadhunters = i % 2 === 0;

    await admin
      .from("profiles")
      .update({
        role: "usuario",
        must_change_password: false,
        is_test_data: true,
        industry,
        current_position: position,
        seniority,
        city: "Santiago",
        country: "Chile",
        profile_completed: profileCompleted,
        career_score: profileCompleted ? 40 + ((i * 7) % 55) : null,
        visible_to_headhunters: visibleToHeadhunters,
      })
      .eq("id", data.user.id);

    userIds.push(data.user.id);
    created.users++;
    accounts.users.push({ email, full_name: `TEST Usuario ${i}` });

    // La mayoría queda asignada a algún coach de prueba; algunos
    // quedan sin asignar para probar el badge de "sin coach".
    let coachId: string | null = null;
    if (coachIds.length > 0 && i % 4 !== 0) {
      coachId = pick(coachIds, i);
      await admin
        .from("coach_assignments")
        .insert({ coach_id: coachId, user_id: data.user.id });
    }

    // Oportunidades (CRM) — 1 a 2 por usuario, estados variados.
    const oppCount = (i % 2) + 1;
    for (let j = 0; j < oppCount; j++) {
      const status = pick(OPP_STATUSES, i + j);
      const { data: opp } = await admin
        .from("opportunities")
        .insert({
          user_id: data.user.id,
          company: pick(COMPANIES, i + j),
          job_title: pick(POSITIONS, i + j + 1),
          status,
          source: "Datos de prueba",
        })
        .select("id")
        .single();

      // Si tiene coach y la oportunidad quedó activa, deja un
      // comentario de ejemplo para probar el feed de comentarios.
      if (opp && coachId && status !== "por_postular" && j === 0) {
        await admin.from("opportunity_comments").insert({
          opportunity_id: opp.id,
          coach_id: coachId,
          comment: "Comentario de prueba: revisa el fit cultural antes de avanzar.",
        });
      }
    }
    created.opportunities += oppCount;

    // Tareas — solo si tiene coach asignado (las asigna el coach).
    if (coachId) {
      const taskStatus = pick(TASK_STATUSES, i);
      await admin.from("coach_tasks").insert({
        coach_id: coachId,
        user_id: data.user.id,
        title: `Tarea de prueba ${i}`,
        description: "Generada automáticamente por el set de datos de prueba.",
        status: taskStatus,
      });
      created.tasks++;
    }

    // Evento de calendario — la mitad de los usuarios.
    if (i % 2 === 0) {
      const daysOffset = (i % 10) - 5; // mezcla pasados y futuros
      const eventDate = new Date(Date.now() + daysOffset * 24 * 60 * 60 * 1000);
      await admin.from("calendar_events").insert({
        user_id: data.user.id,
        event_type: "sesion_coach",
        title: `Sesión de prueba ${i}`,
        event_date: eventDate.toISOString().slice(0, 10),
      });
      created.events++;
    }
  }

  // ---------- Headhunters (ya aprobados, con acceso vigente 30 días) ----------
  for (let i = 1; i <= 3; i++) {
    const email = `test.headhunter${i}.${tag}@example.com`;
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: TEST_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: `TEST Headhunter ${i}` },
    });
    if (error || !data.user) {
      created.errors.push(`Headhunter ${i}: ${error?.message}`);
      continue;
    }

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    await admin
      .from("profiles")
      .update({
        role: "headhunter",
        must_change_password: false,
        is_test_data: true,
        headhunter_access_expires_at: expiresAt,
        headhunter_company: `TEST Company ${i}`,
      })
      .eq("id", data.user.id);

    await admin.from("headhunter_requests").insert({
      full_name: `TEST Headhunter ${i}`,
      email,
      company: `TEST Company ${i}`,
      status: "aprobada",
      access_duration_days: 30,
      headhunter_user_id: data.user.id,
      reviewed_by: check.adminId,
      reviewed_at: new Date().toISOString(),
      is_test_data: true,
    });

    created.headhunters++;
    accounts.headhunters.push({ email, full_name: `TEST Headhunter ${i}` });
  }

  return NextResponse.json({
    ok: true,
    tag,
    password: TEST_PASSWORD,
    accounts,
    ...created,
  });
}
