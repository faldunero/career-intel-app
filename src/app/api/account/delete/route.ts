import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const admin = createAdminClient();

  // Borra el usuario de auth.users. Todas las tablas relacionadas
  // (profiles, cvs, opportunities, interview_sessions, etc.) se borran
  // en cascada por las referencias "on delete cascade" ya definidas.

  // Intenta eliminar el usuario con reintentos automáticos
  let deleteError = null;
  const maxRetries = 3;
  const baseDelay = 1000;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const { error } = await admin.auth.admin.deleteUser(user.id);

    if (!error) {
      deleteError = null;
      break;
    }

    if (attempt === maxRetries - 1) {
      deleteError = error;
      break;
    }

    const delay = baseDelay * Math.pow(2, attempt);
    console.log(
      `account-delete: reintentando deleteUser (intento ${attempt + 1}/${maxRetries})`,
      error
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  if (deleteError) {
    console.error("account-delete: falló deleteUser", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
