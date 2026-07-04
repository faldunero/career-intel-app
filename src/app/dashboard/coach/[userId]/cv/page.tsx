import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import ViewFileButton from "../../view-file-button";
import CvCommentThread from "./cv-comment-thread";

type AtsAnalysis = {
  score_explicado?: string;
  fortalezas?: string[];
  palabras_clave_faltantes?: string[];
  que_eliminar?: string[];
  que_agregar?: string[];
  que_reescribir?: string[];
  que_cuantificar?: string[];
};

type Comment = {
  id: string;
  cv_id: string;
  section: string | null;
  item_index: number | null;
  comment: string;
  created_at: string;
};

const SECTION_LABELS: Record<string, string> = {
  fortalezas: "Fortalezas",
  palabras_clave_faltantes: "Palabras clave faltantes",
  que_eliminar: "Qué eliminar",
  que_agregar: "Qué agregar",
  que_reescribir: "Qué reescribir",
  que_cuantificar: "Qué cuantificar",
};

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 75
      ? "bg-green-100 text-green-700"
      : score >= 50
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";
  return (
    <span className={`rounded-full px-3 py-1 text-sm font-semibold ${color}`}>
      ATS Score: {score}/100
    </span>
  );
}

export default async function CoachUserCvPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, coachId, profile } = await getCoachViewedUser(userId);

  const { data: cvs } = await supabase
    .from("cvs")
    .select(
      "id, file_name, storage_path, ats_score, ats_analysis, extraction_status, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  const cvIds = (cvs ?? []).map((cv) => cv.id);
  const { data: allComments } = cvIds.length
    ? await supabase
        .from("cv_comments")
        .select("id, cv_id, section, item_index, comment, created_at")
        .in("cv_id", cvIds)
        .order("created_at", { ascending: true })
    : { data: [] as Comment[] };

  const commentsByCv = new Map<string, Comment[]>();
  for (const c of (allComments ?? []) as Comment[]) {
    const list = commentsByCv.get(c.cv_id) ?? [];
    list.push(c);
    commentsByCv.set(c.cv_id, list);
  }

  function commentsFor(cvId: string, section: string | null, itemIndex: number | null) {
    return (commentsByCv.get(cvId) ?? []).filter(
      (c) => c.section === section && c.item_index === itemIndex
    );
  }

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
      <h1 className="text-2xl font-semibold text-slate-900">CV</h1>

      {(!cvs || cvs.length === 0) && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-400">
            Este usuario no ha subido CVs todavía.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-4">
        {(cvs ?? []).map((cv) => {
          const analysis = cv.ats_analysis as AtsAnalysis | null;
          const sections: Array<keyof AtsAnalysis> = [
            "fortalezas",
            "palabras_clave_faltantes",
            "que_eliminar",
            "que_agregar",
            "que_reescribir",
            "que_cuantificar",
          ];

          return (
            <div
              key={cv.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {cv.file_name}
                </p>
                <ViewFileButton bucket="cvs" storagePath={cv.storage_path} />
              </div>

              {cv.ats_score !== null && (
                <div className="mt-3">
                  <ScoreBadge score={cv.ats_score} />
                </div>
              )}

              {analysis?.score_explicado && (
                <p className="mt-3 text-sm text-slate-600">
                  {analysis.score_explicado}
                </p>
              )}

              {!analysis && (
                <p className="mt-3 text-xs text-slate-400">
                  Este usuario aún no ha corrido el análisis ATS con IA.
                </p>
              )}

              {analysis &&
                sections.map((section) => {
                  const items = analysis[section] as string[] | undefined;
                  if (!items || items.length === 0) return null;
                  return (
                    <div key={section} className="mt-4">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {SECTION_LABELS[section]}
                      </h4>
                      <ul className="mt-2 flex flex-col gap-3">
                        {items.map((item, i) => (
                          <li key={i} className="text-sm text-slate-700">
                            <p>{item}</p>
                            <CvCommentThread
                              cvId={cv.id}
                              coachId={coachId}
                              section={section}
                              itemIndex={i}
                              comments={commentsFor(cv.id, section, i)}
                              placeholder="Tu sugerencia sobre este punto..."
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}

              <div className="mt-5 border-t border-slate-100 pt-4">
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Comentario general del CV
                </h4>
                <CvCommentThread
                  cvId={cv.id}
                  coachId={coachId}
                  section={null}
                  itemIndex={null}
                  comments={commentsFor(cv.id, null, null)}
                  placeholder="Feedback general, próximos pasos, tareas para la próxima sesión..."
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
