import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import MatchingForm from "./matching-form";

export default async function MatchingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: latestCv } = await supabase
    .from("cvs")
    .select("id, file_name")
    .eq("user_id", user.id)
    .eq("extraction_status", "done")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: matches } = await supabase
    .from("job_matches")
    .select(
      "id, job_title, company, matching_general, matching_ats, matching_tecnico, matching_liderazgo, matching_cultural, matching_experiencia, analysis, created_at"
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
        <h1 className="text-2xl font-semibold text-slate-900">
          Matching de vacantes
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Pega el texto completo de una oferta laboral y te decimos qué
          tan compatible eres, usando tu perfil y tu CV.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <MatchingForm
            hasCv={Boolean(latestCv)}
            cvFileName={latestCv?.file_name ?? null}
          />
        </div>

        {matches && matches.length > 0 && (
          <div className="mt-6 flex flex-col gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
              Historial
            </h2>
            {matches.map((m) => (
              <div
                key={m.id}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {m.job_title ?? "Cargo no identificado"}
                      {m.company ? ` — ${m.company}` : ""}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(m.created_at).toLocaleDateString("es-CL", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  {m.matching_general !== null && (
                    <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                      {m.matching_general}/100
                    </span>
                  )}
                </div>

                {m.analysis && (
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 sm:grid-cols-3">
                    <span>ATS: {m.matching_ats ?? "—"}</span>
                    <span>Técnico: {m.matching_tecnico ?? "—"}</span>
                    <span>Liderazgo: {m.matching_liderazgo ?? "N/A"}</span>
                    <span>Cultural: {m.matching_cultural ?? "—"}</span>
                    <span>Experiencia: {m.matching_experiencia ?? "—"}</span>
                  </div>
                )}

                {m.analysis?.brechas?.length > 0 && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Brechas
                    </h4>
                    <ul className="mt-1 list-disc pl-5 text-xs text-slate-600">
                      {m.analysis.brechas.map((b: string, i: number) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
