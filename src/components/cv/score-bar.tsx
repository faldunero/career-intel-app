// Barra de puntaje semántica (a diferencia de la neutra de
// psicolaboral: acá un puntaje más alto SÍ es objetivamente mejor,
// igual que ATS/LinkedIn Score, así que corresponde el semáforo).
// Mismos umbrales que ScoreRing: 75 / 50.
function bucketColor(score: number) {
  return score >= 75 ? "bg-green-500" : score >= 50 ? "bg-amber-500" : "bg-red-500";
}

export default function ScoreBar({
  label,
  score,
}: {
  label: string;
  score: number | null;
}) {
  if (score === null) {
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-400">N/A</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{score}</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full ${bucketColor(score)}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
