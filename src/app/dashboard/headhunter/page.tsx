import Link from "next/link";
import { requireHeadhunter } from "@/lib/require-headhunter";

export default async function HeadhunterSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; industry?: string; cargo?: string }>;
}) {
  const { supabase } = await requireHeadhunter();
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const industry = params.industry?.trim() ?? "";
  const cargo = params.cargo?.trim() ?? "";

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, current_position, target_role, industry, seniority, city, country, career_score"
    )
    .eq("visible_to_headhunters", true)
    .eq("role", "usuario");

  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,current_position.ilike.%${q}%,target_role.ilike.%${q}%`
    );
  }
  if (industry) {
    query = query.ilike("industry", `%${industry}%`);
  }
  if (cargo) {
    query = query.or(
      `current_position.ilike.%${cargo}%,target_role.ilike.%${cargo}%`
    );
  }

  const { data: candidates } = await query.order("career_score", {
    ascending: false,
    nullsFirst: false,
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Buscar candidatos
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Solo se muestran perfiles que el propio candidato marcó como
        visibles para headhunters.
      </p>

      <form
        method="get"
        className="mt-6 flex flex-wrap gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Nombre o cargo..."
          className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <input
          type="text"
          name="industry"
          defaultValue={industry}
          placeholder="Rubro (ej: Tecnología)"
          className="min-w-40 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <input
          type="text"
          name="cargo"
          defaultValue={cargo}
          placeholder="Cargo (ej: Gerente TI)"
          className="min-w-40 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <button
          type="submit"
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          Buscar
        </button>
      </form>

      <p className="mt-4 text-sm text-slate-500">
        {candidates?.length ?? 0} candidato{candidates?.length !== 1 ? "s" : ""}{" "}
        encontrado{candidates?.length !== 1 ? "s" : ""}
      </p>

      <div className="mt-3 flex flex-col gap-3">
        {(candidates ?? []).map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/headhunter/${c.id}`}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 transition hover:border-slate-300"
          >
            <div>
              <p className="text-sm font-medium text-slate-900">
                {c.full_name ?? "Candidato"}
              </p>
              <p className="text-xs text-slate-500">
                {c.current_position ?? c.target_role ?? "Cargo no especificado"}
                {c.industry ? ` · ${c.industry}` : ""}
                {c.city ? ` · ${c.city}` : ""}
              </p>
            </div>
            {c.career_score !== null && (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                Score: {c.career_score}
              </span>
            )}
          </Link>
        ))}

        {(candidates ?? []).length === 0 && (
          <p className="text-sm text-slate-400">
            No hay candidatos que calcen con esa búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}
