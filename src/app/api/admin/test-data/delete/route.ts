import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

export async function POST() {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const admin = createAdminClient();

  const { data: testProfiles } = await admin
    .from("profiles")
    .select("id")
    .eq("is_test_data", true);

  const ids = (testProfiles ?? []).map((p) => p.id);
  let deleted = 0;
  const errors: string[] = [];

  // Borra cada cuenta de auth.users. Todas las tablas relacionadas
  // (profiles, cvs, coach_assignments, comentarios, etc.) se limpian
  // en cascada por las mismas referencias "on delete cascade" que ya
  // usa el borrado de cuenta normal (/api/account/delete).
  const maxRetries = 3;
  const baseDelay = 1000;

  for (const id of ids) {
    let deleteError = null;
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { error } = await admin.auth.admin.deleteUser(id);

      if (!error) {
        deleteError = null;
        break;
      }

      if (attempt === maxRetries - 1) {
        deleteError = error;
        break;
      }

      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (deleteError) {
      errors.push(`${id}: ${deleteError.message}`);
    } else {
      deleted++;
    }
  }

  // Las solicitudes de headhunter de prueba que no llegaron a crear
  // cuenta (por algún error a mitad de camino) se limpian aparte.
  await admin.from("headhunter_requests").delete().eq("is_test_data", true);

  return NextResponse.json({ ok: true, deleted, errors });
}
