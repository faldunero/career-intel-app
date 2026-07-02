import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "./logout-button";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Leemos el perfil desde la tabla `profiles` (se crea automáticamente
  // vía trigger al registrarse, ver supabase/migrations/0001_init.sql)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || user.email;

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-500">Career Intelligence AI</p>
            <h1 className="text-2xl font-semibold text-slate-900">
              Hola, {displayName} 👋
            </h1>
          </div>
          <LogoutButton />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">
            Fase 0 completa ✅
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Estás autenticado y esta página está protegida por el
            middleware de Supabase. Tu rol actual es{" "}
            <span className="font-medium">{profile?.role ?? "usuario"}</span>.
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Próximo paso (Fase 1): formulario de perfil profesional
            (profesión, industria, seniority, cargo objetivo, etc.).
          </p>
        </div>
      </div>
    </main>
  );
}
