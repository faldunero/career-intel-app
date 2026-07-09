import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import ViewFileButton from "../../view-file-button";
import CvCommentThread from "./cv-comment-thread";
import CvPdfViewer from "@/components/cv/pdf-viewer";
import ScoreRing from "@/components/cv/score-ring";
import AnalysisSection from "@/components/cv/analysis-section";

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

const SECTION_ORDER: Array<keyof AtsAnalysis> = [
  "fortalezas",
  "palabras_clave_faltantes",
  "que_eliminar",
  "que_agregar",
  "que_reescribir",
  "que_cuantificar",
];

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
        .select("id, cv_id, section, comment, created_at")
        .in("cv_id", cvIds)
        .order("created_at", { ascending: true })
    : { data: [] as Comment[] };

  const commentsByCv = new Map<string, Comment[]>();
  for (const c of (allComments ?? []) as Comment[]) {
    const list = commentsByCv.get(c.cv_id) ?? [];
    list.push(c);
    commentsByCv.set(c.cv_id, list);
  }

  function commentsFor(cvId: string, section: string | null) {
    return (commentsByCv.get(cvId) ?? []).filter((c) => c.section === section);
  }

  return (
    <div className="mx-auto max-w-3xl">
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
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-slate-400">
            Este usuario no ha subido CVs todavía.
          </p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-6">
        {(cvs ?? []).map((cv) => {
          const analysis = cv.ats_analysis as AtsAnalysis | null;

          return (
            <div
              key={cv.id}
              className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {cv.file_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    Subido el{" "}
                    {new Date(cv.created_at).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <ViewFileButton bucket="cvs" storagePath={cv.storage_path} />
              </div>

              <div className="px-6 py-5">
                <CvPdfViewer
                  storagePath={cv.storage_path}
                  fileName={cv.file_name}
                />
              </div>

              <div className="border-t border-slate-100 px-6 py-5">
                {cv.ats_score !== null ? (
                  <ScoreRing score={cv.ats_score} label="ATS Score" />
                ) : (
                  <p className="text-xs text-slate-400">
                    Este usuario aún no ha corrido el análisis ATS con IA.
                  </p>
                )}

                {analysis?.score_explicado && (
                  <p className="mt-3 text-sm text-slate-600">
                    {analysis.score_explicado}
                  </p>
                )}
              </div>

              {analysis && (
                <div className="divide-y divide-slate-100 border-t border-slate-100 px-6">
                  {SECTION_ORDER.map((section) => {
                    const items = analysis[section] as string[] | undefined;
                    const sectionComments = commentsFor(cv.id, section);
                    return (
                      <AnalysisSection
                        key={section}
                        title={SECTION_LABELS[section]}
                        section={section}
                        items={items}
                        commentCount={sectionComments.length}
                      >
                        <CvCommentThread
                          cvId={cv.id}
                          coachId={coachId}
                          section={section}
                          comments={sectionComments}
                          placeholder={`Tu opinión sobre "${SECTION_LABELS[section]}"...`}
                        />
                      </AnalysisSection>
                    );
                  })}
                </div>
              )}

              <div className="border-t border-slate-100 px-6 py-5">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Comentario general del CV
                </h4>
                <CvCommentThread
                  cvId={cv.id}
                  coachId={coachId}
                  section={null}
                  comments={commentsFor(cv.id, null)}
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
