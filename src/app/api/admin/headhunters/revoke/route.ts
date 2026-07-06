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
  const { userId } = body as { userId?: string };

  if (!userId) {
    return NextResponse.json({ error: "Falta userId" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (!profile || profile.role !== "headhunter") {
    return NextResponse.json(
      { error: "Esta cuenta no es un headhunter" },
      { status: 400 }
    );
  }

  // "Suspender" = vencer el acceso ahora mismo. La cuenta sigue
  // existiendo (no se borra), pero el middleware la va a mandar a
  // /dashboard/headhunter/vencido apenas intente entrar.
  const { error } = await admin
    .from("profiles")
    .update({ headhunter_access_expires_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
