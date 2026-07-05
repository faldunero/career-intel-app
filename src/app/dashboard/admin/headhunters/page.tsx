import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RequestRow from "./request-row";

export default async function AdminHeadhuntersPage() {
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

  const { data: requests } = await supabase
    .from("headhunter_requests")
    .select("*")
    .order("created_at", { ascending: false });

  const all = requests ?? [];
  const pendientes = all.filter((r) => r.status === "pendiente");
  const revisadas = all.filter((r) => r.status !== "pendiente");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Solicitudes de headhunters
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Revisa y aprueba manualmente el acceso de headhunters a la base
        de candidatos. Al aprobar, se crea una cuenta con acceso por
        tiempo limitado.
      </p>

      <div className="mt-6 flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Pendientes ({pendientes.length})
        </h2>
        {pendientes.length === 0 && (
          <p className="text-sm text-slate-400">No hay solicitudes pendientes.</p>
        )}
        {pendientes.map((r) => (
          <RequestRow key={r.id} request={r} />
        ))}
      </div>

      {revisadas.length > 0 && (
        <div className="mt-8 flex flex-col gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Revisadas ({revisadas.length})
          </h2>
          {revisadas.map((r) => (
            <RequestRow key={r.id} request={r} />
          ))}
        </div>
      )}
    </div>
  );
}
