import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SecurityClient from "./security-client";

export default async function SecurityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  // El usuario final no puede desactivar el 2FA — es obligatorio.
  // Admin y coach sí pueden.
  const canDisable = profile?.role !== "usuario";

  return <SecurityClient canDisable={canDisable} />;
}
