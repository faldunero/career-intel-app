import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHeadhunter } from "@/lib/require-headhunter";
import ViewCvButton from "./view-cv-button";

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
    .select("file_name, storage_path, ats_score")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/headhunter"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        Volver a la búsqueda
      </Link>

      <h1 className="mt-3 text-2xl font-semibold text-slate-900">
        {candidate.full_name ?? "Candidato"}
      </h1>
      <p className="text-sm text-slate-500">
        {candidate.current_position ?? candidate.target_role ?? "—"}
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <div>
            <p className="text-slate-400">Rubro</p>
            <p className="text-slate-900">{candidate.industry ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Seniority</p>
            <p className="text-slate-900">{candidate.seniority ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Ubicación</p>
            <p className="text-slate-900">
              {[candidate.city, candidate.country].filter(Boolean).join(", ") || "—"}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Idiomas</p>
            <p className="text-slate-900">{candidate.languages ?? "—"}</p>
          </div>
          <div>
            <p className="text-slate-400">Certificaciones</p>
            <p className="text-slate-900">{candidate.certifications ?? "—"}</p>
          </div>
          {candidate.career_score !== null && (
            <div>
              <p className="text-slate-400">Career Score</p>
              <p className="text-slate-900">{candidate.career_score}/100</p>
            </div>
          )}
        </div>

        <div className="mt-6 border-t border-slate-100 pt-6">
          {cv ? (
            <>
              <p className="text-sm font-medium text-slate-900">
                {cv.file_name}
              </p>
              {cv.ats_score !== null && (
                <p className="mt-1 text-xs text-slate-500">
                  ATS Score: {cv.ats_score}/100
                </p>
              )}
              <div className="mt-3">
                <ViewCvButton storagePath={cv.storage_path} />
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
