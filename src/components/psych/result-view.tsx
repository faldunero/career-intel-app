import DimensionBar from "./dimension-bar";

export type PsychResult = {
  dimensiones: { key: string; label: string; score: number }[];
  correct?: number;
  total?: number;
  resumen: string;
  fortalezas: string[];
  consideraciones: string[];
  recomendaciones: string[];
  disclaimer: string;
};

function BulletList({ items }: { items: string[] }) {
  if (!items || items.length === 0) return null;
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

export default function PsychResultView({ result }: { result: PsychResult }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-4">
        {result.dimensiones.map((d) => (
          <DimensionBar key={d.key} label={d.label} score={d.score} />
        ))}
      </div>

      {typeof result.correct === "number" && typeof result.total === "number" && (
        <p className="text-xs text-slate-400">
          {result.correct} de {result.total} respuestas correctas.
        </p>
      )}

      <p className="text-sm text-slate-600">{result.resumen}</p>

      {result.fortalezas.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Fortalezas
          </h4>
          <div className="mt-2">
            <BulletList items={result.fortalezas} />
          </div>
        </div>
      )}

      {result.consideraciones.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            A tener en cuenta
          </h4>
          <div className="mt-2">
            <BulletList items={result.consideraciones} />
          </div>
        </div>
      )}

      {result.recomendaciones.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Recomendaciones
          </h4>
          <div className="mt-2">
            <BulletList items={result.recomendaciones} />
          </div>
        </div>
      )}

      <p className="border-t border-slate-100 pt-3 text-[11px] leading-relaxed text-slate-400">
        {result.disclaimer}
      </p>
    </div>
  );
}
