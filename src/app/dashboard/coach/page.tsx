import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function CoachPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (myProfile?.role !== "coach" && myProfile?.role !== "administrador") {
    redirect("/dashboard");
  }

  const { data: assignments } = await supabase
    .from("coach_assignments")
    .select(
      "user_id, profiles:user_id (id, full_name, email, profile_completed, career_score)"
    )
    .eq("coach_id", user.id);

  const assigned = assignments ?? [];

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/dashboard"
          className="text-sm text-slate-500 underline hover:text-slate-800"
        >
          ← Volver al dashboard
        </Link>
        <p className="mt-3 text-sm text-slate-500">Career Intelligence AI</p>
        <h1 className="text-2xl font-semibold text-slate-900">
          Mis usuarios asignados
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {assigned.length} usuario{assigned.length !== 1 ? "s" : ""}{" "}
          asignado{assigned.length !== 1 ? "s" : ""}.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          {assigned.length === 0 && (
            <p className="text-sm text-slate-500">
              Todavía no tienes usuarios asignados. Pídele a un
              administrador que te asigne alguno.
            </p>
          )}
          {assigned.map((a) => {
            const p = Array.isArray(a.profiles) ? a.profiles[0] : a.profiles;
            if (!p) return null;
            return (
              <Link
                key={a.user_id}
                href={`/dashboard/coach/${a.user_id}`}
                className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {p.full_name ?? p.email ?? "Usuario sin nombre"}
                  </p>
                  <p className="text-xs text-slate-500">{p.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      p.profile_completed
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {p.profile_completed ? "Perfil completo" : "Pendiente"}
                  </span>
                  {p.career_score !== null && (
                    <span className="text-xs text-slate-500">
                      Score: {p.career_score}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
