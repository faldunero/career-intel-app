// El texto viene de extraer un PDF exportado de LinkedIn ("Save to PDF"
// desde el propio perfil). No hay una estructura garantizada, pero
// LinkedIn siempre usa estos mismos encabezados de sección, cada uno
// en su propia línea. Con eso alcanza para un "best effort" razonable:
// no va a ser perfecto en el 100% de los casos (el PDF-a-texto a veces
// corta líneas de forma rara), pero mejora mucho sobre mostrar el
// texto crudo sin ningún formato.

const KNOWN_SECTIONS = [
  "Contact",
  "Top Skills",
  "Languages",
  "Certifications",
  "Honors-Awards",
  "Publications",
  "Summary",
  "Experience",
  "Education",
  "Volunteer Experience",
  "Courses",
  "Projects",
  "Patents",
  "Test Scores",
  "Organizations",
];

export type LinkedinSection = {
  title: string;
  items: string[];
};

export type ParsedLinkedinText = {
  intro: string[];
  sections: LinkedinSection[];
};

export function parseLinkedinText(raw: string): ParsedLinkedinText {
  const lines = raw
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // Paso 1: unir líneas que quedaron cortadas a mitad de un paréntesis
  // (típico artefacto del PDF-a-texto cuando la columna es angosta).
  const merged: string[] = [];
  for (const line of lines) {
    const prev = merged[merged.length - 1];
    if (prev !== undefined) {
      const opens = (prev.match(/\(/g) ?? []).length;
      const closes = (prev.match(/\)/g) ?? []).length;
      if (opens > closes) {
        merged[merged.length - 1] = `${prev} ${line}`;
        continue;
      }
    }
    merged.push(line);
  }

  const sectionSet = new Set(KNOWN_SECTIONS.map((s) => s.toLowerCase()));

  const intro: string[] = [];
  const sections: LinkedinSection[] = [];
  let current: LinkedinSection | null = null;

  for (const line of merged) {
    if (sectionSet.has(line.toLowerCase())) {
      current = { title: line, items: [] };
      sections.push(current);
      continue;
    }
    if (current) {
      current.items.push(line);
    } else {
      intro.push(line);
    }
  }

  return { intro, sections };
}

// Secciones cuyo contenido es lista de ítems cortos (se ven mejor como
// chips) versus secciones con texto más largo (párrafos, se ven mejor
// como lista con viñetas).
export const CHIP_SECTION_TITLES = new Set([
  "top skills",
  "languages",
  "certifications",
  "honors-awards",
]);
