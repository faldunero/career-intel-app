import { requireHeadhunter } from "@/lib/require-headhunter";

export default async function MiAccesoPage() {
  const { profile } = await requireHeadhunter();

  const expiresAt = profile.headhunter_access_expires_at
    ? new Date(profile.headhunter_access_expires_at)
    : null;
  const daysLeft = expiresAt
    ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Mi acceso</h1>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-slate-500">Empresa</p>
        <p className="text-base font-medium text-slate-900">
          {profile.headhunter_company ?? "—"}
        </p>

        <div className="mt-4 border-t border-slate-100 pt-4">
          <p className="text-sm text-slate-500">Acceso vigente hasta</p>
          <p className="text-base font-medium text-slate-900">
            {expiresAt ? expiresAt.toLocaleDateString("es-CL") : "—"}
          </p>
          {daysLeft !== null && (
            <p
              className={`mt-1 text-xs ${daysLeft <= 7 ? "text-amber-600" : "text-slate-400"}`}
            >
              {daysLeft > 0
                ? `Quedan ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`
                : "Vencido"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
