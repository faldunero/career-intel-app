import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function getCoachViewedUser(userId: string) {
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

  if (myProfile?.role !== "coach") {
    redirect("/dashboard");
  }

  // RLS ya restringe esto a usuarios asignados a este coach.
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single();

  if (!profile) {
    notFound();
  }

  return { supabase, coachId: user.id, profile };
}
