import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GROQ_MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `Eres un consultor experto en Executive Search y matching de talento,
con más de 25 años de experiencia en reclutamiento y outplacement.

Tu tarea: comparar el perfil de un candidato (datos de perfil + texto de
su CV) contra una oferta laboral, y calcular qué tan compatible es.

Primero extraes de la oferta laboral: empresa, cargo, seniority,
industria, competencias requeridas, tecnologías, certificaciones,
responsabilidades y beneficios (si no aparece algo, indícalo como null,
no lo inventes).

Luego calculas estos puntajes (0-100 cada uno):
- matching_general: compatibilidad global
- matching_ats: qué tan bien pasaría el CV un filtro ATS para esta vacante específica (keywords de la oferta presentes en el CV). Si no se te entrega texto de CV, no hay base real para este cálculo: usa null.
- matching_tecnico: competencias/tecnologías/herramientas
- matching_liderazgo: experiencia de liderazgo/gestión de equipos si la vacante lo requiere (si no aplica, usa null)
- matching_cultural: una ESTIMACIÓN basada en señales indirectas (industria, tamaño de empresa, tipo de rol) — deja explícito en el análisis que es una estimación, no un hecho
- matching_experiencia: años y tipo de experiencia relevante

Nunca inventas experiencia, logros ni certificaciones que el candidato
no tenga según su perfil/CV. Si falta información para evaluar algo,
dilo explícitamente en vez de asumir.

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin
markdown, sin backticks) con exactamente esta forma:

{
  "empresa": string | null,
  "cargo": string | null,
  "matching_general": number,
  "matching_ats": number | null,
  "matching_tecnico": number,
  "matching_liderazgo": number | null,
  "matching_cultural": number,
  "matching_experiencia": number,
  "fortalezas": string[],
  "brechas": string[],
  "riesgos": string[],
  "acciones_prioritarias": string[]
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
  const { jobDescription, cvId } = body as {
    jobDescription?: string;
    cvId?: string;
  };

  if (!jobDescription || jobDescription.trim().length < 50) {
    return NextResponse.json(
      { error: "Pega el texto completo de la oferta laboral (mínimo 50 caracteres)" },
      { status: 400 }
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, profession, specialty, industry, years_experience, seniority, current_position, target_role, strengths, weaknesses, languages, certifications"
    )
    .eq("id", user.id)
    .single();

  let cvText: string | null = null;
  let resolvedCvId: string | null = null;

  if (cvId) {
    const { data: cv } = await supabase
      .from("cvs")
      .select("id, extracted_text, extraction_status")
      .eq("id", cvId)
      .single();
    if (cv?.extraction_status === "done") {
      cvText = cv.extracted_text;
      resolvedCvId = cv.id;
    }
  } else {
    const { data: latestCv } = await supabase
      .from("cvs")
      .select("id, extracted_text, extraction_status")
      .eq("user_id", user.id)
      .eq("extraction_status", "done")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestCv) {
      cvText = latestCv.extracted_text;
      resolvedCvId = latestCv.id;
    }
  }

  const profileLines = profile
    ? Object.entries(profile)
        .filter(([, v]) => v !== null && v !== "")
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n")
    : "";

  const userPrompt = `Perfil del candidato:
${profileLines || "(sin datos de perfil completados)"}

Texto del CV del candidato:
"""
${cvText ? cvText.slice(0, 8000) : "(el candidato no tiene un CV con texto extraído todavía)"}
"""

Oferta laboral a evaluar:
"""
${jobDescription.slice(0, 8000)}
"""

Analiza el matching siguiendo las instrucciones del sistema y responde
solo con el JSON pedido.`;

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

  let analysis: {
    empresa?: string | null;
    cargo?: string | null;
    matching_general?: number;
    matching_ats?: number | null;
    matching_tecnico?: number;
    matching_liderazgo?: number | null;
    matching_cultural?: number;
    matching_experiencia?: number;
  };

  try {
    analysis = JSON.parse(rawContent);
  } catch {
    return NextResponse.json(
      { error: "La respuesta de la IA no vino en JSON válido" },
      { status: 502 }
    );
  }

  const clamp = (n: unknown) =>
    typeof n === "number" ? Math.max(0, Math.min(100, Math.round(n))) : null;

  // Sin texto de CV no hay ninguna base real para evaluar coincidencia
  // de keywords ATS — forzamos null aunque el modelo haya devuelto un
  // número, para no mostrar un score engañoso.
  const atsScore = cvText ? clamp(analysis.matching_ats) : null;

  const { data: inserted, error: insertError } = await supabase
    .from("job_matches")
    .insert({
      user_id: user.id,
      cv_id: resolvedCvId,
      job_title: analysis.cargo ?? null,
      company: analysis.empresa ?? null,
      job_description: jobDescription,
      matching_general: clamp(analysis.matching_general),
      matching_ats: atsScore,
      matching_tecnico: clamp(analysis.matching_tecnico),
      matching_liderazgo: clamp(analysis.matching_liderazgo),
      matching_cultural: clamp(analysis.matching_cultural),
      matching_experiencia: clamp(analysis.matching_experiencia),
      analysis,
    })
    .select("id")
    .single();

  if (insertError) {
    return NextResponse.json(
      { error: `Error al guardar el resultado: ${insertError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({
    id: inserted.id,
    analysis: { ...analysis, matching_ats: atsScore },
  });
}
