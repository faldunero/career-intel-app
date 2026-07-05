import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireHeadhunter() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, headhunter_access_expires_at, headhunter_company, full_name")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "headhunter") {
    redirect("/dashboard");
  }

  const expiresAt = profile.headhunter_access_expires_at;
  const expired = !expiresAt || new Date(expiresAt) <= new Date();

  if (expired) {
    redirect("/dashboard/headhunter/vencido");
  }

  return { supabase, user, profile };
}
