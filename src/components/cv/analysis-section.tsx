// Renderiza una sección del análisis ATS (fortalezas, qué eliminar,
// qué agregar, etc). Antes esta lógica estaba duplicada casi al
// carácter entre la vista de usuario y la de coach.

export function KeywordChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function TextList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => (
        <li key={i} className="flex gap-2 text-sm leading-relaxed text-slate-700">
          <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
          {item}
        </li>
      ))}
    </ul>
  );
}

const CHIP_SECTIONS = new Set(["palabras_clave_faltantes"]);

export default function AnalysisSection({
  title,
  section,
  items,
  commentCount,
  children,
}: {
  title: string;
  section: string;
  items?: string[];
  commentCount?: number;
  children?: React.ReactNode;
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="py-5 first:pt-0">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          {title}
        </h4>
        {!!commentCount && (
          <span className="text-[11px] font-medium text-slate-400">
            {commentCount} comentario{commentCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
      <div className="mt-3">
        {CHIP_SECTIONS.has(section) ? (
          <KeywordChips items={items} />
        ) : (
          <TextList items={items} />
        )}
      </div>
      {children}
    </div>
  );
}
