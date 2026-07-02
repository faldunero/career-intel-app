import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CvUploadForm from "./cv-upload-form";
import CvAnalysis from "./cv-analysis";
import RetryExtraction from "./retry-extraction";

export default async function CvPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: cvs } = await supabase
    .from("cvs")
    .select(
      "id, file_name, extraction_status, extraction_error, created_at, extracted_text, ats_score, ats_analysis"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 underline hover:text-slate-800"
        >
          ← Volver al dashboard
        </Link>
        <p className="mt-3 text-sm text-slate-500">Career Intelligence AI</p>
        <h1 className="text-2xl font-semibold text-slate-900">Tu CV</h1>
        <p className="mt-1 text-sm text-slate-500">
          Sube tu CV en PDF o Word. En esta fase solo confirmamos que
          podemos leerlo correctamente — el análisis ATS con IA viene en
          la Fase 3.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <CvUploadForm userId={user.id} />
        </div>

        {cvs && cvs.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              CVs subidos
            </h2>
            {cvs.map((cv) => (
              <div
                key={cv.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-slate-900">
                    {cv.file_name}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      cv.extraction_status === "done"
                        ? "bg-green-100 text-green-700"
                        : cv.extraction_status === "error"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {cv.extraction_status === "done"
                      ? "Texto leído"
                      : cv.extraction_status === "error"
                        ? "Error"
                        : "Pendiente"}
                  </span>
                </div>
                {cv.extraction_status === "error" && (
                  <>
                    <p className="mt-2 text-xs text-red-600">
                      {cv.extraction_error}
                    </p>
                    <RetryExtraction cvId={cv.id} />
                  </>
                )}
                {cv.extraction_status === "done" && cv.extracted_text && (
                  <p className="mt-2 line-clamp-3 text-xs text-slate-500">
                    {cv.extracted_text.slice(0, 220)}...
                  </p>
                )}
                <CvAnalysis
                  cvId={cv.id}
                  canAnalyze={cv.extraction_status === "done"}
                  initialScore={cv.ats_score}
                  initialAnalysis={cv.ats_analysis}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
