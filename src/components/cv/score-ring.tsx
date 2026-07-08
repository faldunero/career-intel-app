// Visual consistente para cualquier puntaje 0-100 dentro del módulo de
// CV (ATS Score hoy; pensado para reusarse con Career/LinkedIn Score).
// Mantiene los mismos umbrales semánticos (75 / 50) que ya se usan en
// el resto del dashboard, solo que presentados como un "dial" en vez
// de un pill de color.

const BUCKETS = [
  {
    min: 75,
    label: "Sólido",
    ring: "border-green-500",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  {
    min: 50,
    label: "Mejorable",
    ring: "border-amber-500",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  {
    min: 0,
    label: "Requiere atención",
    ring: "border-red-500",
    text: "text-red-700",
    dot: "bg-red-500",
  },
];

function bucketFor(score: number) {
  return BUCKETS.find((b) => score >= b.min) ?? BUCKETS[BUCKETS.length - 1];
}

export default function ScoreRing({
  score,
  label,
  size = "md",
}: {
  score: number;
  label: string;
  size?: "sm" | "md";
}) {
  const bucket = bucketFor(score);
  const dimension = size === "sm" ? "h-11 w-11" : "h-14 w-14";
  const fontSize = size === "sm" ? "text-sm" : "text-lg";

  return (
    <div className="inline-flex items-center gap-3">
      <div
        className={`flex ${dimension} shrink-0 items-center justify-center rounded-full border-[3px] bg-white ${bucket.ring}`}
      >
        <span className={`${fontSize} font-semibold text-slate-900`}>
          {score}
        </span>
      </div>
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className={`flex items-center gap-1.5 text-xs ${bucket.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${bucket.dot}`} />
          {bucket.label}
        </p>
      </div>
    </div>
  );
}
