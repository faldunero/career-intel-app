import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CreateCoachForm from "../create-coach-form";
import CoachesList from "../coaches-list";

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
    .select("id, full_name, email, is_test_data")
    .eq("role", "coach")
    .order("created_at", { ascending: false });

  const { data: assignments } = await supabase
    .from("coach_assignments")
    .select("coach_id");

  const coachCounts: Record<string, number> = {};
  for (const a of assignments ?? []) {
    coachCounts[a.coach_id] = (coachCounts[a.coach_id] ?? 0) + 1;
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
        <div className="mt-4">
          <CoachesList coaches={coaches ?? []} coachCounts={coachCounts} />
        </div>
      </div>
    </div>
  );
}
