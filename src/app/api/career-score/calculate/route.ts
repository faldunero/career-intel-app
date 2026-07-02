import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GROQ_MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `Eres un consultor experto en Executive Search y desarrollo de carrera,
con más de 25 años de experiencia.

Tu tarea: calcular un Career Score (0-100) para un profesional,
considerando estas dimensiones: experiencia, liderazgo, innovación,
proyectos y resultados, certificaciones, idiomas, networking, LinkedIn,
optimización ATS, y marca personal.

REGLA CRÍTICA: solo tienes datos de perfil y CV. NO tienes acceso a
LinkedIn ni a información de networking real de este candidato. Para
las dimensiones "networking" y "linkedin", usa null como subscore y
dilo explícitamente en la explicación — nunca inventes un número para
algo que no puedes evaluar con la información disponible.

Para el resto de las dimensiones, evalúa solo con base en lo que
efectivamente aparece en el perfil y el CV. Si algo no aparece, indica
esa dimensión con un subscore bajo justificado por la ausencia de
evidencia, no la inventes positiva.

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin
markdown, sin backticks) con exactamente esta forma:

{
  "career_score": number (0-100, promedio ponderado de las dimensiones evaluables),
  "explicacion": string (3-4 frases explicando el cálculo y qué dimensiones no se pudieron evaluar),
  "desglose": {
    "experiencia": number | null,
    "liderazgo": number | null,
    "innovacion": number | null,
    "proyectos_resultados": number | null,
    "certificaciones": number | null,
    "idiomas": number | null,
    "networking": null,
    "linkedin": null,
    "ats": number | null,
    "marca_personal": number | null
  },
  "fortalezas": string[],
  "oportunidades_mejora": string[]
}`;

export async function POST() {
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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return NextResponse.json(
      { error: "No se encontró tu perfil" },
      { status: 404 }
    );
  }

  const { data: latestCv } = await supabase
    .from("cvs")
    .select("extracted_text, ats_score")
    .eq("user_id", user.id)
    .eq("extraction_status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const profileLines = Object.entries(profile)
    .filter(
      ([k, v]) =>
        v !== null &&
        v !== "" &&
        !["id", "role", "created_at", "updated_at", "career_score", "career_score_analysis", "career_score_calculated_at", "profile_completed"].includes(k)
    )
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");

  const userPrompt = `Perfil del candidato:
${profileLines || "(perfil incompleto)"}

ATS Score de su CV más reciente (si existe): ${latestCv?.ats_score ?? "no calculado todavía"}

Texto del CV:
"""
${latestCv?.extracted_text ? latestCv.extracted_text.slice(0, 8000) : "(no hay CV con texto extraído)"}
"""

Calcula el Career Score siguiendo las instrucciones del sistema y
responde solo con el JSON pedido.`;

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
          temperature: 0.3,
          max_tokens: 4096,
          response_format: { type: "json_object" },
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
  const rawContent = groqData?.choices?.[0]?.message?.content;

  if (!rawContent) {
    return NextResponse.json(
      { error: "Groq no devolvió contenido" },
      { status: 502 }
    );
  }

  let analysis: { career_score?: number };
  try {
    analysis = JSON.parse(rawContent);
  } catch {
    return NextResponse.json(
      { error: "La respuesta de la IA no vino en JSON válido" },
      { status: 502 }
    );
  }

  const score =
    typeof analysis.career_score === "number"
      ? Math.max(0, Math.min(100, Math.round(analysis.career_score)))
      : null;

  await supabase
    .from("profiles")
    .update({
      career_score: score,
      career_score_analysis: analysis,
      career_score_calculated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  return NextResponse.json({ career_score: score, analysis });
}
