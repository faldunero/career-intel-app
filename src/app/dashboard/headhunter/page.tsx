import Link from "next/link";
import { requireHeadhunter } from "@/lib/require-headhunter";

export default async function HeadhunterSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ nombre?: string; cargo?: string; rubro?: string; ciudad?: string; seniority?: string }>;
}) {
  const { supabase } = await requireHeadhunter();
  const params = await searchParams;
  const nombre = params.nombre?.trim() ?? "";
  const cargo = params.cargo?.trim() ?? "";
  const rubro = params.rubro?.trim() ?? "";
  const ciudad = params.ciudad?.trim() ?? "";
  const seniority = params.seniority?.trim() ?? "";

  let query = supabase
    .from("profiles")
    .select(
      "id, full_name, current_position, target_role, industry, seniority, city, country, career_score"
    )
    .eq("visible_to_headhunters", true)
    .eq("role", "usuario");

  // Filtro por nombre (busca en nombre completo)
  if (nombre) {
    query = query.ilike("full_name", `%${nombre}%`);
  }

  // Filtro por cargo (busca en cargo actual Y cargo objetivo)
  if (cargo) {
    query = query.or(
      `current_position.ilike.%${cargo}%,target_role.ilike.%${cargo}%`
    );
  }

  // Filtro por rubro/industria
  if (rubro) {
    query = query.ilike("industry", `%${rubro}%`);
  }

  // Filtro por ciudad
  if (ciudad) {
    query = query.ilike("city", `%${ciudad}%`);
  }

  // Filtro por seniority (nivel de experiencia)
  if (seniority) {
    query = query.eq("seniority", seniority);
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
        className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Nombre del candidato
            </label>
            <input
              type="text"
              name="nombre"
              defaultValue={nombre}
              placeholder="ej: Juan Pérez"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Cargo (actual o objetivo)
            </label>
            <input
              type="text"
              name="cargo"
              defaultValue={cargo}
              placeholder="ej: Gerente TI"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Rubro/Industria
            </label>
            <input
              type="text"
              name="rubro"
              defaultValue={rubro}
              placeholder="ej: Tecnología, Finanzas"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Ciudad
            </label>
            <input
              type="text"
              name="ciudad"
              defaultValue={ciudad}
              placeholder="ej: Santiago, Buenos Aires"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-slate-600">
              Nivel de experiencia
            </label>
            <select
              name="seniority"
              defaultValue={seniority}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
            >
              <option value="">Cualquiera</option>
              <option value="junior">Junior (0-2 años)</option>
              <option value="mid">Pleno (2-5 años)</option>
              <option value="senior">Senior (5-10 años)</option>
              <option value="lead">Lead (10+ años)</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 md:w-auto"
        >
          Buscar candidatos
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
