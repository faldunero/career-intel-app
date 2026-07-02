import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GROQ_MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `Eres un consultor experto en LinkedIn Strategy y Employer Branding,
con más de 25 años de experiencia en executive search.

Se te entrega el texto extraído del perfil de LinkedIn de un candidato
(exportado en PDF) y el texto de su CV. Tu tarea, siguiendo el proceso
de análisis de LinkedIn:

1. Extrae del texto de LinkedIn: headline, about/extracto, experiencia,
   educación, skills, certificaciones, idiomas (lo que encuentres —
   no todo perfil tiene todas las secciones).
2. Compara automáticamente contra el CV. Detecta: diferencias entre
   ambos documentos, inconsistencias (ej. fechas o cargos distintos),
   información que está en el CV pero falta en LinkedIn, palabras
   clave relevantes ausentes en LinkedIn, logros omitidos, tecnologías
   mencionadas en el CV pero no en LinkedIn.
3. Calcula un LinkedIn Score (0-100) considerando: completitud del
   perfil, calidad del headline y el about, consistencia con el CV,
   presencia de keywords relevantes para el cargo objetivo.
4. Genera recomendaciones priorizadas para mejorar el posicionamiento
   del perfil.

Nunca inventes información que no esté en los textos entregados. Si
falta una sección completa (por ejemplo, no hay "about"), dilo
explícitamente como una brecha, no la rellenes.

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin
markdown, sin backticks) con exactamente esta forma:

{
  "linkedin_score": number (0-100),
  "resumen": string (2-3 frases),
  "diferencias_con_cv": string[],
  "informacion_faltante_en_linkedin": string[],
  "palabras_clave_faltantes": string[],
  "logros_omitidos": string[],
  "recomendaciones_priorizadas": string[]
}`;

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
  const { linkedinId } = body as { linkedinId?: string };

  if (!linkedinId) {
    return NextResponse.json({ error: "Falta linkedinId" }, { status: 400 });
  }

  const { data: li } = await supabase
    .from("linkedin_profiles")
    .select("id, extracted_text, extraction_status")
    .eq("id", linkedinId)
    .single();

  if (!li || li.extraction_status !== "done" || !li.extracted_text) {
    return NextResponse.json(
      { error: "Este archivo de LinkedIn todavía no tiene texto extraído" },
      { status: 422 }
    );
  }

  const { data: latestCv } = await supabase
    .from("cvs")
    .select("extracted_text")
    .eq("user_id", user.id)
    .eq("extraction_status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: profile } = await supabase
    .from("profiles")
    .select("target_role, industry")
    .eq("id", user.id)
    .single();

  const userPrompt = `${
    profile?.target_role
      ? `Cargo objetivo del candidato: ${profile.target_role}\n`
      : ""
  }${profile?.industry ? `Industria: ${profile.industry}\n` : ""}

Texto extraído del perfil de LinkedIn:
"""
${li.extracted_text.slice(0, 8000)}
"""

Texto del CV:
"""
${latestCv?.extracted_text ? latestCv.extracted_text.slice(0, 8000) : "(el candidato no tiene un CV con texto extraído todavía — evalúa solo LinkedIn en ese caso, y dilo en el resumen)"}
"""

Analiza siguiendo las instrucciones del sistema y responde solo con el
JSON pedido.`;

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

  let analysis: { linkedin_score?: number };
  try {
    analysis = JSON.parse(rawContent);
  } catch {
    return NextResponse.json(
      { error: "La respuesta de la IA no vino en JSON válido" },
      { status: 502 }
    );
  }

  const score =
    typeof analysis.linkedin_score === "number"
      ? Math.max(0, Math.min(100, Math.round(analysis.linkedin_score)))
      : null;

  await supabase
    .from("linkedin_profiles")
    .update({
      linkedin_score: score,
      linkedin_analysis: analysis,
      analyzed_at: new Date().toISOString(),
    })
    .eq("id", li.id);

  return NextResponse.json({ linkedin_score: score, analysis });
}
