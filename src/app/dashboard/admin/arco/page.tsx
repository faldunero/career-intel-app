import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import NewArcoRequestForm from "./new-arco-request-form";
import ArcoRequestsTable from "./arco-requests-table";

export default async function ArcoRequestsPage() {
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
    .from("arco_requests")
    .select(
      "id, request_type, requester_name, requester_email, target_user_id, description, status, received_at, due_at, resolved_at, resolution_notes, target:profiles!target_user_id(full_name, email)"
    )
    .order("due_at", { ascending: true });

  const { data: usuarios } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "usuario")
    .order("full_name");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Solicitudes ARCO+ — Ley 21.719
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Registro auditable de solicitudes de Acceso, Rectificación,
        Cancelación, Oposición, Portabilidad y Bloqueo recibidas fuera
        del autoservicio (por ejemplo, por correo). La ley exige
        responder dentro de 30 días desde recibida cada solicitud.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Registrar nueva solicitud
        </h2>
        <div className="mt-3">
          <NewArcoRequestForm usuarios={usuarios ?? []} adminId={user.id} />
        </div>
      </div>

      <div className="mt-6">
        <ArcoRequestsTable requests={requests ?? []} adminId={user.id} />
      </div>
    </div>
  );
}
