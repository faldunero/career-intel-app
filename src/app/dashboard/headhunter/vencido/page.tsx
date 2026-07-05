import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function HeadhunterExpiredPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "headhunter") redirect("/dashboard");

  return (
    <div className="mx-auto max-w-md text-center">
      <h1 className="mt-16 text-2xl font-semibold text-slate-900">
        Tu acceso venció
      </h1>
      <p className="mt-3 text-sm text-slate-500">
        El período de acceso que te aprobó el administrador ya terminó.
        Para seguir consultando la base de candidatos, tienes que enviar
        una nueva solicitud.
      </p>
      <Link
        href="/solicitar-acceso-headhunter"
        className="mt-6 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
      >
        Solicitar acceso nuevamente
      </Link>
    </div>
  );
}
