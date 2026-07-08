// A diferencia de ScoreRing (que usa verde/ámbar/rojo porque un ATS
// Score bajo SÍ es objetivamente peor), los rasgos de personalidad no
// tienen un sentido "bueno/malo" — una Dominancia baja no es peor que
// una alta, es solo distinta. Por eso esta barra es neutra: mismo
// color siempre, solo cambia el largo.
export default function DimensionBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">{score}/100</p>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-slate-700"
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );
}
