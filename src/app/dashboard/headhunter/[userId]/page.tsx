import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHeadhunter } from "@/lib/require-headhunter";
import ViewCvButton from "./view-cv-button";
import CvPdfViewer from "@/components/cv/pdf-viewer";
import ScoreRing from "@/components/cv/score-ring";

const FIELDS: Array<{
  key: "industry" | "seniority" | "location" | "languages" | "certifications";
  label: string;
}> = [
  { key: "industry", label: "Rubro" },
  { key: "seniority", label: "Seniority" },
  { key: "location", label: "Ubicación" },
  { key: "languages", label: "Idiomas" },
  { key: "certifications", label: "Certificaciones" },
];

export default async function HeadhunterCandidatePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { supabase } = await requireHeadhunter();
  const { userId } = await params;

  // RLS ya restringe esto a perfiles con visible_to_headhunters = true
  // y con acceso vigente — si no hay fila, es que no corresponde verlo.
  const { data: candidate } = await supabase
    .from("profiles")
    .select(
      "id, full_name, current_position, target_role, industry, seniority, city, country, career_score, languages, certifications"
    )
    .eq("id", userId)
    .eq("visible_to_headhunters", true)
    .maybeSingle();

  if (!candidate) {
    notFound();
  }

  const { data: cv } = await supabase
    .from("cvs")
    .select("id, file_name, storage_path, ats_score")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const fieldValues: Record<(typeof FIELDS)[number]["key"], string> = {
    industry: candidate.industry ?? "—",
    seniority: candidate.seniority ?? "—",
    location:
      [candidate.city, candidate.country].filter(Boolean).join(", ") || "—",
    languages: candidate.languages ?? "—",
    certifications: candidate.certifications ?? "—",
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/headhunter"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Volver a la búsqueda
      </Link>

      <div className="mt-3 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {candidate.full_name ?? "Candidato"}
          </h1>
          <p className="text-sm text-slate-500">
            {candidate.current_position ?? candidate.target_role ?? "—"}
          </p>
        </div>
        {candidate.career_score !== null && (
          <ScoreRing score={candidate.career_score} label="Career Score" />
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm sm:grid-cols-3">
          {FIELDS.map(({ key, label }) => (
            <div key={key}>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                {label}
              </p>
              <p className="mt-0.5 text-slate-900">{fieldValues[key]}</p>
            </div>
          ))}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          {cv ? (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {cv.file_name}
                </p>
                {cv.ats_score !== null && (
                  <ScoreRing score={cv.ats_score} label="ATS Score" size="sm" />
                )}
              </div>
              <div className="mt-3">
                <CvPdfViewer
                  storagePath={cv.storage_path}
                  fileName={cv.file_name}
                />
              </div>
              <div className="mt-4">
                <ViewCvButton cvId={cv.id} />
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-400">
              Este candidato no tiene un CV disponible todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
