import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";

export default async function CoachUserSummaryPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, profile } = await getCoachViewedUser(userId);

  const { data: latestCv } = await supabase
    .from("cvs")
    .select("ats_score")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: latestLinkedin } = await supabase
    .from("linkedin_profiles")
    .select("linkedin_score")
    .eq("user_id", userId)
    .not("linkedin_score", "is", null)
    .order("analyzed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("status")
    .eq("user_id", userId);

  const opps = opportunities ?? [];
  const postulaciones = opps.filter((o) => o.status !== "por_postular").length;

  const careerAnalysis = profile.career_score_analysis as
    | {
        explicacion?: string;
        fortalezas?: string[];
        oportunidades_mejora?: string[];
      }
    | null;

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/coach"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        Volver a mis usuarios
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-slate-900">
        {profile.full_name ?? profile.email ?? "Usuario"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">{profile.email}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xl font-semibold text-slate-900">
            {profile.career_score ?? "—"}
          </p>
          <p className="text-xs text-slate-500">Career Score</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xl font-semibold text-slate-900">
            {latestCv?.ats_score ?? "—"}
          </p>
          <p className="text-xs text-slate-500">ATS Score</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xl font-semibold text-slate-900">
            {latestLinkedin?.linkedin_score ?? "—"}
          </p>
          <p className="text-xs text-slate-500">LinkedIn Score</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xl font-semibold text-slate-900">
            {postulaciones}
          </p>
          <p className="text-xs text-slate-500">Postulaciones</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Perfil profesional
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <p>
            <span className="text-slate-500">Profesión:</span>{" "}
            {profile.profession ?? "—"}
          </p>
          <p>
            <span className="text-slate-500">Industria:</span>{" "}
            {profile.industry ?? "—"}
          </p>
          <p>
            <span className="text-slate-500">Seniority:</span>{" "}
            {profile.seniority ?? "—"}
          </p>
          <p>
            <span className="text-slate-500">Cargo actual:</span>{" "}
            {profile.current_position ?? "—"}
          </p>
          <p>
            <span className="text-slate-500">Cargo objetivo:</span>{" "}
            {profile.target_role ?? "—"}
          </p>
          <p>
            <span className="text-slate-500">Años de experiencia:</span>{" "}
            {profile.years_experience ?? "—"}
          </p>
        </div>
      </div>

      {careerAnalysis && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">
            Diagnóstico (Career Score)
          </h2>
          {careerAnalysis.explicacion && (
            <p className="mt-2 text-sm text-slate-600">
              {careerAnalysis.explicacion}
            </p>
          )}
          {careerAnalysis.fortalezas && careerAnalysis.fortalezas.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Fortalezas
              </h4>
              <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                {careerAnalysis.fortalezas.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {careerAnalysis.oportunidades_mejora &&
            careerAnalysis.oportunidades_mejora.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Oportunidades de mejora
                </h4>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                  {careerAnalysis.oportunidades_mejora.map((o, i) => (
                    <li key={i}>{o}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}
    </div>
  );
}
