import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/admin-guard";
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

const STATUS_HEADING: Record<string, string> = {
  en_proceso: "Estamos trabajando en tu solicitud",
  resuelta: "Tu solicitud fue resuelta",
  rechazada: "Tu solicitud fue rechazada",
};

export async function POST(request: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const body = await request.json();
    const { requestId, status, resolutionNotes } = body as {
      requestId?: string;
      status?: string;
      resolutionNotes?: string | null;
    };

    if (!requestId || !status) {
      return NextResponse.json(
        { error: "Falta requestId o status" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    const { data: reqRow, error: reqError } = await admin
      .from("arco_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (reqError || !reqRow) {
      console.error("arco/resolve: no se encontró la solicitud", reqError);
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    const isClosing = status === "resuelta" || status === "rechazada";

    if (isClosing && !resolutionNotes?.trim()) {
      return NextResponse.json(
        {
          error:
            "Debes dejar un comentario con el motivo antes de marcar esta solicitud como resuelta o rechazada.",
        },
        { status: 400 }
      );
    }

    const { error } = await admin
      .from("arco_requests")
      .update({
        status,
        resolution_notes: resolutionNotes || null,
        resolved_at: isClosing ? new Date().toISOString() : null,
        resolved_by: isClosing ? check.adminId : null,
      })
      .eq("id", requestId);

    if (error) {
      console.error("arco/resolve: falló el update", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Solo notificamos por correo en cambios que le importan al
    // solicitante: que empezamos a trabajar en esto, o el resultado
    // final. Un simple "pendiente -> pendiente" no genera correo. Si
    // el correo falla, se registra pero no debe hacer fallar la
    // respuesta — el cambio de estado ya se guardó.
    if (status === "en_proceso" || isClosing) {
      try {
        const typeLabel = REQUEST_TYPE_LABELS[reqRow.request_type] ?? reqRow.request_type;
        const heading = STATUS_HEADING[status] ?? "Actualización de tu solicitud";

        await sendEmail({
          to: reqRow.requester_email,
          subject: `${heading} — Career Intelligence AI`,
          html: baseEmailTemplate({
            preheader: heading,
            heading,
            bodyHtml: `
              <p>Hola ${reqRow.requester_name},</p>
              <p>Tu solicitud de <strong>${typeLabel}</strong>, recibida el
              ${new Date(reqRow.received_at).toLocaleDateString("es-CL")},
              ${
                status === "en_proceso"
                  ? "está siendo procesada por nuestro equipo."
                  : status === "resuelta"
                    ? "fue resuelta."
                    : "fue rechazada."
              }</p>
              ${
                resolutionNotes
                  ? `<p style="padding: 12px; background: #f5f5f5; border-left: 3px solid #000;">${resolutionNotes}</p>`
                  : ""
              }
              <p>Si tienes preguntas sobre esta respuesta, puedes escribirnos
              respondiendo este correo.</p>
            `,
            ctaLabel: "Ir al sitio",
            ctaUrl: "https://career-intel-app.vercel.app",
          }),
        });
      } catch (emailErr) {
        console.error("arco/resolve: falló el envío del correo", emailErr);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("arco/resolve: error inesperado", err);
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
