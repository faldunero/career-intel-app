import { redirect } from "next/navigation";
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
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-slate-500">Career Intelligence AI</p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Tu perfil profesional
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Estos datos son la base de tu diagnóstico: Career Score, matching
          de vacantes y recomendaciones se calculan a partir de aquí.
        </p>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <ProfileForm userId={user.id} initialProfile={profile} />
        </div>
      </div>
    </main>
  );
}
