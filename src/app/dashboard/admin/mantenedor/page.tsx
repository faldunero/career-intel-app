import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AccountsMaintainer from "./accounts-maintainer";

export default async function MantenedorPage() {
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

  const { data: accounts } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, is_super_admin, created_at")
    .eq("is_test_data", false)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Mantenedor de cuentas
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Elimina cuentas reales (no de prueba) individualmente o en
        bloque. El administrador principal nunca aparece habilitado
        para eliminar, y tampoco puedes eliminar tu propia cuenta desde
        aquí.
      </p>

      <div className="mt-6">
        <AccountsMaintainer accounts={accounts ?? []} currentAdminId={user.id} />
      </div>
    </div>
  );
}
