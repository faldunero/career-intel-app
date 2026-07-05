import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import GeneratorPanel from "./generator-panel";

export default async function TestDataPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (myProfile?.role !== "administrador") redirect("/dashboard");

  const { data: testProfiles } = await supabase
    .from("profiles")
    .select("role")
    .eq("is_test_data", true);

  const all = testProfiles ?? [];
  const counts = {
    coaches: all.filter((p) => p.role === "coach").length,
    users: all.filter((p) => p.role === "usuario").length,
    headhunters: all.filter((p) => p.role === "headhunter").length,
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Datos de prueba
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Genera un set de cuentas ficticias para probar el sistema
        (coaches, usuarios, headhunters), y elimínalas todas de una vez
        cuando termines.
      </p>

      <div className="mt-6">
        <GeneratorPanel counts={counts} />
      </div>
    </div>
  );
}
