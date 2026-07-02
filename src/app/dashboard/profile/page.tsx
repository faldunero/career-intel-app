import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProfileForm from "./profile-form";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Tu perfil profesional
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Estos datos son la base de tu diagnóstico: Career Score, matching
        de vacantes y recomendaciones se calculan a partir de aquí.
      </p>

      <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-blue-900">
              Perfil de LinkedIn
            </h2>
            <p className="mt-1 text-xs text-blue-800">
              Sube tu perfil exportado en PDF para compararlo con tu CV
              y calcular tu LinkedIn Score.
            </p>
          </div>
          <Link
            href="/dashboard/linkedin"
            className="shrink-0 rounded-lg bg-blue-900 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-800"
          >
            Analizar LinkedIn
          </Link>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <ProfileForm userId={user.id} initialProfile={profile} />
      </div>
    </div>
  );
}
