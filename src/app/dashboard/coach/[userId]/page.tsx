import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ViewFileButton from "../view-file-button";
import NotesSection from "../notes-section";
import TasksSection from "../tasks-section";
import MonthCalendar from "../../calendar/month-calendar";
import AddEventForm from "../../calendar/add-event-form";

export default async function CoachUserDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (myProfile?.role !== "coach") {
    redirect("/dashboard");
  }

  // RLS ya restringe esto a usuarios asignados a este coach. Si vuelve
  // null, no tiene acceso.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) {
    notFound();
  }

  const { data: cvs } = await supabase
    .from("cvs")
    .select("id, file_name, storage_path, ats_score, ats_analysis, extraction_status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data: linkedinProfiles } = await supabase
    .from("linkedin_profiles")
    .select("id, linkedin_score, linkedin_analysis, analyzed_at")
    .eq("user_id", userId)
    .not("linkedin_score", "is", null)
    .order("analyzed_at", { ascending: false })
    .limit(1);

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id, company, job_title, status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data: matches } = await supabase
    .from("job_matches")
    .select("id, company, job_title, matching_general, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data: notes } = await supabase
    .from("coach_notes")
    .select("id, note, created_at")
    .eq("user_id", userId)
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  const { data: tasks } = await supabase
    .from("coach_tasks")
    .select("id, title, description, due_date, status")
    .eq("user_id", userId)
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  const { data: calendarEvents } = await supabase
    .from("calendar_events")
    .select("id, event_type, title, description, event_date, event_time, location")
    .eq("user_id", userId)
    .order("event_date", { ascending: true });

  const opps = opportunities ?? [];
  const postulaciones = opps.filter((o) => o.status !== "por_postular").length;
  const latestCvAnalysis = cvs?.[0]?.ats_analysis as
    | {
        score_explicado?: string;
        que_agregar?: string[];
        que_reescribir?: string[];
        palabras_clave_faltantes?: string[];
      }
    | null
    | undefined;
  const careerAnalysis = profile.career_score_analysis as
    | {
        explicacion?: string;
        fortalezas?: string[];
        oportunidades_mejora?: string[];
      }
    | null;
  const linkedinAnalysis = linkedinProfiles?.[0]?.linkedin_analysis as
    | {
        resumen?: string;
        recomendaciones_priorizadas?: string[];
      }
    | null
    | undefined;

  const STATUS_LABELS: Record<string, string> = {
    por_postular: "Por postular",
    postulado: "Postulado",
    entrevista: "En entrevista",
    oferta: "Oferta recibida",
    rechazado: "Rechazado",
    abandonado: "Abandonado",
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/coach"
        className="text-sm text-slate-500 underline hover:text-slate-800"
      >
        ← Volver a mis usuarios
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
            {cvs?.[0]?.ats_score ?? "—"}
          </p>
          <p className="text-xs text-slate-500">ATS Score</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-center">
          <p className="text-xl font-semibold text-slate-900">
            {linkedinProfiles?.[0]?.linkedin_score ?? "—"}
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

      {latestCvAnalysis && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">
            Análisis ATS del CV más reciente
          </h2>
          {latestCvAnalysis.score_explicado && (
            <p className="mt-2 text-sm text-slate-600">
              {latestCvAnalysis.score_explicado}
            </p>
          )}
          {latestCvAnalysis.palabras_clave_faltantes &&
            latestCvAnalysis.palabras_clave_faltantes.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Palabras clave faltantes
                </h4>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                  {latestCvAnalysis.palabras_clave_faltantes.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
            )}
          {latestCvAnalysis.que_reescribir &&
            latestCvAnalysis.que_reescribir.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Qué reescribir
                </h4>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                  {latestCvAnalysis.que_reescribir.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      {linkedinAnalysis && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">
            Análisis de LinkedIn
          </h2>
          {linkedinAnalysis.resumen && (
            <p className="mt-2 text-sm text-slate-600">
              {linkedinAnalysis.resumen}
            </p>
          )}
          {linkedinAnalysis.recomendaciones_priorizadas &&
            linkedinAnalysis.recomendaciones_priorizadas.length > 0 && (
              <div className="mt-3">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recomendaciones priorizadas
                </h4>
                <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
                  {linkedinAnalysis.recomendaciones_priorizadas.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Pipeline de postulaciones (CRM) — {opps.length}
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {opps.map((o) => (
            <div
              key={o.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
            >
              <span>
                {o.job_title ?? "Cargo sin definir"}
                {o.company ? ` — ${o.company}` : ""}
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                {STATUS_LABELS[o.status] ?? o.status}
              </span>
            </div>
          ))}
          {opps.length === 0 && (
            <p className="text-xs text-slate-400">
              Este usuario no ha registrado oportunidades todavía.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Matching de vacantes analizados — {matches?.length ?? 0}
        </h2>
        <div className="mt-3 flex flex-col gap-2">
          {(matches ?? []).map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
            >
              <span>
                {m.job_title ?? "Cargo no identificado"}
                {m.company ? ` — ${m.company}` : ""}
              </span>
              {m.matching_general !== null && (
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                  {m.matching_general}/100
                </span>
              )}
            </div>
          ))}
          {(!matches || matches.length === 0) && (
            <p className="text-xs text-slate-400">
              Este usuario no ha analizado vacantes todavía.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">Calendario</h2>
        <p className="mt-1 text-sm text-slate-500">
          Puedes agendar sesiones directamente en el calendario de este
          usuario.
        </p>
        <div className="mt-4">
          <AddEventForm userId={userId} />
        </div>
        <div className="mt-4">
          <MonthCalendar events={calendarEvents ?? []} editable />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Tareas asignadas
        </h2>
        <div className="mt-4">
          <TasksSection
            coachId={user.id}
            userId={userId}
            initialTasks={tasks ?? []}
          />
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Observaciones de seguimiento
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Solo tú (este coach) puedes ver tus propias notas.
        </p>
        <div className="mt-4">
          <NotesSection
            coachId={user.id}
            userId={userId}
            initialNotes={notes ?? []}
          />
        </div>
      </div>
    </div>
  );
}
