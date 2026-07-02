import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";
import CareerScoreCard from "./career-score-card";

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
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Career Intelligence AI</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Hola, {displayName} 👋
            </h1>
          </div>
          <LogoutButton />
        </div>

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
              <p className="text-sm text-slate-600">
                <span className="font-medium">
                  Probabilidad estimada de colocación:
                </span>{" "}
                {probabilidadColocacion !== null
                  ? `${probabilidadColocacion}%`
                  : "Sin datos suficientes todavía"}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Es una estimación simple basada en el promedio de tus
                puntajes disponibles (Career Score, ATS Score, matching
                promedio) — no es un modelo predictivo real, es solo
                referencial.
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

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-900">
                  Perfil profesional
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {profile?.profile_completed
                    ? "Tu perfil está completo. Puedes actualizarlo cuando quieras."
                    : "Aún no completas tu perfil profesional. Es la base para tu diagnóstico, ATS score y matching de vacantes."}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  profile?.profile_completed
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {profile?.profile_completed ? "Completo" : "Pendiente"}
              </span>
            </div>
            <Link
              href="/dashboard/profile"
              className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              {profile?.profile_completed
                ? "Editar perfil"
                : "Completar perfil"}
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-900">Tu CV</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {latestCv
                    ? `Último CV: ${latestCv.file_name}`
                    : "Sube tu CV en PDF o Word para comenzar el análisis."}
                </p>
              </div>
              {latestCv?.ats_score !== null &&
                latestCv?.ats_score !== undefined && (
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    ATS Score: {latestCv.ats_score}/100
                  </span>
                )}
            </div>
            <Link
              href="/dashboard/cv"
              className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Subir / ver CV
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-slate-900">
              Matching de vacantes
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Pega una oferta laboral y descubre qué tan compatible eres.
            </p>
            <Link
              href="/dashboard/matching"
              className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Analizar vacante
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-slate-900">
              CRM de oportunidades
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Registra tus postulaciones y haz seguimiento a cada una.
            </p>
            <Link
              href="/dashboard/opportunities"
              className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Ver oportunidades
            </Link>
          </div>

          {profile?.role === "administrador" && (
            <div className="rounded-2xl border border-purple-200 bg-purple-50 p-6">
              <h2 className="text-lg font-medium text-purple-900">
                Panel de administrador
              </h2>
              <p className="mt-1 text-sm text-purple-800">
                Gestiona usuarios, roles y asignaciones de coach.
              </p>
              <Link
                href="/dashboard/admin"
                className="mt-4 inline-block rounded-lg bg-purple-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-800"
              >
                Abrir panel
              </Link>
            </div>
          )}

          {(profile?.role === "coach" ||
            profile?.role === "administrador") && (
            <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <h2 className="text-lg font-medium text-blue-900">
                Mis usuarios asignados
              </h2>
              <p className="mt-1 text-sm text-blue-800">
                Revisa el progreso de los usuarios que tienes asignados.
              </p>
              <Link
                href="/dashboard/coach"
                className="mt-4 inline-block rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800"
              >
                Ver usuarios
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
