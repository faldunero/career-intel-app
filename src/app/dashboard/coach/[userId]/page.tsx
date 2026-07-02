import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ViewFileButton from "../view-file-button";
import NotesSection from "../notes-section";

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

  if (myProfile?.role !== "coach" && myProfile?.role !== "administrador") {
    redirect("/dashboard");
  }

  // RLS ya restringe esto a usuarios asignados a este coach (o a
  // cualquiera si es admin). Si vuelve null, no tiene acceso.
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
    .select("id, file_name, storage_path, ats_score, extraction_status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const { data: linkedinProfiles } = await supabase
    .from("linkedin_profiles")
    .select("linkedin_score")
    .eq("user_id", userId)
    .not("linkedin_score", "is", null)
    .order("analyzed_at", { ascending: false })
    .limit(1);

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("status")
    .eq("user_id", userId);

  const { data: matches } = await supabase
    .from("job_matches")
    .select("id")
    .eq("user_id", userId);

  const { data: notes } = await supabase
    .from("coach_notes")
    .select("id, note, created_at")
    .eq("user_id", userId)
    .eq("coach_id", user.id)
    .order("created_at", { ascending: false });

  const opps = opportunities ?? [];
  const postulaciones = opps.filter((o) => o.status !== "por_postular").length;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard/coach"
          className="text-sm text-slate-500 underline hover:text-slate-800"
        >
          ← Volver a mis usuarios
        </Link>
        <p className="mt-3 text-sm text-slate-500">Career Intelligence AI</p>
        <h1 className="text-2xl font-semibold text-slate-900">
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
            CVs ({cvs?.length ?? 0}) — matches analizados ({matches?.length ?? 0})
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
    </main>
  );
}
