import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import LinkedinCommentThread from "./linkedin-comment-thread";

type LinkedinAnalysis = {
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
  item_index: number | null;
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

export default async function CoachUserLinkedinPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, coachId, profile } = await getCoachViewedUser(userId);

  const { data: linkedinProfiles } = await supabase
    .from("linkedin_profiles")
    .select("id, linkedin_score, linkedin_analysis, analyzed_at")
    .eq("user_id", userId)
    .order("analyzed_at", { ascending: false });

  const profileIds = (linkedinProfiles ?? []).map((p) => p.id);
  const { data: allComments } = profileIds.length
    ? await supabase
        .from("linkedin_comments")
        .select("id, linkedin_profile_id, section, item_index, comment, created_at")
        .in("linkedin_profile_id", profileIds)
        .order("created_at", { ascending: true })
    : { data: [] as Comment[] };

  const commentsByProfile = new Map<string, Comment[]>();
  for (const c of (allComments ?? []) as Comment[]) {
    const list = commentsByProfile.get(c.linkedin_profile_id) ?? [];
    list.push(c);
    commentsByProfile.set(c.linkedin_profile_id, list);
  }

  function commentsFor(
    profileId: string,
    section: string | null,
    itemIndex: number | null
  ) {
    return (commentsByProfile.get(profileId) ?? []).filter(
      (c) => c.section === section && c.item_index === itemIndex
    );
  }

  const latest = linkedinProfiles?.[0];
  const analysis = latest?.linkedin_analysis as LinkedinAnalysis | null | undefined;

  const sections: Array<keyof LinkedinAnalysis> = [
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
            <p className="text-3xl font-semibold text-slate-900">
              {latest.linkedin_score ?? "—"}
              <span className="text-sm font-normal text-slate-400">
                /100 LinkedIn Score
              </span>
            </p>
            {analysis?.resumen && (
              <p className="mt-2 text-sm text-slate-600">{analysis.resumen}</p>
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
                          <LinkedinCommentThread
                            linkedinProfileId={latest.id}
                            coachId={coachId}
                            section={section}
                            itemIndex={i}
                            comments={commentsFor(latest.id, section, i)}
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
                Comentario general del perfil
              </h4>
              <LinkedinCommentThread
                linkedinProfileId={latest.id}
                coachId={coachId}
                section={null}
                itemIndex={null}
                comments={commentsFor(latest.id, null, null)}
                placeholder="Feedback general sobre el perfil de LinkedIn..."
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
