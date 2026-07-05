import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";
import { sendEmail, baseEmailTemplate } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const body = await request.json();
  const { requestId } = body as { requestId?: string };

  if (!requestId) {
    return NextResponse.json({ error: "Falta requestId" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: reqRow } = await admin
    .from("headhunter_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (!reqRow) {
    return NextResponse.json(
      { error: "Solicitud no encontrada" },
      { status: 404 }
    );
  }

  await admin
    .from("headhunter_requests")
    .update({
      status: "rechazada",
      reviewed_by: check.adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  await sendEmail({
    to: reqRow.email,
    subject: "Tu solicitud de acceso no fue aprobada",
    html: baseEmailTemplate({
      preheader: "Actualización sobre tu solicitud",
      heading: "Tu solicitud no fue aprobada",
      bodyHtml: `
        <p>Hola ${reqRow.full_name},</p>
        <p>Revisamos tu solicitud de acceso a nuestra base de candidatos
        y por ahora no fue aprobada. Si crees que esto es un error o
        quieres más información, puedes escribirnos respondiendo este
        correo.</p>
      `,
      ctaLabel: "Volver al sitio",
      ctaUrl: "https://career-intel-app.vercel.app",
    }),
  });

  return NextResponse.json({ ok: true });
}
