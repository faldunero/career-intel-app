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

// Ejecuta la eliminación real de una cuenta a partir de una solicitud
// ARCO+ de tipo cancelación. El motivo (resolutionNotes) es
// obligatorio y se valida ACÁ, en el servidor, antes de tocar la
// cuenta — no basta con deshabilitar un botón en el cliente, porque
// alguien podría llamar a este endpoint directo. Sin motivo, no hay
// eliminación, punto.
//
// Todo el cuerpo va envuelto en try/catch: si algo revienta acá, el
// cliente antes recibía un 500 sin cuerpo (`{}`) — imposible de
// diagnosticar. Ahora cualquier excepción queda registrada en los
// logs de Vercel con el detalle real, y el cliente recibe un mensaje
// legible en vez de un objeto vacío.
export async function POST(request: Request) {
  try {
    const check = await requireAdmin();
    if (!check.ok) {
      return NextResponse.json({ error: check.error }, { status: check.status });
    }

    const body = await request.json();
    const { requestId, resolutionNotes } = body as {
      requestId?: string;
      resolutionNotes?: string;
    };

    if (!requestId) {
      return NextResponse.json({ error: "Falta requestId" }, { status: 400 });
    }

    if (!resolutionNotes?.trim()) {
      return NextResponse.json(
        {
          error:
            "Debes dejar un comentario con el motivo antes de poder eliminar esta cuenta.",
        },
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
      console.error("execute-deletion: no se encontró la solicitud", reqError);
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    if (reqRow.request_type !== "cancelacion" || !reqRow.target_user_id) {
      return NextResponse.json(
        { error: "Esta solicitud no corresponde a una eliminación de cuenta" },
        { status: 400 }
      );
    }

    if (reqRow.status === "resuelta" || reqRow.status === "rechazada") {
      return NextResponse.json(
        { error: "Esta solicitud ya fue cerrada" },
        { status: 400 }
      );
    }

    const targetId = reqRow.target_user_id as string;

    const { data: target, error: targetError } = await admin
      .from("profiles")
      .select("id, is_super_admin")
      .eq("id", targetId)
      .single();

    if (targetError || !target) {
      console.error("execute-deletion: no se encontró la cuenta destino", targetError);
      return NextResponse.json(
        { error: "La cuenta a eliminar no existe" },
        { status: 404 }
      );
    }
    if (target.is_super_admin) {
      return NextResponse.json(
        { error: "Es el administrador principal, no se puede eliminar" },
        { status: 403 }
      );
    }
    if (targetId === check.adminId) {
      return NextResponse.json(
        { error: "No puedes eliminar tu propia cuenta desde aquí" },
        { status: 403 }
      );
    }

    // Intenta eliminar el usuario con reintentos automáticos
    // Los errores transitorios de Supabase (500, network timeouts) pueden resolverse
    // con reintentos. El error "AuthRetryableFetchError" indica que el error es retryable.
    let deleteError = null;
    let lastError = null;
    const maxRetries = 3;
    const baseDelay = 1000; // 1 segundo

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const { error } = await admin.auth.admin.deleteUser(targetId);

      if (!error) {
        deleteError = null;
        break;
      }

      lastError = error;

      // Si es el último intento o el error no es retryable, detente
      if (attempt === maxRetries - 1) {
        deleteError = error;
        break;
      }

      // Espera con backoff exponencial antes de reintentar
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(
        `execute-deletion: reintentando deleteUser (intento ${attempt + 1}/${maxRetries}) en ${delay}ms`,
        error
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    if (deleteError) {
      console.error("execute-deletion: falló deleteUser después de reintentos", {
        error: deleteError,
        attempts: maxRetries,
        lastError,
      });
      return NextResponse.json(
        {
          error: `No se pudo eliminar la cuenta: ${deleteError.message || "Error del servidor"}`,
        },
        { status: 500 }
      );
    }

    // La cuenta ya se eliminó — de acá en adelante, cualquier falla
    // (guardar la nota, mandar el correo) se registra pero no debe
    // hacer parecer que la eliminación no funcionó.
    const autoNote = `Cuenta eliminada por el administrador el ${new Date().toLocaleDateString("es-CL")}.`;
    const finalNotes = `${resolutionNotes.trim()}\n\n${autoNote}`;

    const { error: updateError } = await admin
      .from("arco_requests")
      .update({
        status: "resuelta",
        resolution_notes: finalNotes,
        resolved_at: new Date().toISOString(),
        resolved_by: check.adminId,
      })
      .eq("id", requestId);

    if (updateError) {
      console.error(
        "execute-deletion: la cuenta se eliminó pero no se pudo actualizar la solicitud",
        updateError
      );
    }

    try {
      const typeLabel = REQUEST_TYPE_LABELS[reqRow.request_type] ?? reqRow.request_type;
      await sendEmail({
        to: reqRow.requester_email,
        subject: "Tu solicitud fue resuelta — Career Intelligence AI",
        html: baseEmailTemplate({
          preheader: "Tu solicitud fue resuelta",
          heading: "Tu solicitud fue resuelta",
          bodyHtml: `
            <p>Hola ${reqRow.requester_name},</p>
            <p>Tu solicitud de <strong>${typeLabel}</strong>, recibida el
            ${new Date(reqRow.received_at).toLocaleDateString("es-CL")}, fue
            resuelta.</p>
            <p style="padding: 12px; background: #f5f5f5; border-left: 3px solid #000;">${resolutionNotes.trim()}</p>
            <p>Si tienes preguntas sobre esta respuesta, puedes escribirnos
            respondiendo este correo.</p>
          `,
          ctaLabel: "Ir al sitio",
          ctaUrl: "https://career-intel-app.vercel.app",
        }),
      });
    } catch (emailErr) {
      console.error("execute-deletion: falló el envío del correo", emailErr);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("execute-deletion: error inesperado", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Error inesperado del servidor al eliminar la cuenta",
      },
      { status: 500 }
    );
  }
}
