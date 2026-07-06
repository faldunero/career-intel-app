import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, baseEmailTemplate } from "@/lib/email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { data: headhunterProfile } = await supabase
    .from("profiles")
    .select("role, full_name, email, headhunter_company, headhunter_access_expires_at")
    .eq("id", user.id)
    .single();

  const expired =
    headhunterProfile?.role !== "headhunter" ||
    !headhunterProfile.headhunter_access_expires_at ||
    new Date(headhunterProfile.headhunter_access_expires_at) <= new Date();

  if (expired) {
    return NextResponse.json(
      { error: "No tienes acceso vigente de headhunter" },
      { status: 403 }
    );
  }

  const body = await request.json();
  const { cvId } = body as { cvId?: string };
  if (!cvId) {
    return NextResponse.json({ error: "Falta cvId" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: cv } = await admin
    .from("cvs")
    .select("id, user_id, file_name, storage_path")
    .eq("id", cvId)
    .single();

  if (!cv) {
    return NextResponse.json({ error: "CV no encontrado" }, { status: 404 });
  }

  const { data: candidate } = await admin
    .from("profiles")
    .select("id, full_name, visible_to_headhunters")
    .eq("id", cv.user_id)
    .single();

  if (!candidate?.visible_to_headhunters) {
    return NextResponse.json(
      { error: "Este candidato no está disponible" },
      { status: 403 }
    );
  }

  const { data: signed, error: signedError } = await admin.storage
    .from("cvs")
    .createSignedUrl(cv.storage_path, 60, { download: cv.file_name });

  if (signedError || !signed) {
    return NextResponse.json(
      { error: "No se pudo generar el link de descarga" },
      { status: 500 }
    );
  }

  const downloadedAt = new Date();

  await admin.from("headhunter_cv_downloads").insert({
    headhunter_id: user.id,
    candidate_user_id: cv.user_id,
    cv_id: cv.id,
    downloaded_at: downloadedAt.toISOString(),
  });

  // Notificar a todos los administradores.
  const { data: admins } = await admin
    .from("profiles")
    .select("email, full_name")
    .eq("role", "administrador");

  const fechaHora = downloadedAt.toLocaleString("es-CL", {
    dateStyle: "long",
    timeStyle: "short",
  });

  for (const a of admins ?? []) {
    if (!a.email) continue;
    await sendEmail({
      to: a.email,
      subject: "Un headhunter descargó un CV",
      html: baseEmailTemplate({
        preheader: "Descarga de CV registrada",
        heading: "Descarga de CV registrada",
        bodyHtml: `
          <p>Hola${a.full_name ? ` ${a.full_name}` : ""},</p>
          <p><strong>${headhunterProfile?.full_name ?? "Un headhunter"}</strong>
          (${headhunterProfile?.headhunter_company ?? "empresa no especificada"},
          ${headhunterProfile?.email ?? ""}) descargó el CV de
          <strong>${candidate?.full_name ?? "un candidato"}</strong>.</p>
          <p>Fecha y hora: <strong>${fechaHora}</strong></p>
        `,
        ctaLabel: "Ver headhunters",
        ctaUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://career-intel-app.vercel.app"}/dashboard/admin/headhunters`,
      }),
    });
  }

  return NextResponse.json({ ok: true, url: signed.signedUrl });
}
