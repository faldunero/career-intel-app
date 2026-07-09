import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, baseEmailTemplate } from "@/lib/email";

export const runtime = "nodejs";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  acceso: "Acceso",
  rectificacion: "Rectificación",
  cancelacion: "Cancelación (eliminación de cuenta)",
  oposicion: "Oposición",
  portabilidad: "Portabilidad",
  bloqueo: "Bloqueo",
};

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 });
    }

    const { data: myProfile } = await supabase
      .from("profiles")
      .select("role, full_name")
      .eq("id", user.id)
      .single();

    const isAdmin = myProfile?.role === "administrador";
    const body = await request.json();

    // Un no-admin solo puede crear una solicitud de cancelación sobre sí
    // mismo — mismo límite que ya impone la política de RLS, repetido
    // acá para dar un mensaje de error claro en vez de que falle la
    // base de datos en silencio.
    const requestType = isAdmin ? (body.requestType as string) : "cancelacion";
    const targetUserId = isAdmin ? (body.targetUserId as string | null) : user.id;
    const requesterName = isAdmin
      ? (body.requesterName as string)
      : (myProfile?.full_name ?? user.email ?? "—");
    const requesterEmail = isAdmin ? (body.requesterEmail as string) : user.email;
    const description = (body.description as string | null) ?? null;

    if (!requestType || !requesterName || !requesterEmail) {
      return NextResponse.json(
        { error: "Faltan datos obligatorios de la solicitud" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: created, error } = await admin
      .from("arco_requests")
      .insert({
        request_type: requestType,
        requester_name: requesterName,
        requester_email: requesterEmail,
        target_user_id: targetUserId || null,
        description,
        created_by: user.id,
      })
      .select("id, due_at")
      .single();

    if (error || !created) {
      console.error("arco/create: falló el insert", error);
      return NextResponse.json(
        { error: error?.message ?? "No se pudo registrar la solicitud" },
        { status: 500 }
      );
    }

    try {
      const typeLabel = REQUEST_TYPE_LABELS[requestType] ?? requestType;
      const dueDate = new Date(created.due_at).toLocaleDateString("es-CL", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      await sendEmail({
        to: requesterEmail,
        subject: `Recibimos tu solicitud de ${typeLabel} — Career Intelligence AI`,
        html: baseEmailTemplate({
          preheader: "Confirmamos la recepción de tu solicitud",
          heading: "Solicitud recibida",
          bodyHtml: `
            <p>Hola ${requesterName},</p>
            <p>Recibimos tu solicitud de <strong>${typeLabel}</strong> sobre
            tus datos personales, de acuerdo a la Ley 21.719 de Protección
            de Datos Personales.</p>
            <p>Tenemos hasta el <strong>${dueDate}</strong> (30 días) para
            responderte. Te vamos a escribir a este mismo correo apenas la
            resolvamos — no necesitas hacer nada más por ahora.</p>
          `,
          ctaLabel: "Ir al sitio",
          ctaUrl: "https://career-intel-app.vercel.app",
        }),
      });
    } catch (emailErr) {
      console.error("arco/create: falló el envío del correo de confirmación", emailErr);
    }

    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    console.error("arco/create: error inesperado", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Error inesperado del servidor",
      },
      { status: 500 }
    );
  }
}
