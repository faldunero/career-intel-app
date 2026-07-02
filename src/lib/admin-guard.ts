import { createClient } from "@/lib/supabase/server";

export async function requireAdmin(opts?: { requireSuperAdmin?: boolean }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, status: 401, error: "No autenticado" };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, is_super_admin")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "administrador") {
    return {
      ok: false as const,
      status: 403,
      error: "Solo un administrador puede hacer esto",
    };
  }

  if (opts?.requireSuperAdmin && !profile.is_super_admin) {
    return {
      ok: false as const,
      status: 403,
      error: "Solo el administrador principal puede hacer esto",
    };
  }

  return { ok: true as const, adminId: user.id };
}
