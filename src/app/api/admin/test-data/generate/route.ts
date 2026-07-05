import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

const TEST_PASSWORD = "TestData2026!";
const RUN_TAG = () => Date.now().toString().slice(-6);

const INDUSTRIES = ["Tecnología", "Retail", "Banca", "Salud", "Minería"];
const POSITIONS = [
  "Gerente de Operaciones",
  "Subgerente de Tecnología",
  "Jefe de Proyectos",
  "Analista Senior",
  "Director Comercial",
  "Product Manager",
];
const SENIORITIES = ["Jefatura", "Gerencia", "Dirección", "Senior"];

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
  const created = { coaches: 0, users: 0, headhunters: 0, errors: [] as string[] };

  // ---------- Coaches ----------
  const coachIds: string[] = [];
  for (let i = 1; i <= 3; i++) {
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
      .update({
        role: "coach",
        must_change_password: false,
        is_test_data: true,
      })
      .eq("id", data.user.id);
    coachIds.push(data.user.id);
    created.coaches++;
  }

  // ---------- Usuarios ----------
  const userIds: string[] = [];
  for (let i = 1; i <= 6; i++) {
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
    // La mitad de los usuarios de prueba queda visible para
    // headhunters, para que el buscador tenga resultados que mostrar.
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
        career_score: profileCompleted ? 50 + i * 6 : null,
        visible_to_headhunters: visibleToHeadhunters,
      })
      .eq("id", data.user.id);

    userIds.push(data.user.id);
    created.users++;

    // La mayoría queda asignada a algún coach de prueba; un par queda
    // sin asignar para poder probar el badge de "sin coach".
    if (coachIds.length > 0 && i <= 4) {
      const coachId = pick(coachIds, i);
      await admin
        .from("coach_assignments")
        .insert({ coach_id: coachId, user_id: data.user.id });
    }
  }

  // ---------- Headhunters (ya aprobados, con acceso vigente 30 días) ----------
  for (let i = 1; i <= 2; i++) {
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

    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

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
  }

  return NextResponse.json({
    ok: true,
    tag,
    password: TEST_PASSWORD,
    ...created,
  });
}
