import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";

export default async function CoachUserLinkedinPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, profile } = await getCoachViewedUser(userId);

  const { data: linkedinProfiles } = await supabase
    .from("linkedin_profiles")
    .select("id, linkedin_score, linkedin_analysis, analyzed_at")
    .eq("user_id", userId)
    .order("analyzed_at", { ascending: false });

  const latest = linkedinProfiles?.[0];
  const analysis = latest?.linkedin_analysis as
    | {
        resumen?: string;
        recomendaciones_priorizadas?: string[];
        palabras_clave_faltantes?: string[];
      }
    | null
    | undefined;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/coach"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        Volver a mis usuarios
      </Link>
      <p className="mt-3 text-sm text-slate-500">
        {profile.full_name ?? profile.email}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">LinkedIn</h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {!latest && (
          <p className="text-sm text-slate-500">
            Este usuario no ha analizado su LinkedIn todavía.
          </p>
        )}
        {latest && (
          <>
            <p className="text-3xl font-semibold text-slate-900">
              {latest.linkedin_score ?? "—"}
              <span className="text-sm font-normal text-slate-400">
                /100 LinkedIn Score
              </span>
            </p>
            {analysis?.resumen && (
              <p className="mt-2 text-sm text-slate-600">{analysis.resumen}</p>
            )}
            {analysis?.palabras_clave_faltantes &&
              analysis.palabras_clave_faltantes.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Palabras clave faltantes
                  </h4>
                  <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                    {analysis.palabras_clave_faltantes.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            {analysis?.recomendaciones_priorizadas &&
              analysis.recomendaciones_priorizadas.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Recomendaciones priorizadas
                  </h4>
                  <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                    {analysis.recomendaciones_priorizadas.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
          </>
        )}
      </div>
    </div>
  );
}
