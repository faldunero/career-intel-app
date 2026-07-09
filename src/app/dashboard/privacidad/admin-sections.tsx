import Link from "next/link";

export function AdminArcoLinkCard() {
  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-slate-900">
        Solicitudes ARCO+ — Ley 21.719
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Como administrador, tú eres quien gestiona las solicitudes de
        Acceso, Rectificación, Cancelación, Oposición, Portabilidad y
        Bloqueo que lleguen fuera del autoservicio (por ejemplo, por
        correo directo). La ley exige responder dentro de 30 días
        desde recibida cada solicitud.
      </p>
      <Link
        href="/dashboard/admin/arco"
        className="mt-4 inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        Ir al panel de solicitudes
      </Link>
    </div>
  );
}
