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
  const { userId, days } = body as { userId?: string; days?: number };

  if (!userId || !days || days <= 0) {
    return NextResponse.json(
      { error: "Falta userId o days (debe ser mayor a 0)" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role, headhunter_access_expires_at")
    .eq("id", userId)
    .single();

  if (!profile || profile.role !== "headhunter") {
    return NextResponse.json(
      { error: "Esta cuenta no es un headhunter" },
      { status: 400 }
    );
  }

  // Extiende desde la fecha de vencimiento actual si todavía no venció,
  // o desde ahora si ya venció — nunca "pierde" días desperdiciados en
  // el pasado.
  const base =
    profile.headhunter_access_expires_at &&
    new Date(profile.headhunter_access_expires_at) > new Date()
      ? new Date(profile.headhunter_access_expires_at)
      : new Date();

  const newExpiry = new Date(
    base.getTime() + days * 24 * 60 * 60 * 1000
  ).toISOString();

  const { error } = await admin
    .from("profiles")
    .update({ headhunter_access_expires_at: newExpiry })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, newExpiry });
}
