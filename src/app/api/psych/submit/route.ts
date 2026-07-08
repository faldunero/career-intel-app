import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  DISCLAIMER,
  ESTILO_LABORAL_QUESTIONS,
  RASGOS_PROFESIONALES_QUESTIONS,
  RAZONAMIENTO_LOGICO_QUESTIONS,
  TOOLS,
  type ToolKey,
} from "@/lib/psych-tools";
import {
  isComplete,
  scoreEstiloLaboral,
  scoreRasgosProfesionales,
  scoreRazonamientoLogico,
  type DimensionScore,
} from "@/lib/psych-scoring";

export const runtime = "nodejs";

const GROQ_MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `Eres un consultor experto en desarrollo profesional y coaching de
carrera. Se te entregan los puntajes YA CALCULADOS (0-100) de una
autoevaluación psicolaboral que completó un candidato en transición
laboral. Tu única tarea es redactar una interpretación clara y
constructiva de esos puntajes — nunca calculas, corriges ni inventas
un número: los puntajes que recibes son un hecho, tú solo los explicas.

Reglas estrictas:
- Nunca uses lenguaje clínico ni de diagnóstico ("trastorno",
  "patología", "anormal"). Esto es una autoevaluación de desarrollo
  profesional, no una evaluación psicológica clínica.
- Sé específico: conecta cada puntaje con implicancias prácticas para
  el mundo laboral, no generalidades vacías.
- Un puntaje bajo en una dimensión no es "malo" — descríbelo como una
  tendencia natural con implicancias a considerar, nunca como un
  déficit.
- Responde siempre en español, tono profesional y cercano.

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin
markdown, sin backticks) con exactamente esta forma:

{
  "resumen": string (2-3 frases, panorama general),
  "fortalezas": string[] (3-4 puntos, basados en los puntajes más altos),
  "consideraciones": string[] (2-3 puntos, tendencias a tener en cuenta, en tono constructivo — no "debilidades"),
  "recomendaciones": string[] (2-3 acciones concretas de desarrollo profesional)
}`;

function buildUserPrompt(toolKey: ToolKey, dimensiones: DimensionScore[]) {
  const toolTitle = TOOLS[toolKey].title;
  const lines = dimensiones
    .map((d) => `- ${d.label}: ${d.score}/100`)
    .join("\n");
  return `Herramienta: ${toolTitle}\n\nPuntajes por dimensión:\n${lines}\n\nRedacta la interpretación siguiendo las instrucciones del sistema.`;
}

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
  const { assignmentId, answers } = body as {
    assignmentId?: string;
    answers?: Record<string, number>;
  };

  if (!assignmentId || !answers) {
    return NextResponse.json(
      { error: "Falta assignmentId o answers" },
      { status: 400 }
    );
  }

  const { data: assignment, error: assignmentError } = await supabase
    .from("psych_assignments")
    .select("id, user_id, tool_key, status")
    .eq("id", assignmentId)
    .single();

  if (assignmentError || !assignment) {
    return NextResponse.json(
      { error: "No se encontró la asignación" },
      { status: 404 }
    );
  }

  if (assignment.user_id !== user.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (assignment.status === "completado") {
    return NextResponse.json(
      { error: "Esta herramienta ya fue respondida" },
      { status: 400 }
    );
  }

  const toolKey = assignment.tool_key as ToolKey;

  let dimensiones: DimensionScore[];
  let extra: { correct?: number; total?: number } = {};

  if (toolKey === "estilo_laboral") {
    if (!isComplete(ESTILO_LABORAL_QUESTIONS, answers)) {
      return NextResponse.json(
        { error: "Responde todas las afirmaciones antes de enviar" },
        { status: 400 }
      );
    }
    dimensiones = scoreEstiloLaboral(answers);
  } else if (toolKey === "rasgos_profesionales") {
    if (!isComplete(RASGOS_PROFESIONALES_QUESTIONS, answers)) {
      return NextResponse.json(
        { error: "Responde todas las afirmaciones antes de enviar" },
        { status: 400 }
      );
    }
    dimensiones = scoreRasgosProfesionales(answers);
  } else if (toolKey === "razonamiento_logico") {
    if (!isComplete(RAZONAMIENTO_LOGICO_QUESTIONS, answers)) {
      return NextResponse.json(
        { error: "Responde todas las preguntas antes de enviar" },
        { status: 400 }
      );
    }
    const { correct, total, score } = scoreRazonamientoLogico(answers);
    dimensiones = [{ key: "razonamiento_logico", label: "Razonamiento lógico", score }];
    extra = { correct, total };
  } else {
    return NextResponse.json(
      { error: "Herramienta desconocida" },
      { status: 400 }
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
          temperature: 0.4,
          max_tokens: 1200,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: buildUserPrompt(toolKey, dimensiones) },
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

  let narrative: {
    resumen?: string;
    fortalezas?: string[];
    consideraciones?: string[];
    recomendaciones?: string[];
  };
  try {
    narrative = JSON.parse(rawContent);
  } catch {
    return NextResponse.json(
      { error: "La respuesta de la IA no vino en JSON válido" },
      { status: 502 }
    );
  }

  const result = {
    dimensiones,
    ...extra,
    resumen: narrative.resumen ?? "",
    fortalezas: narrative.fortalezas ?? [],
    consideraciones: narrative.consideraciones ?? [],
    recomendaciones: narrative.recomendaciones ?? [],
    disclaimer: DISCLAIMER,
  };

  const { error: updateError } = await supabase
    .from("psych_assignments")
    .update({
      answers,
      result,
      status: "completado",
      completed_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);

  if (updateError) {
    return NextResponse.json(
      { error: `No se pudo guardar el resultado: ${updateError.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ result });
}
