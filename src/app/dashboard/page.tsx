import { redirect } from "next/navigation";
import Link from "next/link";
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
    .select("full_name, role, profile_completed")
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

        <div className="mt-8 flex flex-col gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-slate-900">
                  Perfil profesional
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  {profile?.profile_completed
                    ? "Tu perfil está completo. Puedes actualizarlo cuando quieras."
                    : "Aún no completas tu perfil profesional. Es la base para tu diagnóstico, ATS score y matching de vacantes."}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                  profile?.profile_completed
                    ? "bg-green-100 text-green-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {profile?.profile_completed ? "Completo" : "Pendiente"}
              </span>
            </div>
            <Link
              href="/dashboard/profile"
              className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              {profile?.profile_completed
                ? "Editar perfil"
                : "Completar perfil"}
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-medium text-slate-900">Tu CV</h2>
            <p className="mt-1 text-sm text-slate-600">
              Sube tu CV en PDF o Word para comenzar el análisis.
            </p>
            <Link
              href="/dashboard/cv"
              className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Subir / ver CV
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm text-slate-500">
              Próximo paso (Fase 3): primer análisis con IA (ATS Score)
              sobre el texto de tu CV.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
