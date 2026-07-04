import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateAdminForm from "../create-admin-form";
import AdminCard from "../admin-card";

export default async function AdminAdministradoresSubPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role, is_super_admin")
    .eq("id", user.id)
    .single();

  if (myProfile?.role !== "administrador") {
    redirect("/dashboard");
  }

  const isSuperAdmin = Boolean(myProfile.is_super_admin);

  const { data: admins } = await supabase
    .from("profiles")
    .select("id, full_name, email, is_super_admin")
    .eq("role", "administrador")
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Administradores
      </h1>

      <div className="mt-6 rounded-2xl border border-purple-200 bg-purple-50 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-purple-900">
            Administradores ({admins?.length ?? 0})
          </h2>
          <CreateAdminForm />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {(admins ?? []).map((a) => (
            <AdminCard key={a.id} admin={a} canDelete={isSuperAdmin} />
          ))}
        </div>
        {!isSuperAdmin && (
          <p className="mt-3 text-xs text-purple-700">
            Solo el administrador principal puede eliminar cuentas de
            administrador. Tú puedes crear administradores, coaches y
            usuarios, y eliminar coaches y usuarios.
          </p>
        )}
      </div>
    </div>
  );
}
