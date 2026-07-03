import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GROQ_MODEL = "openai/gpt-oss-120b";

const SYSTEM_PROMPT = `Eres un consultor experto en Executive Search evaluando la
transcripción de una entrevista simulada, para dar feedback constructivo
al candidato.

Nunca inventas cosas que el candidato no dijo. Basas la evaluación
únicamente en lo que aparece en la transcripción.

Responde ÚNICAMENTE con un objeto JSON válido (sin texto adicional, sin
markdown, sin backticks) con exactamente esta forma:

{
  "puntaje": number (0-100, evaluación global de qué tan bien le fue en esta entrevista),
  "evaluacion_general": string (2-3 frases resumiendo el desempeño),
  "fortalezas": string[] (3-5 puntos, basados en respuestas concretas),
  "areas_de_mejora": string[] (3-5 puntos, específicos y accionables),
  "recomendacion": string (1-2 frases: qué debería practicar antes de una entrevista real)
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
  const { sessionId } = body as { sessionId?: string };

  if (!sessionId) {
    return NextResponse.json({ error: "Falta sessionId" }, { status: 400 });
  }

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("id, user_id, interview_type, target_role, messages")
    .eq("id", sessionId)
    .single();

  if (!session || session.user_id !== user.id) {
    return NextResponse.json(
      { error: "No se encontró la sesión" },
      { status: 404 }
    );
  }

  const messages = (session.messages ?? []) as {
    role: "user" | "assistant";
    content: string;
  }[];

  if (messages.filter((m) => m.role === "user").length < 2) {
    return NextResponse.json(
      { error: "Responde al menos 2 preguntas antes de finalizar" },
      { status: 400 }
    );
  }

  const transcript = messages
    .map((m) => `${m.role === "assistant" ? "Entrevistador" : "Candidato"}: ${m.content}`)
    .join("\n\n");

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
          max_tokens: 2048,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Tipo de entrevista: ${session.interview_type}\nCargo objetivo: ${session.target_role ?? "no especificado"}\n\nTranscripción:\n"""\n${transcript.slice(0, 10000)}\n"""`,
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

  let feedback: unknown;
  try {
    feedback = JSON.parse(rawContent);
  } catch {
    return NextResponse.json(
      { error: "La respuesta de la IA no vino en JSON válido" },
      { status: 502 }
    );
  }

  await supabase
    .from("interview_sessions")
    .update({
      feedback,
      status: "completada",
      completed_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  return NextResponse.json({ feedback });
}
