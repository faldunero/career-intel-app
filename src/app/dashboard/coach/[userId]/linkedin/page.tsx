import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import ViewFileButton from "../../view-file-button";
import LinkedinCommentThread from "./linkedin-comment-thread";
import LinkedinTextViewer from "./linkedin-text-viewer";

type LinkedinAnalysisT = {
  resumen?: string;
  diferencias_con_cv?: string[];
  informacion_faltante_en_linkedin?: string[];
  palabras_clave_faltantes?: string[];
  logros_omitidos?: string[];
  recomendaciones_priorizadas?: string[];
};

type Comment = {
  id: string;
  linkedin_profile_id: string;
  section: string | null;
  comment: string;
  created_at: string;
};

const SECTION_LABELS: Record<string, string> = {
  diferencias_con_cv: "Diferencias con el CV",
  informacion_faltante_en_linkedin: "Falta en LinkedIn",
  palabras_clave_faltantes: "Palabras clave faltantes",
  logros_omitidos: "Logros omitidos",
  recomendaciones_priorizadas: "Recomendaciones priorizadas",
};

// Las categorías tipo "lista de palabras sueltas" se ven mejor como chips.
// Las que son frases con sustancia se ven mejor como lista.
const CHIP_SECTIONS = new Set(["palabras_clave_faltantes"]);

function KeywordChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, i) => (
        <span
          key={i}
          className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

function TextList({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-col gap-2 pl-5 text-sm text-slate-700">
      {items.map((item, i) => (
        <li key={i} className="list-disc">
          {item}
        </li>
      ))}
    </ul>
  );
}

export default async function CoachUserLinkedinPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, coachId, profile } = await getCoachViewedUser(userId);

  const { data: linkedinProfiles } = await supabase
    .from("linkedin_profiles")
    .select(
      "id, file_name, storage_path, extracted_text, linkedin_score, linkedin_analysis, analyzed_at"
    )
    .eq("user_id", userId)
    .order("analyzed_at", { ascending: false });

  const profileIds = (linkedinProfiles ?? []).map((p) => p.id);
  const { data: allComments } = profileIds.length
    ? await supabase
        .from("linkedin_comments")
        .select("id, linkedin_profile_id, section, comment, created_at")
        .in("linkedin_profile_id", profileIds)
        .order("created_at", { ascending: true })
    : { data: [] as Comment[] };

  const commentsByProfile = new Map<string, Comment[]>();
  for (const c of (allComments ?? []) as Comment[]) {
    const list = commentsByProfile.get(c.linkedin_profile_id) ?? [];
    list.push(c);
    commentsByProfile.set(c.linkedin_profile_id, list);
  }

  function commentsFor(profileId: string, section: string | null) {
    return (commentsByProfile.get(profileId) ?? []).filter(
      (c) => c.section === section
    );
  }

  const latest = linkedinProfiles?.[0];
  const analysis = latest?.linkedin_analysis as LinkedinAnalysisT | null | undefined;

  const sections: Array<keyof LinkedinAnalysisT> = [
    "diferencias_con_cv",
    "informacion_faltante_en_linkedin",
    "palabras_clave_faltantes",
    "logros_omitidos",
    "recomendaciones_priorizadas",
  ];

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
      <h1 className="text-2xl font-semibold text-slate-900">LinkedIn</h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {!latest && (
          <p className="text-sm text-slate-500">
            Este usuario no ha analizado su LinkedIn todavía.
          </p>
        )}
        {latest && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-semibold text-slate-900">
                  {latest.linkedin_score ?? "—"}
                </p>
                <span className="text-sm text-slate-400">/100 LinkedIn Score</span>
              </div>
              {latest.storage_path && (
                <ViewFileButton
                  bucket="linkedin"
                  storagePath={latest.storage_path}
                  label="Ver PDF de LinkedIn"
                />
              )}
            </div>
            {latest.extracted_text && (
              <LinkedinTextViewer text={latest.extracted_text} />
            )}
            {analysis?.resumen && (
              <p className="mt-2 text-sm text-slate-600">{analysis.resumen}</p>
            )}

            {analysis &&
              sections.map((section, idx) => {
                const items = analysis[section] as string[] | undefined;
                if (!items || items.length === 0) return null;
                const sectionComments = commentsFor(latest.id, section);
                return (
                  <div
                    key={section}
                    className={`py-5 ${idx > 0 ? "border-t border-slate-100" : "pt-5"}`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {SECTION_LABELS[section]}
                      </h4>
                      {sectionComments.length > 0 && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {sectionComments.length} comentario
                          {sectionComments.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <div className="mt-3">
                      {CHIP_SECTIONS.has(section) ? (
                        <KeywordChips items={items} />
                      ) : (
                        <TextList items={items} />
                      )}
                    </div>

                    <LinkedinCommentThread
                      linkedinProfileId={latest.id}
                      coachId={coachId}
                      section={section}
                      comments={sectionComments}
                      placeholder={`Tu opinión sobre "${SECTION_LABELS[section]}"...`}
                    />
                  </div>
                );
              })}

            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Comentario general del perfil
              </h4>
              <LinkedinCommentThread
                linkedinProfileId={latest.id}
                coachId={coachId}
                section={null}
                comments={commentsFor(latest.id, null)}
                placeholder="Feedback general sobre el perfil de LinkedIn..."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
