import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ExportDataCard from "./export-data-card";
import { HeadhunterVisibilityCard, SelfDeleteAccountCard } from "./usuario-sections";
import { NoteVisibilityInfoCard } from "./coach-sections";
import { AdminArcoLinkCard } from "./admin-sections";
import { HeadhunterAccessInfoCard, HeadhunterOffboardingCard } from "./headhunter-sections";
import RequestDeletionCard from "./request-deletion-card";

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
    .select("role, full_name, headhunter_access_expires_at")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? "usuario";
  const userName = profile?.full_name ?? user.email ?? "—";

  let existingDeletionRequest = null;
  if (role === "coach" || role === "administrador" || role === "headhunter") {
    const { data } = await supabase
      .from("arco_requests")
      .select("id, status, received_at, due_at")
      .eq("target_user_id", user.id)
      .eq("request_type", "cancelacion")
      .order("received_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    existingDeletionRequest = data;
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Privacidad — Ley 21.719
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Tus derechos sobre tus datos personales bajo la Ley 21.719 de
        Protección de Datos Personales, de acuerdo a nuestra{" "}
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
          <RequestDeletionCard
            userId={user.id}
            userName={userName}
            userEmail={user.email ?? ""}
            existingRequest={existingDeletionRequest}
            contextNote="Tu cuenta está vinculada a los usuarios que acompañas, así que no se elimina al instante — un administrador la revisa antes de ejecutarla, para asegurarse de que tus usuarios queden bien cubiertos."
          />
        </>
      )}

      {role === "administrador" && (
        <>
          <div className="mt-6">
            <ExportDataCard description="Descarga una copia de tu perfil y tus datos de cuenta en formato JSON." />
          </div>
          <AdminArcoLinkCard />
          <RequestDeletionCard
            userId={user.id}
            userName={userName}
            userEmail={user.email ?? ""}
            existingRequest={existingDeletionRequest}
            contextNote="Como administrador, tu solicitud la debe resolver otro administrador (o el superadmin) — no puedes aprobarte tu propia baja."
          />
        </>
      )}

      {role === "headhunter" && (
        <>
          <div className="mt-6">
            <ExportDataCard description="Descarga una copia de tu perfil, tu solicitud de acceso y tu historial de descargas de CV en formato JSON." />
          </div>
          <HeadhunterAccessInfoCard
            expiresAt={profile?.headhunter_access_expires_at ?? null}
          />
          <RequestDeletionCard
            userId={user.id}
            userName={userName}
            userEmail={user.email ?? ""}
            existingRequest={existingDeletionRequest}
            contextNote="Tu acceso lo gestiona un administrador, así que la baja también pasa por ahí en vez de ser instantánea."
          />
          <HeadhunterOffboardingCard />
        </>
      )}
    </div>
  );
}
