import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";

export const runtime = "nodejs";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { id } = await params;
  const admin = createAdminClient();

  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();

  if (target?.role !== "usuario") {
    return NextResponse.json(
      { error: "Esta cuenta no tiene rol usuario" },
      { status: 400 }
    );
  }

  // Intenta eliminar el usuario con reintentos automáticos
  let deleteError = null;
  const maxRetries = 3;
  const baseDelay = 1000;

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
    console.log(
      `admin-delete-user: reintentando deleteUser (intento ${attempt + 1}/${maxRetries})`,
      error
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  if (deleteError) {
    console.error("admin-delete-user: falló deleteUser", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
