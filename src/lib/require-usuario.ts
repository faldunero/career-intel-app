import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireUsuario() {
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

  // Estas páginas son herramientas de búsqueda de empleo, propias del
  // rol "usuario". Un admin o coach no debería poder usarlas (aunque
  // tenga datos viejos de cuando era usuario, o entre por URL directa).
  if (profile?.role === "administrador") {
    redirect("/dashboard/admin");
  }
  if (profile?.role === "coach") {
    redirect("/dashboard/coach");
  }

  return { supabase, user };
}
