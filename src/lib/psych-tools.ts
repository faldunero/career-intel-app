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

export type ToolKey = "estilo_laboral" | "rasgos_profesionales" | "razonamiento_logico" | "manejo_estres" | "inteligencia_emocional" | "liderazgo" | "creatividad_innovacion" | "orientacion_cliente";

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
  manejo_estres: {
    key: "manejo_estres",
    title: "Manejo del Estrés",
    subtitle: "Cómo gestionas presión, cambio y adversidad",
    description:
      "20 afirmaciones sobre tu capacidad para manejar situaciones de presión, adaptarte a cambios, mantener enfoque bajo estrés y recuperarte de dificultades — 5 dimensiones clave.",
    kind: "likert",
    estimatedMinutes: 7,
  },
  inteligencia_emocional: {
    key: "inteligencia_emocional",
    title: "Inteligencia Emocional",
    subtitle: "Autoconocimiento, empatía y relaciones",
    description:
      "24 afirmaciones para evaluar tu capacidad de reconocer emociones propias, regular respuestas emocionales, entender a otros y construir relaciones efectivas en el trabajo.",
    kind: "likert",
    estimatedMinutes: 8,
  },
  liderazgo: {
    key: "liderazgo",
    title: "Competencias de Liderazgo",
    subtitle: "Visión, inspiración, delegación y desarrollo",
    description:
      "25 afirmaciones sobre tu capacidad de articular visión, comunicar estrategia, delegar responsabilidades, inspirar equipos y desarrollar talento — para roles actuales o futuros de liderazgo.",
    kind: "likert",
    estimatedMinutes: 8,
  },
  creatividad_innovacion: {
    key: "creatividad_innovacion",
    title: "Creatividad e Innovación",
    subtitle: "Pensamiento lateral, generación de ideas y experimentación",
    description:
      "20 afirmaciones sobre tu capacidad de generar ideas novedosas, pensar lateralmente, cuestionar lo establecido, experimentar con nuevos enfoques y llevar ideas a la práctica — esencial para roles de innovación.",
    kind: "likert",
    estimatedMinutes: 6,
  },
  orientacion_cliente: {
    key: "orientacion_cliente",
    title: "Orientación al Cliente",
    subtitle: "Empatía, servicio y resolución de problemas",
    description:
      "20 afirmaciones sobre tu enfoque en entender necesidades del cliente, proporcionar soluciones personalizadas, manejar situaciones difíciles con profesionalismo y construir relaciones duraderas — crítico para cualquier rol orientado al mercado.",
    kind: "likert",
    estimatedMinutes: 6,
  },
};

export const TOOL_ORDER: ToolKey[] = [
  "estilo_laboral",
  "rasgos_profesionales",
  "razonamiento_logico",
  "manejo_estres",
  "inteligencia_emocional",
  "liderazgo",
  "creatividad_innovacion",
  "orientacion_cliente",
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
// Manejo del Estrés — 5 dimensiones x 4 ítems, escala 1-5
// ---------------------------------------------------------------
export const DIMENSIONES_ESTRES: Record<string, string> = {
  tolerancia_presion: "Tolerancia a la presión",
  adaptabilidad: "Adaptabilidad al cambio",
  estabilidad_emocional: "Estabilidad emocional",
  recuperacion: "Recuperación y resiliencia",
  enfoque_tareas: "Enfoque en tareas bajo estrés",
};

export const MANEJO_ESTRES_QUESTIONS: LikertQuestion[] = [
  { id: "esp1", dimension: "tolerancia_presion", text: "Mantengo la calidad de mi trabajo incluso cuando hay mucha presión de tiempo." },
  { id: "esp2", dimension: "tolerancia_presion", text: "Prefiero situaciones con desafíos altos antes que trabajo rutinario." },
  { id: "esp3", dimension: "tolerancia_presion", text: "Me enfoco mejor cuando hay deadlines claros y urgentes." },
  { id: "esp4", dimension: "tolerancia_presion", text: "No pierdo motivación ante fracasos o retrocesos temporales." },
  { id: "ada1", dimension: "adaptabilidad", text: "Me adapto rápidamente cuando cambian las prioridades de un proyecto." },
  { id: "ada2", dimension: "adaptabilidad", text: "Prefiero la estabilidad y me cuesta ajustarme a cambios inesperados." },
  { id: "ada3", dimension: "adaptabilidad", text: "Veo los cambios como oportunidades más que como amenazas." },
  { id: "ada4", dimension: "adaptabilidad", text: "Puedo repensar mi estrategia rápidamente si la situación lo requiere." },
  { id: "eme1", dimension: "estabilidad_emocional", text: "Mis emociones no interfieren en mi capacidad de trabajar bajo estrés." },
  { id: "eme2", dimension: "estabilidad_emocional", text: "Rara vez me siento abrumado por situaciones difíciles en el trabajo." },
  { id: "eme3", dimension: "estabilidad_emocional", text: "Mantengo una actitud positiva incluso en momentos de crisis." },
  { id: "eme4", dimension: "estabilidad_emocional", text: "No suelo reaccionar impulsivamente cuando algo me molesta." },
  { id: "rec1", dimension: "recuperacion", text: "Me recupero rápidamente de un fracaso o crítica dura." },
  { id: "rec2", dimension: "recuperacion", text: "Busco aprender de situaciones difíciles en lugar de quedarme atrapado." },
  { id: "rec3", dimension: "recuperacion", text: "Tengo amigos o colegas de confianza a quienes recurro cuando estoy estresado." },
  { id: "rec4", dimension: "recuperacion", text: "Cuido bien mis hábitos (sueño, ejercicio) para mantener mi bienestar." },
  { id: "enf1", dimension: "enfoque_tareas", text: "Soy capaz de ignorar distracciones y mantener el enfoque en lo importante." },
  { id: "enf2", dimension: "enfoque_tareas", text: "Cuando hay múltiples crisis, puedo priorizar y atacarlas ordenadamente." },
  { id: "enf3", dimension: "enfoque_tareas", text: "Organizo mi trabajo de forma que evito acumular estrés innecesario." },
  { id: "enf4", dimension: "enfoque_tareas", text: "Pido ayuda o delego cuando siento que me desborda la carga de trabajo." },
];

// ---------------------------------------------------------------
// Inteligencia Emocional — 6 dimensiones x 4 ítems, escala 1-5
// ---------------------------------------------------------------
export const DIMENSIONES_IE: Record<string, string> = {
  autoconocimiento: "Autoconocimiento emocional",
  autorregulacion: "Autorregulación",
  motivacion: "Motivación interna",
  empatia: "Empatía",
  relaciones: "Relaciones interpersonales",
  manejo_conflicto: "Manejo de conflictos",
};

export const INTELIGENCIA_EMOCIONAL_QUESTIONS: LikertQuestion[] = [
  { id: "auc1", dimension: "autoconocimiento", text: "Reconozco fácilmente mis emociones y lo que las causa." },
  { id: "auc2", dimension: "autoconocimiento", text: "Entiendo cómo mis emociones afectan mi comportamiento y desempeño." },
  { id: "auc3", dimension: "autoconocimiento", text: "Puedo identificar mis fortalezas y debilidades de forma realista." },
  { id: "auc4", dimension: "autoconocimiento", text: "Busco feedback activamente para mejorar y crecer." },
  { id: "aur1", dimension: "autorregulacion", text: "Controlo mis impulsos incluso cuando me molesta algo." },
  { id: "aur2", dimension: "autorregulacion", text: "No dejo que mi mal humor afecte cómo trato a los demás." },
  { id: "aur3", dimension: "autorregulacion", text: "Puedo calmarme rápidamente cuando me altero emocionalmente." },
  { id: "aur4", dimension: "autorregulacion", text: "Resuelvo conflictos sin necesidad de reaccionar emocionalmente." },
  { id: "mot1", dimension: "motivacion", text: "Tengo una visión clara de lo que quiero lograr en mi carrera." },
  { id: "mot2", dimension: "motivacion", text: "Me motivan los desafíos y el crecimiento más que recompensas externas." },
  { id: "mot3", dimension: "motivacion", text: "Persevero ante dificultades porque creo en el valor de lo que hago." },
  { id: "mot4", dimension: "motivacion", text: "Inspiro a otros con mi entusiasmo y compromiso." },
  { id: "emp1", dimension: "empatia", text: "Entiendo los sentimientos y perspectivas de las otras personas." },
  { id: "emp2", dimension: "empatia", text: "Me importa genuinamente el bienestar de mis colegas y compañeros." },
  { id: "emp3", dimension: "empatia", text: "Puedo ponerme en el lugar de alguien con una experiencia diferente a la mía." },
  { id: "emp4", dimension: "empatia", text: "Detecto cuando alguien está incómodo o molesto, aunque no lo diga." },
  { id: "rel1", dimension: "relaciones", text: "Construyo relaciones de confianza con mis colegas fácilmente." },
  { id: "rel2", dimension: "relaciones", text: "Comunico mis ideas de forma que otros se sienten escuchados y respetados." },
  { id: "rel3", dimension: "relaciones", text: "Colaboro efectivamente incluso con personas con las que tengo diferencias." },
  { id: "rel4", dimension: "relaciones", text: "Soy alguien en quien otros confían para hablar de temas importantes." },
  { id: "con1", dimension: "manejo_conflicto", text: "Abordo los conflictos de forma directa pero respetuosa." },
  { id: "con2", dimension: "manejo_conflicto", text: "Busco soluciones que beneficien a ambas partes en un desacuerdo." },
  { id: "con3", dimension: "manejo_conflicto", text: "No evito conflictos, pero tampoco los escalo innecesariamente." },
  { id: "con4", dimension: "manejo_conflicto", text: "Puedo mediar entre personas en conflicto sin tomar partido." },
];

// ---------------------------------------------------------------
// Competencias de Liderazgo — 5 dimensiones x 5 ítems, escala 1-5
// ---------------------------------------------------------------
export const DIMENSIONES_LIDERAZGO: Record<string, string> = {
  vision_estrategia: "Visión y estrategia",
  comunicacion: "Comunicación inspiradora",
  delegacion: "Delegación y empoderamiento",
  desarrollo_talento: "Desarrollo de talento",
  toma_decisiones: "Toma de decisiones",
};

export const LIDERAZGO_QUESTIONS: LikertQuestion[] = [
  { id: "vis1", dimension: "vision_estrategia", text: "Puedo articular una visión clara y motivadora del futuro." },
  { id: "vis2", dimension: "vision_estrategia", text: "Comunico estrategia de forma que otros la entienden y comparten." },
  { id: "vis3", dimension: "vision_estrategia", text: "Alineal mis decisiones con los objetivos estratégicos de largo plazo." },
  { id: "vis4", dimension: "vision_estrategia", text: "Anticipo cambios del mercado e influyo en la dirección de mi organización." },
  { id: "vis5", dimension: "vision_estrategia", text: "Inspiro a otros a pensar más allá de los límites actuales." },
  { id: "com1", dimension: "comunicacion", text: "Comunico de forma clara, honesta y consistente con mi equipo." },
  { id: "com2", dimension: "comunicacion", text: "Escucho activamente y considero perspectivas diferentes antes de decidir." },
  { id: "com3", dimension: "comunicacion", text: "Presento ideas de forma convincente y adaptada a mi audiencia." },
  { id: "com4", dimension: "comunicacion", text: "Mi comunicación inspira confianza y compromiso en otros." },
  { id: "com5", dimension: "comunicacion", text: "Doy feedback constructivo de forma que motiva mejora, no defensiva." },
  { id: "del1", dimension: "delegacion", text: "Delego responsabilidades de acuerdo a las fortalezas de cada persona." },
  { id: "del2", dimension: "delegacion", text: "Empodero a otros a tomar decisiones sin necesidad de mi aprobación." },
  { id: "del3", dimension: "delegacion", text: "Doy el apoyo necesario sin micromanagear el trabajo de otros." },
  { id: "del4", dimension: "delegacion", text: "Reconozco públicamente el buen trabajo y las contribuciones de mi equipo." },
  { id: "del5", dimension: "delegacion", text: "Creo un ambiente donde otros se sienten seguros para tomar riesgos calculados." },
  { id: "dev1", dimension: "desarrollo_talento", text: "Invierto tiempo en el desarrollo profesional de mi gente." },
  { id: "dev2", dimension: "desarrollo_talento", text: "Identifico y cultivo el potencial de líderes futuros en mi equipo." },
  { id: "dev3", dimension: "desarrollo_talento", text: "Ofrezco oportunidades de aprendizaje y crecimiento." },
  { id: "dev4", dimension: "desarrollo_talento", text: "Soy un modelo a seguir en términos de mejora continua." },
  { id: "dev5", dimension: "desarrollo_talento", text: "Tengo conversaciones profundas sobre carrera y aspiraciones con mi gente." },
  { id: "dec1", dimension: "toma_decisiones", text: "Tomo decisiones con claridad, incluso con información incompleta." },
  { id: "dec2", dimension: "toma_decisiones", text: "Considero múltiples perspectivas antes de decidir, pero no me paralizo." },
  { id: "dec3", dimension: "toma_decisiones", text: "Asumo responsabilidad por mis decisiones y aprendo de los errores." },
  { id: "dec4", dimension: "toma_decisiones", text: "Consulto expertos y datos relevantes sin perder tiempo en análisis infinito." },
  { id: "dec5", dimension: "toma_decisiones", text: "Comunico las razones detrás de decisiones difíciles de forma que otros entienden." },
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

// ---------------------------------------------------------------
// Creatividad e Innovación — 4 dimensiones x 5 ítems, escala 1-5
// ---------------------------------------------------------------
export const DIMENSIONES_CREATIVIDAD: Record<string, string> = {
  generacion_ideas: "Generación de ideas",
  pensamiento_lateral: "Pensamiento lateral",
  experimentacion: "Experimentación",
  implementacion: "Implementación de innovaciones",
};

export const CREATIVIDAD_INNOVACION_QUESTIONS: LikertQuestion[] = [
  { id: "gen1", dimension: "generacion_ideas", text: "Frecuentemente tengo ideas nuevas y originales sobre cómo hacer las cosas." },
  { id: "gen2", dimension: "generacion_ideas", text: "Disfruto de espacios donde se brainstorming y lluvia de ideas sin crítica temprana." },
  { id: "gen3", dimension: "generacion_ideas", text: "Combino conceptos de diferentes campos para crear soluciones novedosas." },
  { id: "gen4", dimension: "generacion_ideas", text: "Las personas recurren a mí cuando necesitan pensar fuera de la caja." },
  { id: "gen5", dimension: "generacion_ideas", text: "Siento energía cuando trabajo en problemas complejos sin solución clara." },
  { id: "lat1", dimension: "pensamiento_lateral", text: "Cuestiono supuestos que otros dan por sentado." },
  { id: "lat2", dimension: "pensamiento_lateral", text: "Veo conexiones entre cosas que otros no ven relacionadas." },
  { id: "lat3", dimension: "pensamiento_lateral", text: "Prefiero explorar múltiples soluciones antes que elegir la obvia." },
  { id: "lat4", dimension: "pensamiento_lateral", text: "Me aburre repetir procesos sin mejora o cambio." },
  { id: "lat5", dimension: "pensamiento_lateral", text: "Puedo invertir un problema para encontrar nuevas perspectivas." },
  { id: "exp1", dimension: "experimentacion", text: "Estoy dispuesto a probar enfoques nuevos aunque el riesgo de fallar sea alto." },
  { id: "exp2", dimension: "experimentacion", text: "Veo los fracasos como oportunidades de aprendizaje, no como finales." },
  { id: "exp3", dimension: "experimentacion", text: "Propongo pilotos o prototipos para validar ideas antes de escalarlas." },
  { id: "exp4", dimension: "experimentacion", text: "No me intimida la incertidumbre de un proyecto experimental." },
  { id: "exp5", dimension: "experimentacion", text: "Busco retroalimentación rápida para iterar en mis ideas." },
  { id: "imp1", dimension: "implementacion", text: "Puedo llevar una idea desde concepto hasta realización." },
  { id: "imp2", dimension: "implementacion", text: "Identifico los recursos y pasos necesarios para implementar innovaciones." },
  { id: "imp3", dimension: "implementacion", text: "Convenzo a otros de la viabilidad de ideas nuevas." },
  { id: "imp4", dimension: "implementacion", text: "Persevero en la implementación incluso cuando enfrento resistencia." },
  { id: "imp5", dimension: "implementacion", text: "Documento y comunico los resultados de nuevas iniciativas." },
];

// ---------------------------------------------------------------
// Orientación al Cliente — 4 dimensiones x 5 ítems, escala 1-5
// ---------------------------------------------------------------
export const DIMENSIONES_CLIENTE: Record<string, string> = {
  empatia_cliente: "Empatía con el cliente",
  escucha_activa: "Escucha activa y comprensión",
  solucion_problemas: "Solución de problemas",
  relaciones_durables: "Construcción de relaciones duraderas",
};

export const ORIENTACION_CLIENTE_QUESTIONS: LikertQuestion[] = [
  { id: "emp_c1", dimension: "empatia_cliente", text: "Me importa genuinamente resolver los problemas del cliente." },
  { id: "emp_c2", dimension: "empatia_cliente", text: "Reconozco y valido las emociones y frustraciones del cliente." },
  { id: "emp_c3", dimension: "empatia_cliente", text: "Puedo ponerme en la posición del cliente para entender su perspectiva." },
  { id: "emp_c4", dimension: "empatia_cliente", text: "Veo más allá de la queja inmediata para entender la necesidad subyacente." },
  { id: "emp_c5", dimension: "empatia_cliente", text: "Mis acciones demuestran que el cliente es realmente una prioridad." },
  { id: "esc1", dimension: "escucha_activa", text: "Escucho sin interrumpir ni pensar en mi respuesta mientras el cliente habla." },
  { id: "esc2", dimension: "escucha_activa", text: "Hago preguntas clarificadoras para asegurar que realmente entiendo." },
  { id: "esc3", dimension: "escucha_activa", text: "Remembo detalles importantes que el cliente menciona en conversaciones anteriores." },
  { id: "esc4", dimension: "escucha_activa", text: "Permito que el cliente termine sus pensamientos completamente." },
  { id: "esc5", dimension: "escucha_activa", text: "Comunico lo que escuché para confirmar comprensión." },
  { id: "sol1", dimension: "solucion_problemas", text: "Busco soluciones que se adapten a las necesidades específicas del cliente." },
  { id: "sol2", dimension: "solucion_problemas", text: "Presento opciones alternativas cuando la solución obvia no es la mejor." },
  { id: "sol3", dimension: "solucion_problemas", text: "Mantengo la calma y profesionalismo incluso con clientes difíciles." },
  { id: "sol4", dimension: "solucion_problemas", text: "Tomo acción rápida para resolver problemas de cliente." },
  { id: "sol5", dimension: "solucion_problemas", text: "Informo proactivamente al cliente sobre el progreso de resolución." },
  { id: "rel1", dimension: "relaciones_durables", text: "Busco construir relaciones de confianza a largo plazo, no transacciones puntuales." },
  { id: "rel2", dimension: "relaciones_durables", text: "Sugiero mejoras o productos adicionales que genuinamente benefician al cliente." },
  { id: "rel3", dimension: "relaciones_durables", text: "Mantengo contacto regular con clientes para entender su evolución." },
  { id: "rel4", dimension: "relaciones_durables", text: "Reconozco y valoro la lealtad y el negocio continuado del cliente." },
  { id: "rel5", dimension: "relaciones_durables", text: "Busco retroalimentación del cliente para mejorar permanentemente mi servicio." },
];

export const DISCLAIMER =
  "Esta es una autoevaluación de desarrollo profesional creada por Career Intelligence AI, no un instrumento psicométrico certificado ni un diagnóstico clínico. Su valor está en abrir una conversación con tu coach, no en etiquetarte.";
