import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DownloadsTable from "./downloads-table";

export default async function DescargasCvPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "administrador") redirect("/dashboard");

  const { data: rows } = await supabase
    .from("headhunter_cv_downloads")
    .select(
      "id, downloaded_at, headhunter:profiles!headhunter_id(full_name, email, headhunter_company), candidate:profiles!candidate_user_id(full_name)"
    )
    .order("downloaded_at", { ascending: false });

  const downloads = (rows ?? []).map((r) => {
    const headhunter = Array.isArray(r.headhunter) ? r.headhunter[0] : r.headhunter;
    const candidate = Array.isArray(r.candidate) ? r.candidate[0] : r.candidate;
    return {
      id: r.id,
      downloaded_at: r.downloaded_at,
      headhunter_name: headhunter?.full_name ?? "—",
      headhunter_company: headhunter?.headhunter_company ?? null,
      headhunter_email: headhunter?.email ?? null,
      candidate_name: candidate?.full_name ?? "—",
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Descargas de CV por headhunters
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Registro de cada vez que un headhunter descargó (no solo
        previsualizó) el CV de un candidato.
      </p>

      <div className="mt-6">
        <DownloadsTable downloads={downloads} />
      </div>
    </div>
  );
}
