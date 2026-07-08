import { requireUsuario } from "@/lib/require-usuario";
import LinkedinUploadForm from "./linkedin-upload-form";
import LinkedinAnalysis from "./linkedin-analysis";
import LinkedinActions from "./linkedin-actions";
import DocumentStatusBadge from "@/components/cv/document-status-badge";

export default async function LinkedinPage() {
  const { supabase, user } = await requireUsuario();

  const { data: items } = await supabase
    .from("linkedin_profiles")
    .select(
      "id, file_name, storage_path, extracted_text, extraction_status, extraction_error, created_at, linkedin_score, linkedin_analysis"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  type LinkedinComment = {
    id: string;
    linkedin_profile_id: string;
    section: string | null;
    item_index: number | null;
    comment: string;
    seen_by_user: boolean;
  };

  const profileIds = (items ?? []).map((li) => li.id);
  const { data: comments } = profileIds.length
    ? await supabase
        .from("linkedin_comments")
        .select("id, linkedin_profile_id, section, item_index, comment, seen_by_user")
        .in("linkedin_profile_id", profileIds)
    : { data: [] as LinkedinComment[] };

  const unseenIds = (comments ?? [])
    .filter((c) => !c.seen_by_user)
    .map((c) => c.id);
  if (unseenIds.length > 0) {
    await supabase
      .from("linkedin_comments")
      .update({ seen_by_user: true })
      .in("id", unseenIds);
  }

  const commentsByProfile = new Map<string, LinkedinComment[]>();
  for (const c of (comments ?? []) as LinkedinComment[]) {
    const list = commentsByProfile.get(c.linkedin_profile_id) ?? [];
    list.push(c);
    commentsByProfile.set(c.linkedin_profile_id, list);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Análisis de LinkedIn
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Compara tu perfil de LinkedIn contra tu CV, calcula tu LinkedIn
        Score y recibe recomendaciones priorizadas.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">
          Cómo exportar tu perfil (2 pasos)
        </h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-slate-700">
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
        <p className="mt-3 text-xs text-slate-500">
          Sube ese PDF exportado abajo — no sirve una captura de
          pantalla ni un PDF de otra fuente, porque necesitamos el
          texto seleccionable que genera LinkedIn.
        </p>
        <p className="mt-2 text-xs text-slate-500">
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
        <div className="mt-6 flex flex-col gap-4">
          <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Perfiles subidos
          </h2>
          {items.map((li) => (
            <div
              key={li.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {li.file_name}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Subido el{" "}
                    {new Date(li.created_at).toLocaleDateString("es-CL", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <DocumentStatusBadge status={li.extraction_status} />
              </div>
              {li.extraction_status === "error" && (
                <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
                  {li.extraction_error}
                </p>
              )}
              {li.extraction_status === "done" && (
                <LinkedinActions
                  linkedinId={li.id}
                  storagePath={li.storage_path}
                  fileName={li.file_name}
                  extractedText={li.extracted_text}
                />
              )}
              <LinkedinAnalysis
                linkedinId={li.id}
                canAnalyze={li.extraction_status === "done"}
                initialScore={li.linkedin_score}
                initialAnalysis={li.linkedin_analysis}
                comments={commentsByProfile.get(li.id) ?? []}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
