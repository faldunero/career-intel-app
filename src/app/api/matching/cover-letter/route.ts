import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GROQ_MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `Eres un consultor experto en Executive Search y redacción profesional.

Redacta una carta de presentación en español, profesional, concisa
(máximo 4 párrafos), personalizada para la vacante específica que se
te entrega, basada ÚNICAMENTE en la experiencia real que aparece en el
perfil y el CV del candidato.

Reglas estrictas:
- Nunca inventes experiencia, logros, cifras o certificaciones que no
  estén en el perfil o el CV.
- Si falta información para conectar algún requisito de la vacante con
  la experiencia del candidato, simplemente no lo menciones — no lo
  rellenes con generalidades vacías ni datos ficticios.
- Tono: profesional, directo, sin frases genéricas de relleno tipo
  "soy un apasionado profesional con gran capacidad de trabajo en
  equipo" sin sustento.
- No repitas el CV completo; selecciona lo más relevante para ESTA
  vacante específica.

Responde ÚNICAMENTE con el texto de la carta, sin encabezados como
"Estimados señores" genéricos si no hay nombre de reclutador (usa algo
neutro como "Estimado equipo de selección de [empresa]"), sin
comentarios adicionales, sin markdown.`;

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GROQ_API_KEY no está configurada en el servidor" },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { matchId } = body as { matchId?: string };

  if (!matchId) {
    return NextResponse.json({ error: "Falta matchId" }, { status: 400 });
  }

  const { data: match } = await supabase
    .from("job_matches")
    .select("id, job_title, company, job_description, cv_id")
    .eq("id", matchId)
    .single();

  if (!match) {
    return NextResponse.json(
      { error: "No se encontró ese análisis de matching" },
      { status: 404 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, profession, seniority, current_position, target_role")
    .eq("id", user.id)
    .single();

  let cvText: string | null = null;
  if (match.cv_id) {
    const { data: cv } = await supabase
      .from("cvs")
      .select("extracted_text")
      .eq("id", match.cv_id)
      .single();
    cvText = cv?.extracted_text ?? null;
  }

  const userPrompt = `Perfil del candidato:
Nombre: ${profile?.full_name ?? "(sin nombre en el perfil)"}
Profesión: ${profile?.profession ?? "no especificada"}
Seniority: ${profile?.seniority ?? "no especificado"}
Cargo actual: ${profile?.current_position ?? "no especificado"}

Texto del CV:
"""
${cvText ? cvText.slice(0, 6000) : "(no hay CV con texto extraído disponible)"}
"""

Vacante (${match.company ?? "empresa no identificada"} — ${match.job_title ?? "cargo no identificado"}):
"""
${match.job_description.slice(0, 6000)}
"""

Redacta la carta de presentación siguiendo las instrucciones del sistema.`;

  let groqResponse: Response;
  try {
    groqResponse = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: GROQ_MODEL,
          temperature: 0.5,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userPrompt },
          ],
        }),
      }
    );
  } catch {
    return NextResponse.json(
      { error: "No se pudo conectar con Groq" },
      { status: 502 }
    );
  }

  if (!groqResponse.ok) {
    const errText = await groqResponse.text();
    return NextResponse.json(
      { error: `Groq devolvió un error: ${errText.slice(0, 300)}` },
      { status: 502 }
    );
  }

  const groqData = await groqResponse.json();
  const coverLetter = groqData?.choices?.[0]?.message?.content?.trim();

  if (!coverLetter) {
    return NextResponse.json(
      { error: "Groq no devolvió contenido" },
      { status: 502 }
    );
  }

  await supabase
    .from("job_matches")
    .update({ cover_letter: coverLetter })
    .eq("id", match.id);

  return NextResponse.json({ coverLetter });
}
