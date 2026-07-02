import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "./sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || user.email || "Usuario";
  const role = profile?.role ?? "usuario";

  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} displayName={displayName} />
      <main className="flex-1 overflow-y-auto bg-slate-50 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
