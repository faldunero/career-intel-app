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
    .select("full_name, role, career_score")
    .eq("id", user.id)
    .single();

  const displayName = profile?.full_name || user.email || "Usuario";
  const role = profile?.role ?? "usuario";

  // Badges tipo "hay algo nuevo" — solo lo que representa información
  // pendiente real, no un contador de todo lo que existe.
  const badges: Record<string, number> = {};

  if (role === "usuario") {
    const { count: pendingTasks } = await supabase
      .from("coach_tasks")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .neq("status", "completada");

    const { count: newInterviews } = await supabase
      .from("interview_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "disponible");

    if (pendingTasks) badges["/dashboard/tasks"] = pendingTasks;
    if (newInterviews) badges["/dashboard/interview"] = newInterviews;
  }

  if (role === "coach") {
    const { data: myCompletedSessions } = await supabase
      .from("interview_sessions")
      .select("id")
      .eq("coach_id", user.id)
      .eq("status", "completada");

    if (myCompletedSessions && myCompletedSessions.length > 0) {
      const sessionIds = myCompletedSessions.map((s) => s.id);
      const { data: commentedSessions } = await supabase
        .from("interview_comments")
        .select("session_id")
        .in("session_id", sessionIds);

      const commentedSet = new Set(
        (commentedSessions ?? []).map((c) => c.session_id)
      );
      const uncommented = sessionIds.filter((id) => !commentedSet.has(id));
      if (uncommented.length > 0) {
        badges["/dashboard/coach"] = uncommented.length;
      }
    }
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        role={role}
        displayName={displayName}
        careerScore={profile?.career_score ?? null}
        badges={badges}
      />
      <main className="flex-1 overflow-y-auto bg-slate-50 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
