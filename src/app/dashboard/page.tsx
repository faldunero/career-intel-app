import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CareerScoreCard from "./career-score-card";
import ProbabilityInfoModal from "./probability-info-modal";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Leemos el perfil desde la tabla `profiles` (se crea automáticamente
  // vía trigger al registrarse, ver supabase/migrations/0001_init.sql)
  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "full_name, role, profile_completed, target_companies, career_score, career_score_analysis"
    )
    .eq("id", user.id)
    .single();

  // El "Resumen" de búsqueda de empleo es propio del rol usuario.
  // Admin y coach no buscan empleo a través de la plataforma, así que
  // no tiene sentido mostrarles estos datos — los mandamos directo a
  // su panel correspondiente.
  if (profile?.role === "administrador") {
    redirect("/dashboard/admin");
  }
  if (profile?.role === "coach") {
    redirect("/dashboard/coach");
  }
  if (profile?.role === "headhunter") {
    redirect("/dashboard/headhunter");
  }

  const { data: latestCv } = await supabase
    .from("cvs")
    .select("file_name, extraction_status, ats_score")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: latestLinkedin } = await supabase
    .from("linkedin_profiles")
    .select("linkedin_score")
    .eq("user_id", user.id)
    .not("linkedin_score", "is", null)
    .order("analyzed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("status, company, applied_at, updated_at")
    .eq("user_id", user.id);

  const { data: matches } = await supabase
    .from("job_matches")
    .select("matching_general")
    .eq("user_id", user.id);

  const opps = opportunities ?? [];
  const postulaciones = opps.filter((o) => o.status !== "por_postular").length;
  const entrevistas = opps.filter((o) => o.status === "entrevista").length;
  const ofertas = opps.filter((o) => o.status === "oferta").length;
  const rechazos = opps.filter((o) => o.status === "rechazado").length;
  const respondidas = opps.filter((o) =>
    ["entrevista", "oferta", "rechazado"].includes(o.status)
  );
  const tasaRespuesta =
    postulaciones > 0
      ? Math.round((respondidas.length / postulaciones) * 100)
      : null;

  const tiemposRespuesta = respondidas
    .filter((o) => o.applied_at)
    .map((o) => {
      const applied = new Date(o.applied_at as string).getTime();
      const updated = new Date(o.updated_at).getTime();
      return Math.max(0, Math.round((updated - applied) / (1000 * 60 * 60 * 24)));
    });
  const tiempoPromedioRespuesta =
    tiemposRespuesta.length > 0
      ? Math.round(
          tiemposRespuesta.reduce((a, b) => a + b, 0) / tiemposRespuesta.length
        )
      : null;

  const targetCompaniesList = ((profile?.target_companies as string) ?? "")
    .split(",")
    .map((c: string) => c.trim().toLowerCase())
    .filter(Boolean);
  const reachedCompanies = new Set(
    opps
      .map((o) => o.company?.toLowerCase().trim())
      .filter((c): c is string => Boolean(c) && targetCompaniesList.includes(c!))
  );

  const matchScores = (matches ?? [])
    .map((m) => m.matching_general)
    .filter((s): s is number => typeof s === "number");
  const matchingPromedio =
    matchScores.length > 0
      ? Math.round(matchScores.reduce((a, b) => a + b, 0) / matchScores.length)
      : null;

  // Estimación simple (no un modelo predictivo real): promedio de las
  // señales disponibles. Se muestra como estimación, no como hecho.
  const probScores = [
    profile?.career_score,
    latestCv?.ats_score,
    matchingPromedio,
  ].filter((s): s is number => typeof s === "number");
  const probabilidadColocacion =
    probScores.length > 0
      ? Math.round(probScores.reduce((a, b) => a + b, 0) / probScores.length)
      : null;

  const displayName = profile?.full_name || user.email;

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Hola, {displayName} 👋
      </h1>

      <div className="mt-8 flex flex-col gap-4">
        <CareerScoreCard
          initialScore={profile?.career_score ?? null}
          initialAnalysis={profile?.career_score_analysis ?? null}
          />

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-slate-900">
              Resumen general
            </h2>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {postulaciones}
                </p>
                <p className="text-xs text-slate-500">Postulaciones</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {entrevistas}
                </p>
                <p className="text-xs text-slate-500">Entrevistas</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {ofertas}
                </p>
                <p className="text-xs text-slate-500">Ofertas</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {rechazos}
                </p>
                <p className="text-xs text-slate-500">Rechazos</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {tasaRespuesta !== null ? `${tasaRespuesta}%` : "—"}
                </p>
                <p className="text-xs text-slate-500">Tasa de respuesta</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {tiempoPromedioRespuesta !== null
                    ? `${tiempoPromedioRespuesta}d`
                    : "—"}
                </p>
                <p className="text-xs text-slate-500">
                  Tiempo prom. de respuesta
                </p>
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {reachedCompanies.size}/{targetCompaniesList.length || "—"}
                </p>
                <p className="text-xs text-slate-500">
                  Empresas objetivo alcanzadas
                </p>
              </div>
              <div>
                <p className="text-xl font-semibold text-slate-900">
                  {matchingPromedio !== null ? matchingPromedio : "—"}
                </p>
                <p className="text-xs text-slate-500">Matching promedio</p>
              </div>
            </div>

            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="flex items-center text-sm text-slate-600">
                <span className="font-medium">
                  Probabilidad estimada de colocación:
                </span>{" "}
                <span className="ml-1">
                  {probabilidadColocacion !== null
                    ? `${probabilidadColocacion}%`
                    : "Sin datos suficientes todavía"}
                </span>
                <ProbabilityInfoModal
                  result={probabilidadColocacion}
                  inputs={[
                    { label: "Career Score", value: profile?.career_score ?? null },
                    { label: "ATS Score (CV)", value: latestCv?.ats_score ?? null },
                    { label: "Matching promedio", value: matchingPromedio },
                  ]}
                />
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Es una estimación simple, no un modelo predictivo real —
                click en el ícono de arriba para ver el detalle.
              </p>
            </div>

            <p className="mt-4 text-xs text-slate-400">
              {latestLinkedin?.linkedin_score !== undefined &&
              latestLinkedin?.linkedin_score !== null ? (
                <>
                  LinkedIn Score:{" "}
                  <span className="font-medium text-slate-600">
                    {latestLinkedin.linkedin_score}/100
                  </span>{" "}
                  ·{" "}
                  <Link href="/dashboard/linkedin" className="underline">
                    ver detalle
                  </Link>
                  . Networking Score: no disponible todavía.
                </>
              ) : (
                <>
                  LinkedIn Score y Networking Score: no disponibles
                  todavía —{" "}
                  <Link href="/dashboard/linkedin" className="underline">
                    analiza tu LinkedIn
                  </Link>{" "}
                  para calcular el primero.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
  );
}
