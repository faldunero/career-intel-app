import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// ADVERTENCIA: este cliente usa la SECRET KEY de Supabase y se salta
// TODAS las políticas de RLS. Nunca lo importes en un componente
// "use client", y nunca lo uses sin verificar antes, en el propio
// código del servidor, que quien hace la petición es realmente un
// administrador (ver ejemplo en las API routes de /api/admin/*).
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const secretKey = process.env.SUPABASE_SECRET_KEY!;

  if (!secretKey) {
    throw new Error(
      "Falta SUPABASE_SECRET_KEY en las variables de entorno del servidor"
    );
  }

  return createSupabaseClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
