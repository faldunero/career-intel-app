import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import ViewFileButton from "../../view-file-button";

export default async function CoachUserCvPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, profile } = await getCoachViewedUser(userId);

  const { data: cvs } = await supabase
    .from("cvs")
    .select("id, file_name, storage_path, ats_score, ats_analysis, extraction_status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const latestAnalysis = cvs?.[0]?.ats_analysis as
    | {
        score_explicado?: string;
        que_reescribir?: string[];
        palabras_clave_faltantes?: string[];
      }
    | null
    | undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/coach"
        className="text-sm text-slate-500 underline hover:text-slate-800"
      >
        ← Volver a mis usuarios
      </Link>
      <p className="mt-3 text-sm text-slate-500">
        {profile.full_name ?? profile.email}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">CV</h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          CVs ({cvs?.length ?? 0})
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {(cvs ?? []).map((cv) => (
            <div
              key={cv.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
            >
              <span>
                {cv.file_name}{" "}
                {cv.ats_score !== null && (
                  <span className="text-xs text-slate-400">
                    (ATS: {cv.ats_score})
                  </span>
                )}
              </span>
              <ViewFileButton bucket="cvs" storagePath={cv.storage_path} />
            </div>
          ))}
          {(!cvs || cvs.length === 0) && (
            <p className="text-xs text-slate-400">
              Este usuario no ha subido CVs todavía.
            </p>
          )}
        </div>
      </div>

      {latestAnalysis && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">
            Análisis ATS del CV más reciente
          </h2>
          {latestAnalysis.score_explicado && (
            <p className="mt-2 text-sm text-slate-600">
              {latestAnalysis.score_explicado}
            </p>
          )}
          {latestAnalysis.palabras_clave_faltantes &&
            latestAnalysis.palabras_clave_faltantes.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Palabras clave faltantes
                </h4>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                  {latestAnalysis.palabras_clave_faltantes.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          {latestAnalysis.que_reescribir &&
            latestAnalysis.que_reescribir.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Qué reescribir
                </h4>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                  {latestAnalysis.que_reescribir.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
