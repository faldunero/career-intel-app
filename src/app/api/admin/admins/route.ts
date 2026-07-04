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
  const { email, password, fullName } = body as {
    email?: string;
    password?: string;
    fullName?: string;
  };

  if (!email || !password || password.length < 6) {
    return NextResponse.json(
      { error: "Correo y contraseña (mínimo 6 caracteres) son obligatorios" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName ?? null },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "No se pudo crear la cuenta" },
      { status: 400 }
    );
  }

  const { error: roleError } = await admin
    .from("profiles")
    .update({ role: "administrador", must_change_password: true })
    .eq("id", created.user.id);

  if (roleError) {
    return NextResponse.json(
      { error: `Cuenta creada, pero no se pudo asignar el rol administrador: ${roleError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: created.user.id,
    email: created.user.email,
  });
}
