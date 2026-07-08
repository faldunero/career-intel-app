import {
  DIMENSIONES_ESTILO,
  DIMENSIONES_RASGOS,
  ESTILO_LABORAL_QUESTIONS,
  RASGOS_PROFESIONALES_QUESTIONS,
  RAZONAMIENTO_LOGICO_QUESTIONS,
  type LikertQuestion,
} from "@/lib/psych-tools";

export type DimensionScore = { key: string; label: string; score: number };

// Los puntajes se calculan en código, de forma determinística — la IA
// nunca inventa un número, solo redacta la interpretación de puntajes
// ya calculados. Escala 1-5 por ítem -> 0-100 por dimensión.
function scoreLikert(
  questions: LikertQuestion[],
  labels: Record<string, string>,
  answers: Record<string, number>
): DimensionScore[] {
  const sums: Record<string, { total: number; count: number }> = {};

  for (const q of questions) {
    const value = answers[q.id];
    if (typeof value !== "number" || value < 1 || value > 5) continue;
    if (!sums[q.dimension]) sums[q.dimension] = { total: 0, count: 0 };
    sums[q.dimension].total += value;
    sums[q.dimension].count += 1;
  }

  return Object.entries(labels).map(([key, label]) => {
    const bucket = sums[key];
    const avg = bucket && bucket.count > 0 ? bucket.total / bucket.count : 0;
    const score = Math.round(((avg - 1) / 4) * 100);
    return { key, label, score: Math.max(0, Math.min(100, score)) };
  });
}

export function scoreEstiloLaboral(answers: Record<string, number>): DimensionScore[] {
  return scoreLikert(ESTILO_LABORAL_QUESTIONS, DIMENSIONES_ESTILO, answers);
}

export function scoreRasgosProfesionales(answers: Record<string, number>): DimensionScore[] {
  return scoreLikert(RASGOS_PROFESIONALES_QUESTIONS, DIMENSIONES_RASGOS, answers);
}

export function scoreRazonamientoLogico(answers: Record<string, number>): {
  correct: number;
  total: number;
  score: number;
} {
  let correct = 0;
  for (const q of RAZONAMIENTO_LOGICO_QUESTIONS) {
    if (answers[q.id] === q.correctIndex) correct += 1;
  }
  const total = RAZONAMIENTO_LOGICO_QUESTIONS.length;
  return { correct, total, score: Math.round((correct / total) * 100) };
}

// Valida que las respuestas cubran todas las preguntas de la
// herramienta antes de calificar (evita puntajes con datos a medio
// completar).
export function isComplete(questions: { id: string }[], answers: Record<string, unknown>): boolean {
  return questions.every((q) => answers[q.id] !== undefined && answers[q.id] !== null);
}
