import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const body = await request.json();
  const { ids } = body as { ids?: string[] };

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "Falta la lista de ids" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: targets } = await admin
    .from("profiles")
    .select("id, is_super_admin")
    .in("id", ids);

  const deleted: string[] = [];
  const skipped: { id: string; reason: string }[] = [];

  for (const id of ids) {
    const target = (targets ?? []).find((t) => t.id === id);

    if (!target) {
      skipped.push({ id, reason: "No encontrado" });
      continue;
    }
    if (target.is_super_admin) {
      skipped.push({ id, reason: "Es el administrador principal, no se puede eliminar" });
      continue;
    }
    if (id === check.adminId) {
      skipped.push({ id, reason: "No puedes eliminar tu propia cuenta desde aquí" });
      continue;
    }

    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) {
      skipped.push({ id, reason: error.message });
    } else {
      deleted.push(id);
    }
  }

  return NextResponse.json({ ok: true, deleted, skipped });
}
