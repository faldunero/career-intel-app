import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LinkedinUploadForm from "./linkedin-upload-form";
import LinkedinAnalysis from "./linkedin-analysis";

export default async function LinkedinPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: items } = await supabase
    .from("linkedin_profiles")
    .select(
      "id, file_name, extraction_status, extraction_error, created_at, linkedin_score, linkedin_analysis"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Análisis de LinkedIn
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Compara tu perfil de LinkedIn contra tu CV, calcula tu LinkedIn
        Score y recibe recomendaciones priorizadas.
      </p>

      <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="text-sm font-semibold text-amber-900">
          Cómo exportar tu perfil (2 pasos)
        </h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-amber-900">
          <li>
            Entra a tu perfil de LinkedIn (ícono &quot;Me&quot; → View
            profile).
          </li>
          <li>
            En la sección de introducción (junto a tu nombre), haz click
            en el botón <strong>&quot;More&quot;</strong> (o{" "}
            <strong>&quot;Resources&quot;</strong>) → elige{" "}
            <strong>&quot;Save to PDF&quot;</strong>. Esto no está
            disponible en la app móvil, hazlo desde el navegador.
          </li>
        </ol>
        <p className="mt-3 text-xs text-amber-700">
          Sube ese PDF exportado abajo — no sirve una captura de
          pantalla ni un PDF de otra fuente, porque necesitamos el
          texto seleccionable que genera LinkedIn.
        </p>
        <p className="mt-2 text-xs text-amber-700">
          ¿No ves la opción &quot;Save to PDF&quot;? En algunos casos
          LinkedIn la limita según el idioma del perfil — si te pasa
          eso, cambia temporalmente tu idioma a inglés en Settings →
          Account preferences → Site preferences → Language, exporta,
          y luego puedes volver a tu idioma original.
        </p>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <LinkedinUploadForm userId={user.id} />
      </div>

      {items && items.length > 0 && (
        <div className="mt-6 flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Perfiles subidos
          </h2>
          {items.map((li) => (
            <div
              key={li.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-900">
                  {li.file_name}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    li.extraction_status === "done"
                      ? "bg-green-100 text-green-700"
                      : li.extraction_status === "error"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {li.extraction_status === "done"
                    ? "Texto leído"
                    : li.extraction_status === "error"
                      ? "Error"
                      : "Pendiente"}
                </span>
              </div>
              {li.extraction_status === "error" && (
                <p className="mt-2 text-xs text-red-600">
                  {li.extraction_error}
                </p>
              )}
              <LinkedinAnalysis
                linkedinId={li.id}
                canAnalyze={li.extraction_status === "done"}
                initialScore={li.linkedin_score}
                initialAnalysis={li.linkedin_analysis}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
