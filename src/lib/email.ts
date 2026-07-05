// Helper mínimo para mandar correos transaccionales vía Resend.
// Usa fetch directo a su API REST (no requiere instalar el SDK de
// Resend como dependencia nueva).
//
// Variables de entorno requeridas:
// - RESEND_API_KEY: la API key generada en resend.com
// - RESEND_FROM_EMAIL: remitente verificado, ej. "Career Intelligence AI <notificaciones@ludolab.cl>"

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    console.error(
      "sendEmail: faltan RESEND_API_KEY o RESEND_FROM_EMAIL en las variables de entorno"
    );
    return { error: "Email no configurado" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, html }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("sendEmail: Resend respondió con error:", errText);
      return { error: errText };
    }

    return { error: null };
  } catch (err) {
    console.error("sendEmail: fallo de red hacia Resend:", err);
    return { error: String(err) };
  }
}

// Plantilla base: layout simple, negro/blanco, consistente con la
// estética "Executive Transition" del resto de la app.
export function baseEmailTemplate({
  preheader,
  heading,
  bodyHtml,
  ctaLabel,
  ctaUrl,
}: {
  preheader: string;
  heading: string;
  bodyHtml: string;
  ctaLabel: string;
  ctaUrl: string;
}) {
  return `
  <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f5f5f5; padding: 32px 16px;">
    <span style="display: none; max-height: 0; overflow: hidden;">${preheader}</span>
    <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border: 1px solid #000000;">
      <div style="padding: 24px 32px 8px 32px;">
        <p style="margin: 0; font-size: 12px; letter-spacing: 0.05em; color: #555555; text-transform: uppercase;">
          Career Intelligence AI
        </p>
      </div>
      <div style="padding: 8px 32px 24px 32px;">
        <h1 style="margin: 0 0 16px 0; font-size: 20px; color: #000000;">${heading}</h1>
        <div style="font-size: 14px; line-height: 1.6; color: #333333;">
          ${bodyHtml}
        </div>
        <a href="${ctaUrl}" style="display: inline-block; margin-top: 24px; padding: 12px 20px; background: #000000; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none;">
          ${ctaLabel}
        </a>
      </div>
      <div style="padding: 16px 32px; border-top: 1px solid #eeeeee;">
        <p style="margin: 0; font-size: 11px; color: #999999;">
          Recibiste este correo porque tienes una cuenta activa en Career Intelligence AI.
        </p>
      </div>
    </div>
  </div>
  `;
}
