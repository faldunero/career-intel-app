import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GROQ_MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `Extraes datos estructurados de perfil profesional a partir del texto de
un CV. Nunca inventas datos que no estén explícitos o claramente
inferibles del texto. Si un campo no aparece en el CV, usa null — no
lo adivines ni lo rellenes con un valor genérico.

Nota: "cargo objetivo" (target_role) NO lo extraigas del CV — un CV
describe experiencia pasada, no aspiraciones futuras. Siempre devuélvelo
como null; el usuario lo define él mismo.

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin
markdown, sin backticks) con exactamente esta forma:

{
  "country": string | null,
  "city": string | null,
  "profession": string | null,
  "specialty": string | null,
  "industry": string | null,
  "years_experience": number | null,
  "seniority": string | null,
  "current_position": string | null,
  "target_role": null,
  "languages": string | null,
  "certifications": string | null,
  "strengths": string | null
}

Para "seniority" usa exactamente uno de estos valores si aplica:
Analista, Especialista, Supervisor, Coordinador, Jefe, Subgerente,
Gerente, Director, VP, C-Level, Directorio. Si no puedes determinarlo
con confianza, usa null.

Para "languages" y "certifications", si el CV los menciona, resume en
una sola línea separada por comas (ej: "Español (nativo), Inglés
(avanzado)"). Si no aparecen, usa null.`;

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

  const { data: latestCv } = await supabase
    .from("cvs")
    .select("extracted_text")
    .eq("user_id", user.id)
    .eq("extraction_status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestCv?.extracted_text) {
    return NextResponse.json(
      {
        error:
          "No tienes un CV con texto leído todavía. Sube uno en 'Tu CV' primero.",
      },
      { status: 422 }
    );
  }

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
          temperature: 0.1,
          max_tokens: 1500,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Texto del CV:\n"""\n${latestCv.extracted_text.slice(0, 8000)}\n"""`,
            },
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

  try {
    const fields = JSON.parse(rawContent);
    return NextResponse.json({ fields });
  } catch {
    return NextResponse.json(
      { error: "La respuesta de la IA no vino en JSON válido" },
      { status: 502 }
    );
  }
}
