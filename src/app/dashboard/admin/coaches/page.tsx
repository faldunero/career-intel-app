import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateCoachForm from "../create-coach-form";
import CoachCard from "../coach-card";

export default async function AdminCoachesPage() {
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

  if (myProfile?.role !== "administrador") {
    redirect("/dashboard");
  }

  const { data: coaches } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "coach")
    .order("created_at", { ascending: false });

  const { data: assignments } = await supabase
    .from("coach_assignments")
    .select("coach_id");

  const coachCounts = new Map<string, number>();
  for (const a of assignments ?? []) {
    coachCounts.set(a.coach_id, (coachCounts.get(a.coach_id) ?? 0) + 1);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">Coaches</h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-slate-900">
            Coaches ({coaches?.length ?? 0})
          </h2>
          <CreateCoachForm />
        </div>
        <div className="mt-4 flex flex-col gap-2">
          {(!coaches || coaches.length === 0) && (
            <p className="text-sm text-slate-500">
              No hay coaches todavía. Crea el primero con el botón de
              arriba.
            </p>
          )}
          {(coaches ?? []).map((c) => (
            <CoachCard
              key={c.id}
              coach={c}
              assignedCount={coachCounts.get(c.id) ?? 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
