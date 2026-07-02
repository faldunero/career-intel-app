import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GROQ_MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `Eres un consultor experto en optimización ATS (Applicant Tracking System) y
executive search, con más de 25 años de experiencia en outplacement y
reclutamiento. Analizas CVs exactamente como lo haría un ATS moderno.

Evalúas: palabras clave, formato, estructura, uso de tablas/columnas
(negativo para ATS), logros, métricas, verbos de acción, competencias,
tecnologías mencionadas, y longitud del documento.

Nunca inventas experiencia, logros ni datos que no estén en el texto del CV.
Si el CV no menciona algo, lo señalas como ausente, no lo inventas.

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin
markdown, sin backticks) con exactamente esta forma:

{
  "ats_score": number (0-100),
  "score_explicado": string (2-3 frases explicando cómo se obtuvo el puntaje),
  "fortalezas": string[] (3-5 puntos),
  "palabras_clave_faltantes": string[] (keywords relevantes para el cargo objetivo que no aparecen en el CV),
  "que_eliminar": string[] (elementos que dañan el parseo ATS o son ruido),
  "que_agregar": string[] (secciones o elementos faltantes),
  "que_reescribir": string[] (frases débiles y cómo mejorarlas, en general, sin inventar datos),
  "que_cuantificar": string[] (logros mencionados que deberían tener una métrica y no la tienen)
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
  const { cvId } = body as { cvId?: string };

  if (!cvId) {
    return NextResponse.json({ error: "Falta cvId" }, { status: 400 });
  }

  const { data: cv, error: cvError } = await supabase
    .from("cvs")
    .select("id, extracted_text, extraction_status")
    .eq("id", cvId)
    .single();

  if (cvError || !cv) {
    return NextResponse.json({ error: "CV no encontrado" }, { status: 404 });
  }

  if (cv.extraction_status !== "done" || !cv.extracted_text) {
    return NextResponse.json(
      { error: "Este CV todavía no tiene texto extraído" },
      { status: 422 }
    );
  }

  // Contexto adicional del perfil (si existe) para afinar el análisis
  const { data: profile } = await supabase
    .from("profiles")
    .select("target_role, industry, seniority")
    .eq("id", user.id)
    .single();

  const contextLines = [
    profile?.target_role ? `Cargo objetivo: ${profile.target_role}` : null,
    profile?.industry ? `Industria: ${profile.industry}` : null,
    profile?.seniority ? `Seniority: ${profile.seniority}` : null,
  ].filter(Boolean);

  const userPrompt = `${
    contextLines.length
      ? `Contexto del candidato:\n${contextLines.join("\n")}\n\n`
      : ""
  }Texto del CV extraído (puede tener errores menores de formato por venir de un PDF/Word):

"""
${cv.extracted_text.slice(0, 12000)}
"""

Analiza este CV siguiendo las instrucciones del sistema y responde solo con el JSON pedido.`;

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

  let analysis: unknown;
  try {
    analysis = JSON.parse(rawContent);
  } catch {
    return NextResponse.json(
      { error: "La respuesta de la IA no vino en JSON válido" },
      { status: 502 }
    );
  }

  const parsed = analysis as { ats_score?: number };
  const score =
    typeof parsed.ats_score === "number"
      ? Math.max(0, Math.min(100, Math.round(parsed.ats_score)))
      : null;

  await supabase
    .from("cvs")
    .update({
      ats_score: score,
      ats_analysis: analysis,
      analyzed_at: new Date().toISOString(),
    })
    .eq("id", cv.id);

  return NextResponse.json({ ats_score: score, analysis });
}
