import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const GROQ_MODEL = "openai/gpt-oss-120b";

const PERSONAS: Record<string, string> = {
  recruiter: `Eres un Recruiter (reclutador) haciendo una entrevista de screening
inicial. Tu foco: trayectoria general, motivaciones del cambio,
expectativas salariales y disponibilidad. Preguntas amables pero
directas, tono profesional cercano.`,
  rrhh: `Eres de Recursos Humanos evaluando fit cultural y competencias
blandas. Tu foco: trabajo en equipo, manejo de conflictos, valores,
adaptabilidad. Preguntas de tipo conductual ("cuéntame de una vez
que...").`,
  hiring_manager: `Eres el Hiring Manager: la persona que gestionará directamente a este
candidato si es contratado. Tu foco: competencias técnicas concretas
del día a día, forma de resolver problemas reales del cargo, cómo
prioriza y gestiona su tiempo.`,
  director: `Eres un Director de área evaluando a un candidato para un cargo de
responsabilidad. Tu foco: visión estratégica, capacidad de influir sin
autoridad formal, manejo de stakeholders, resultados medibles
logrados.`,
  ceo: `Eres el CEO de la empresa, en una entrevista final. Tu foco:
alineamiento con la visión de largo plazo de la compañía, madurez de
liderazgo, cómo piensa el candidato sobre el negocio más allá de su
función específica.`,
  panel_tecnico: `Eres parte de un panel técnico evaluando profundidad de conocimiento
específico del área del candidato. Haces preguntas técnicas concretas,
pides ejemplos reales, profundizas en el "cómo" y el "por qué" de las
decisiones técnicas que menciona.`,
};

function buildSystemPrompt(interviewType: string, targetRole: string | null) {
  const persona = PERSONAS[interviewType] ?? PERSONAS.recruiter;
  return `${persona}

${targetRole ? `El cargo al que postula el candidato es: ${targetRole}.` : ""}

Reglas de la simulación:
- Actúas como un entrevistador humano real, en primera persona. Nunca
  digas que eres una IA ni rompas el personaje.
- Haz UNA pregunta a la vez. Espera la respuesta antes de seguir.
- Da un reconocimiento breve y natural a la respuesta anterior antes de
  la siguiente pregunta (como haría un entrevistador real), sin ser
  excesivo.
- No inventes información sobre la empresa ni le des feedback de
  desempeño durante la entrevista misma — eso viene después, al
  finalizar.
- Después de 6-8 preguntas, puedes empezar a cerrar la entrevista de
  forma natural (ej. preguntar si el candidato tiene preguntas para ti).
- Responde siempre en español, tono profesional.`;
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
  const { sessionId, message } = body as {
    sessionId?: string;
    message?: string;
  };

  if (!sessionId || !message?.trim()) {
    return NextResponse.json(
      { error: "Falta sessionId o el mensaje" },
      { status: 400 }
    );
  }

  const { data: session } = await supabase
    .from("interview_sessions")
    .select("id, user_id, interview_type, target_role, status, messages")
    .eq("id", sessionId)
    .single();

  if (!session || session.user_id !== user.id) {
    return NextResponse.json(
      { error: "No se encontró la sesión" },
      { status: 404 }
    );
  }

  if (session.status === "completada") {
    return NextResponse.json(
      { error: "Esta entrevista ya fue finalizada" },
      { status: 400 }
    );
  }

  const existingMessages = (session.messages ?? []) as {
    role: "user" | "assistant";
    content: string;
  }[];

  const newUserMessage = { role: "user" as const, content: message.trim() };
  const systemPrompt = buildSystemPrompt(
    session.interview_type,
    session.target_role
  );

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
          temperature: 0.6,
          max_tokens: 500,
          messages: [
            { role: "system", content: systemPrompt },
            ...existingMessages,
            newUserMessage,
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
  const reply = groqData?.choices?.[0]?.message?.content;

  if (!reply) {
    return NextResponse.json(
      { error: "Groq no devolvió contenido" },
      { status: 502 }
    );
  }

  const updatedMessages = [
    ...existingMessages,
    newUserMessage,
    { role: "assistant" as const, content: reply },
  ];

  await supabase
    .from("interview_sessions")
    .update({
      messages: updatedMessages,
      status: "en_progreso",
    })
    .eq("id", sessionId);

  return NextResponse.json({ reply, messages: updatedMessages });
}
