import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin({ requireSuperAdmin: true });
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("role, is_super_admin")
    .eq("id", id)
    .single();

  if (target?.role !== "administrador") {
    return NextResponse.json(
      { error: "Esta cuenta no tiene rol administrador" },
      { status: 400 }
    );
  }

  if (target.is_super_admin) {
    return NextResponse.json(
      { error: "No se puede eliminar al administrador principal" },
      { status: 400 }
    );
  }

  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
