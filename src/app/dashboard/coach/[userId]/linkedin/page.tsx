import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import ViewFileButton from "../../view-file-button";
import LinkedinCommentThread from "./linkedin-comment-thread";
import LinkedinTextViewer from "./linkedin-text-viewer";
import ScoreRing from "@/components/cv/score-ring";
import AnalysisSection from "@/components/cv/analysis-section";

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

const SECTION_ORDER: Array<keyof LinkedinAnalysisT> = [
  "diferencias_con_cv",
  "informacion_faltante_en_linkedin",
  "palabras_clave_faltantes",
  "logros_omitidos",
  "recomendaciones_priorizadas",
];

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

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/coach"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        ← Volver a mis usuarios
      </Link>
      <p className="mt-3 text-sm text-slate-500">
        {profile.full_name ?? profile.email}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">LinkedIn</h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        {!latest && (
          <p className="text-sm text-slate-400">
            Este usuario no ha analizado su LinkedIn todavía.
          </p>
        )}
        {latest && (
          <>
            <div className="flex items-center justify-between">
              {latest.linkedin_score !== null ? (
                <ScoreRing score={latest.linkedin_score} label="LinkedIn Score" />
              ) : (
                <p className="text-sm text-slate-400">Sin puntaje calculado</p>
              )}
              {latest.storage_path && (
                <ViewFileButton
                  bucket="linkedin"
                  storagePath={latest.storage_path}
                  label="Ver PDF original"
                />
              )}
            </div>
            {latest.extracted_text && (
              <LinkedinTextViewer text={latest.extracted_text} />
            )}
            {analysis?.resumen && (
              <p className="mt-3 text-sm text-slate-600">{analysis.resumen}</p>
            )}

            {analysis && (
              <div className="mt-2 divide-y divide-slate-100">
                {SECTION_ORDER.map((section) => {
                  const items = analysis[section] as string[] | undefined;
                  const sectionComments = commentsFor(latest.id, section);
                  return (
                    <AnalysisSection
                      key={section}
                      title={SECTION_LABELS[section]}
                      section={section}
                      items={items}
                      commentCount={sectionComments.length}
                    >
                      <LinkedinCommentThread
                        linkedinProfileId={latest.id}
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

            <div className="border-t border-slate-100 pt-5">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
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
