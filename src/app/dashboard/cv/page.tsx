import { requireUsuario } from "@/lib/require-usuario";
import CvUploadForm from "./cv-upload-form";
import CvAnalysis from "./cv-analysis";
import RetryExtraction from "./retry-extraction";
import CvActions from "./cv-actions";

const STATUS_LABEL: Record<string, string> = {
  done: "Texto leído",
  error: "Error",
  pending: "Pendiente",
};

const STATUS_CLASS: Record<string, string> = {
  done: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
  pending: "bg-amber-100 text-amber-700",
};

export default async function CvPage() {
  const { supabase, user } = await requireUsuario();

  const { data: cvs } = await supabase
    .from("cvs")
    .select(
      "id, file_name, storage_path, extraction_status, extraction_error, created_at, extracted_text, ats_score, ats_analysis"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  type CvComment = {
    id: string;
    cv_id: string;
    section: string | null;
    item_index: number | null;
    comment: string;
    seen_by_user: boolean;
  };

  const cvIds = (cvs ?? []).map((cv) => cv.id);
  const { data: comments } = cvIds.length
    ? await supabase
        .from("cv_comments")
        .select("id, cv_id, section, item_index, comment, seen_by_user")
        .in("cv_id", cvIds)
    : { data: [] as CvComment[] };

  // Al abrir esta página, se marcan como vistos los comentarios pendientes
  // (esto es lo que hace desaparecer el badge del sidebar).
  const unseenIds = (comments ?? [])
    .filter((c) => !c.seen_by_user)
    .map((c) => c.id);
  if (unseenIds.length > 0) {
    await supabase
      .from("cv_comments")
      .update({ seen_by_user: true })
      .in("id", unseenIds);
  }

  const commentsByCv = new Map<string, CvComment[]>();
  for (const c of (comments ?? []) as CvComment[]) {
    const list = commentsByCv.get(c.cv_id) ?? [];
    list.push(c);
    commentsByCv.set(c.cv_id, list);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Tu CV</h1>
      <p className="mt-1 text-sm text-slate-500">
        Sube tu CV en PDF o Word para comenzar el análisis.
      </p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <CvUploadForm userId={user.id} />
      </div>

      {cvs && cvs.length > 0 && (
        <div className="mt-6 flex flex-col gap-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            CVs subidos
          </h2>
          {cvs.map((cv) => (
            <div
              key={cv.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {cv.file_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Subido el{" "}
                    {new Date(cv.created_at).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                    STATUS_CLASS[cv.extraction_status] ??
                    "bg-slate-100 text-slate-600"
                  }`}
                >
                  {STATUS_LABEL[cv.extraction_status] ?? cv.extraction_status}
                </span>
              </div>

              {cv.extraction_status === "error" && (
                <>
                  <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                    {cv.extraction_error}
                  </p>
                  <RetryExtraction cvId={cv.id} />
                </>
              )}

              <CvActions
                cvId={cv.id}
                fileName={cv.file_name}
                storagePath={cv.storage_path}
                extractedText={cv.extracted_text}
              />
              <CvAnalysis
                cvId={cv.id}
                canAnalyze={cv.extraction_status === "done"}
                initialScore={cv.ats_score}
                initialAnalysis={cv.ats_analysis}
                comments={commentsByCv.get(cv.id) ?? []}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
