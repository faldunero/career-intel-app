import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";
import { sendEmail, baseEmailTemplate } from "@/lib/email";

export const runtime = "nodejs";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://career-intel-app.vercel.app";

function generateTempPassword() {
  // Password temporal random, el headhunter la cambia en su primer
  // login (mismo flujo obligatorio que ya existe para todos los roles).
  const chars =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$";
  let pass = "";
  for (let i = 0; i < 14; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

export async function POST(request: Request) {
  const check = await requireAdmin();
  if (!check.ok) {
    return NextResponse.json({ error: check.error }, { status: check.status });
  }

  const body = await request.json();
  const { requestId, accessDurationDays } = body as {
    requestId?: string;
    accessDurationDays?: number;
  };

  if (!requestId || !accessDurationDays || accessDurationDays <= 0) {
    return NextResponse.json(
      { error: "Falta requestId o accessDurationDays (debe ser mayor a 0)" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  const { data: reqRow, error: reqError } = await admin
    .from("headhunter_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (reqError || !reqRow) {
    return NextResponse.json(
      { error: "Solicitud no encontrada" },
      { status: 404 }
    );
  }

  if (reqRow.status !== "pendiente") {
    return NextResponse.json(
      { error: "Esta solicitud ya fue revisada" },
      { status: 400 }
    );
  }

  const tempPassword = generateTempPassword();
  const expiresAt = new Date(
    Date.now() + accessDurationDays * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: reqRow.email,
    password: tempPassword,
    email_confirm: true,
    user_metadata: { full_name: reqRow.full_name },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message ?? "No se pudo crear la cuenta" },
      { status: 400 }
    );
  }

  const { error: roleError } = await admin
    .from("profiles")
    .update({
      role: "headhunter",
      must_change_password: true,
      headhunter_access_expires_at: expiresAt,
      headhunter_company: reqRow.company,
      full_name: reqRow.full_name,
    })
    .eq("id", created.user.id);

  if (roleError) {
    return NextResponse.json(
      {
        error: `Cuenta creada, pero no se pudo configurar el rol headhunter: ${roleError.message}`,
      },
      { status: 500 }
    );
  }

  await admin
    .from("headhunter_requests")
    .update({
      status: "aprobada",
      access_duration_days: accessDurationDays,
      headhunter_user_id: created.user.id,
      reviewed_by: check.adminId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  await sendEmail({
    to: reqRow.email,
    subject: "Tu acceso a Career Intelligence AI fue aprobado",
    html: baseEmailTemplate({
      preheader: "Tu solicitud de acceso fue aprobada",
      heading: "Tu acceso fue aprobado",
      bodyHtml: `
        <p>Hola ${reqRow.full_name},</p>
        <p>Tu solicitud de acceso a nuestra base de candidatos fue aprobada.
        Tu acceso es válido por <strong>${accessDurationDays} días</strong>
        (hasta el ${new Date(expiresAt).toLocaleDateString("es-CL")}).</p>
        <p>Credenciales de acceso:</p>
        <p>Correo: <strong>${reqRow.email}</strong><br/>
        Contraseña temporal: <strong>${tempPassword}</strong></p>
        <p>Al ingresar, vas a tener que cambiar esta contraseña y
        configurar verificación en dos pasos (obligatorio para todas
        las cuentas de la plataforma).</p>
      `,
      ctaLabel: "Iniciar sesión",
      ctaUrl: `${APP_URL}/login`,
    }),
  });

  return NextResponse.json({ ok: true });
}
