import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim() ?? "";

  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const { data: myProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = myProfile?.role;
  const results: { label: string; sublabel: string; href: string }[] = [];

  if (role === "administrador") {
    const { data: matches } = await supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .limit(8);

    for (const m of matches ?? []) {
      const hrefByRole: Record<string, string> = {
        administrador: "/dashboard/admin/administradores",
        coach: "/dashboard/admin/coaches",
        usuario: "/dashboard/admin/usuarios",
      };
      results.push({
        label: m.full_name ?? m.email ?? "Sin nombre",
        sublabel: `${m.role} · ${m.email ?? ""}`,
        href: hrefByRole[m.role] ?? "/dashboard/admin",
      });
    }
  } else if (role === "coach") {
    // RLS ya restringe esto a los usuarios asignados a este coach.
    const { data: matches } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .or(`full_name.ilike.%${q}%,email.ilike.%${q}%`)
      .eq("role", "usuario")
      .limit(8);

    for (const m of matches ?? []) {
      results.push({
        label: m.full_name ?? m.email ?? "Sin nombre",
        sublabel: m.email ?? "",
        href: `/dashboard/coach/${m.id}`,
      });
    }
  } else {
    // Usuario: busca dentro de sus propias oportunidades y tareas.
    const [opps, tasks] = await Promise.all([
      supabase
        .from("opportunities")
        .select("id, job_title, company")
        .eq("user_id", user.id)
        .or(`job_title.ilike.%${q}%,company.ilike.%${q}%`)
        .limit(5),
      supabase
        .from("coach_tasks")
        .select("id, title")
        .eq("user_id", user.id)
        .ilike("title", `%${q}%`)
        .limit(5),
    ]);

    for (const o of opps.data ?? []) {
      results.push({
        label: o.job_title ?? "Oportunidad",
        sublabel: o.company ?? "",
        href: "/dashboard/opportunities",
      });
    }
    for (const t of tasks.data ?? []) {
      results.push({
        label: t.title,
        sublabel: "Tarea",
        href: "/dashboard/tasks",
      });
    }
  }

  return NextResponse.json({ results });
}
