// Batería psicolaboral propia de Career Intelligence AI.
//
// IMPORTANTE: estas 3 herramientas son contenido original, escrito
// para esta plataforma. No son réplicas de instrumentos comerciales
// con derechos de autor (16PF, DISC/Cleaver, Raven, D-48, Wartegg,
// Lüscher, etc.) — se inspiran en el mismo tipo de constructo que
// esos instrumentos miden (estilo de comportamiento, rasgos de
// personalidad laboral, razonamiento lógico), con ítems, opciones y
// baremos propios. No reemplazan una evaluación psicológica
// profesional ni constituyen un diagnóstico clínico.

export type ToolKey = "estilo_laboral" | "rasgos_profesionales" | "razonamiento_logico";

export type LikertQuestion = {
  id: string;
  text: string;
  dimension: string;
};

export type ChoiceQuestion = {
  id: string;
  text: string;
  options: string[];
  // El índice correcto NUNCA se pasa a un componente cliente — solo se
  // usa server-side (API route) para calificar. Ver psych-tools.ts vs.
  // los props que arma cada page.tsx server component.
  correctIndex: number;
};

export type ToolMeta = {
  key: ToolKey;
  title: string;
  subtitle: string;
  description: string;
  kind: "likert" | "choice";
  estimatedMinutes: number;
};

export const TOOLS: Record<ToolKey, ToolMeta> = {
  estilo_laboral: {
    key: "estilo_laboral",
    title: "Perfil de Estilo Laboral",
    subtitle: "Cómo te comportas frente a retos, personas, ritmo y reglas",
    description:
      "20 afirmaciones sobre tu forma habitual de actuar en el trabajo, agrupadas en 4 estilos de comportamiento: orientación a resultados, influencia social, estabilidad y apego a normas.",
    kind: "likert",
    estimatedMinutes: 6,
  },
  rasgos_profesionales: {
    key: "rasgos_profesionales",
    title: "Mapa de Rasgos Profesionales",
    subtitle: "8 dimensiones de personalidad aplicadas al trabajo",
    description:
      "24 afirmaciones que perfilan rasgos como sociabilidad, estabilidad emocional, apertura al cambio, orientación a resultados, autonomía, meticulosidad, tolerancia a la presión y colaboración.",
    kind: "likert",
    estimatedMinutes: 8,
  },
  razonamiento_logico: {
    key: "razonamiento_logico",
    title: "Razonamiento Lógico",
    subtitle: "Secuencias, analogías y patrones",
    description:
      "10 problemas de opción múltiple para estimar capacidad de abstracción y razonamiento lógico — secuencias numéricas, analogías y patrones.",
    kind: "choice",
    estimatedMinutes: 10,
  },
};

export const TOOL_ORDER: ToolKey[] = [
  "estilo_laboral",
  "rasgos_profesionales",
  "razonamiento_logico",
];

// ---------------------------------------------------------------
// Perfil de Estilo Laboral — 4 dimensiones x 5 ítems, escala 1-5
// ---------------------------------------------------------------
export const DIMENSIONES_ESTILO: Record<string, string> = {
  dominancia: "Orientación a resultados",
  influencia: "Influencia social",
  estabilidad: "Estabilidad",
  cumplimiento: "Apego a normas",
};

export const ESTILO_LABORAL_QUESTIONS: LikertQuestion[] = [
  { id: "d1", dimension: "dominancia", text: "Me gusta tomar decisiones rápido, incluso con información incompleta." },
  { id: "d2", dimension: "dominancia", text: "Prefiero liderar una iniciativa antes que seguir instrucciones de otros." },
  { id: "d3", dimension: "dominancia", text: "No me incomoda confrontar un desacuerdo directamente." },
  { id: "d4", dimension: "dominancia", text: "Me motivan los desafíos con metas ambiciosas." },
  { id: "d5", dimension: "dominancia", text: "Suelo enfocarme en resultados más que en el proceso para llegar a ellos." },
  { id: "i1", dimension: "influencia", text: "Disfruto conocer gente nueva y generar redes de contacto." },
  { id: "i2", dimension: "influencia", text: "Me resulta fácil entusiasmar a otros con una idea." },
  { id: "i3", dimension: "influencia", text: "Prefiero trabajar en equipo antes que en solitario." },
  { id: "i4", dimension: "influencia", text: "Suelo ser quien anima el ambiente en una reunión." },
  { id: "i5", dimension: "influencia", text: "Me energiza hablar en público o presentar frente a otros." },
  { id: "s1", dimension: "estabilidad", text: "Prefiero la estabilidad y rutinas claras antes que cambios constantes." },
  { id: "s2", dimension: "estabilidad", text: "Soy paciente cuando un proceso toma más tiempo del esperado." },
  { id: "s3", dimension: "estabilidad", text: "Priorizo la armonía del equipo por sobre imponer mi punto de vista." },
  { id: "s4", dimension: "estabilidad", text: "Prefiero planificar con calma antes que improvisar sobre la marcha." },
  { id: "s5", dimension: "estabilidad", text: "Prefiero terminar una tarea antes de empezar otra." },
  { id: "c1", dimension: "cumplimiento", text: "Reviso los detalles cuidadosamente antes de dar algo por terminado." },
  { id: "c2", dimension: "cumplimiento", text: "Prefiero seguir procedimientos establecidos antes que improvisar." },
  { id: "c3", dimension: "cumplimiento", text: "Me apoyo en datos y análisis antes de tomar una decisión." },
  { id: "c4", dimension: "cumplimiento", text: "Me incomoda entregar un trabajo con errores, aunque sean menores." },
  { id: "c5", dimension: "cumplimiento", text: "Sigo las reglas y políticas aunque no esté de acuerdo con todas." },
];

// ---------------------------------------------------------------
// Mapa de Rasgos Profesionales — 8 dimensiones x 3 ítems, escala 1-5
// ---------------------------------------------------------------
export const DIMENSIONES_RASGOS: Record<string, string> = {
  sociabilidad: "Sociabilidad",
  estabilidad_emocional: "Estabilidad emocional",
  apertura_cambio: "Apertura al cambio",
  orientacion_resultados: "Orientación a resultados",
  autonomia: "Autonomía",
  meticulosidad: "Meticulosidad",
  tolerancia_presion: "Tolerancia a la presión",
  colaboracion: "Colaboración",
};

export const RASGOS_PROFESIONALES_QUESTIONS: LikertQuestion[] = [
  { id: "soc1", dimension: "sociabilidad", text: "Me resulta energizante estar rodeado de personas la mayor parte del día." },
  { id: "soc2", dimension: "sociabilidad", text: "Inicio conversaciones con facilidad, incluso con desconocidos." },
  { id: "soc3", dimension: "sociabilidad", text: "Prefiero espacios de trabajo colaborativos antes que aislados." },
  { id: "est1", dimension: "estabilidad_emocional", text: "Mantengo la calma cuando surge un imprevisto importante." },
  { id: "est2", dimension: "estabilidad_emocional", text: "No me cuesta recuperarme después de una crítica dura." },
  { id: "est3", dimension: "estabilidad_emocional", text: "Rara vez mis emociones interfieren en mis decisiones laborales." },
  { id: "ape1", dimension: "apertura_cambio", text: "Disfruto aprender herramientas o metodologías nuevas." },
  { id: "ape2", dimension: "apertura_cambio", text: "Me adapto con facilidad cuando cambian las prioridades de un proyecto." },
  { id: "ape3", dimension: "apertura_cambio", text: "Prefiero explorar enfoques distintos antes que repetir lo conocido." },
  { id: "ori1", dimension: "orientacion_resultados", text: "Me fijo metas concretas y las persigo activamente." },
  { id: "ori2", dimension: "orientacion_resultados", text: "Evalúo mi desempeño principalmente por los resultados obtenidos." },
  { id: "ori3", dimension: "orientacion_resultados", text: "Me cuesta conformarme con un trabajo \"aceptable\" cuando puede ser mejor." },
  { id: "aut1", dimension: "autonomia", text: "Prefiero definir yo mismo cómo abordar una tarea." },
  { id: "aut2", dimension: "autonomia", text: "Trabajo bien sin supervisión constante." },
  { id: "aut3", dimension: "autonomia", text: "Tomo la iniciativa sin esperar que me lo pidan." },
  { id: "met1", dimension: "meticulosidad", text: "Superviso mi propio trabajo antes de darlo por terminado." },
  { id: "met2", dimension: "meticulosidad", text: "Detecto inconsistencias o errores que otros pasan por alto." },
  { id: "met3", dimension: "meticulosidad", text: "Organizo mi trabajo con anticipación en vez de improvisar." },
  { id: "tol1", dimension: "tolerancia_presion", text: "Rindo igual o mejor bajo plazos ajustados." },
  { id: "tol2", dimension: "tolerancia_presion", text: "No pierdo el enfoque cuando tengo múltiples tareas urgentes a la vez." },
  { id: "tol3", dimension: "tolerancia_presion", text: "Manejo bien la presión de resultados visibles para otros." },
  { id: "col1", dimension: "colaboracion", text: "Priorizo el éxito del equipo por sobre el reconocimiento individual." },
  { id: "col2", dimension: "colaboracion", text: "Comparto información y conocimiento abiertamente con mis colegas." },
  { id: "col3", dimension: "colaboracion", text: "Busco activamente el consenso antes de avanzar con una decisión." },
];

// ---------------------------------------------------------------
// Razonamiento Lógico — 10 preguntas de opción múltiple (A-D)
// ---------------------------------------------------------------
export const RAZONAMIENTO_LOGICO_QUESTIONS: ChoiceQuestion[] = [
  { id: "r1", text: "¿Qué número continúa la secuencia? 2, 4, 8, 16, ___", options: ["20", "24", "32", "30"], correctIndex: 2 },
  { id: "r2", text: "¿Qué letra sigue? A, C, E, G, ___", options: ["H", "I", "J", "K"], correctIndex: 1 },
  { id: "r3", text: "Llave es a Cerradura como Contraseña es a ___", options: ["Computador", "Acceso", "Usuario", "Internet"], correctIndex: 1 },
  { id: "r4", text: "¿Qué número continúa la secuencia? 1, 1, 2, 3, 5, 8, ___", options: ["11", "13", "12", "10"], correctIndex: 1 },
  { id: "r5", text: "¿Cuál de estos elementos no pertenece al grupo?", options: ["Círculo", "Cuadrado", "Triángulo", "Rojo"], correctIndex: 3 },
  { id: "r6", text: "¿Qué número continúa la secuencia? 3, 6, 12, 24, ___", options: ["36", "48", "30", "42"], correctIndex: 1 },
  { id: "r7", text: "Si todos los Zorbos son Vintos, y algunos Vintos son Kalos, ¿se puede concluir que algunos Zorbos son Kalos?", options: ["Sí, siempre", "No, no necesariamente", "Solo si todos los Vintos son Kalos", "Falta información"], correctIndex: 1 },
  { id: "r8", text: "5 es a 25 como 7 es a ___", options: ["14", "35", "49", "42"], correctIndex: 2 },
  { id: "r9", text: "¿Qué letra continúa la secuencia? Z, X, V, T, ___", options: ["S", "R", "Q", "P"], correctIndex: 1 },
  { id: "r10", text: "Un pentágono tiene 5 lados y un hexágono tiene 6. ¿Cuántos lados tiene un octágono?", options: ["7", "8", "9", "10"], correctIndex: 1 },
];

// Versión "segura para cliente" de las preguntas de razonamiento
// (sin correctIndex) — lo que realmente se le pasa al formulario.
export type PublicChoiceQuestion = { id: string; text: string; options: string[] };

export function publicChoiceQuestions(): PublicChoiceQuestion[] {
  return RAZONAMIENTO_LOGICO_QUESTIONS.map(({ id, text, options }) => ({ id, text, options }));
}

export const DISCLAIMER =
  "Esta es una autoevaluación de desarrollo profesional creada por Career Intelligence AI, no un instrumento psicométrico certificado ni un diagnóstico clínico. Su valor está en abrir una conversación con tu coach, no en etiquetarte.";
