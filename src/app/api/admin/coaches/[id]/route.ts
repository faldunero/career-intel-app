import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, status: 401, error: "No autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "administrador") {
    return { ok: false as const, status: 403, error: "Solo un administrador puede hacer esto" };
  }

  return { ok: true as const };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const { id } = await params;
  const body = await request.json();
  const { fullName } = body as { fullName?: string };

  const admin = createAdminClient();

  // Solo permitimos editar cuentas que efectivamente son coach, para
  // que este endpoint no se use por error sobre cualquier usuario.
  const { data: target } = await admin
    .from("profiles")
    .select("role")
    .eq("id", id)
    .single();

  if (target?.role !== "coach") {
    return NextResponse.json(
      { error: "Esta cuenta no tiene rol coach" },
      { status: 400 }
    );
  }

  const { error } = await admin
    .from("profiles")
    .update({ full_name: fullName ?? null })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

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

  if (target?.role !== "coach") {
    return NextResponse.json(
      { error: "Esta cuenta no tiene rol coach" },
      { status: 400 }
    );
  }

  // Borra el usuario de auth.users. profiles, coach_assignments y
  // coach_notes se borran solos por los "on delete cascade".
  const { error } = await admin.auth.admin.deleteUser(id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
