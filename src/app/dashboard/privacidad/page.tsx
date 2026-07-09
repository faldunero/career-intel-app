import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExportDataCard from "./export-data-card";
import { HeadhunterVisibilityCard, SelfDeleteAccountCard } from "./usuario-sections";
import { NoteVisibilityInfoCard, CoachOffboardingCard } from "./coach-sections";

export default async function PrivacyRightsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "usuario";

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Privacidad</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gestiona tus datos personales, de acuerdo a la{" "}
        <Link href="/privacidad" target="_blank" className="underline">
          Política de Privacidad
        </Link>
        .
      </p>

      {role === "usuario" && (
        <>
          <div className="mt-6">
            <ExportDataCard description="Descarga una copia de todos los datos personales asociados a tu cuenta — tu perfil, CVs, LinkedIn, matching, oportunidades, tareas, calendario, entrevistas y herramientas psicolaborales, incluyendo los comentarios y notas que tu coach haya dejado sobre ti — en formato JSON." />
          </div>
          <HeadhunterVisibilityCard />
          <SelfDeleteAccountCard />
        </>
      )}

      {role === "coach" && (
        <>
          <div className="mt-6">
            <ExportDataCard description="Descarga una copia de tus datos personales — tu perfil y todo el contenido que tú escribiste: notas de seguimiento, tareas que asignaste y comentarios en CV, LinkedIn, Matching, CRM, Calendario, Entrevistas y Psicolaboral — en formato JSON." />
          </div>
          <NoteVisibilityInfoCard />
          <CoachOffboardingCard />
        </>
      )}

      {(role === "administrador" || role === "headhunter") && (
        <>
          <div className="mt-6">
            <ExportDataCard description="Descarga una copia de tu perfil y tus datos de cuenta en formato JSON." />
          </div>
          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <h2 className="text-lg font-medium text-slate-900">
              Otros derechos sobre tus datos
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Para rectificar, eliminar tu cuenta, o ejercer cualquier
              otro derecho sobre tus datos personales, contacta a un
              administrador de la plataforma.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
