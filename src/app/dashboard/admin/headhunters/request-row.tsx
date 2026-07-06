"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Request = {
  id: string;
  full_name: string;
  email: string;
  company: string;
  phone: string | null;
  message: string | null;
  status: "pendiente" | "aprobada" | "rechazada";
  access_duration_days: number | null;
  reviewed_at: string | null;
  created_at: string;
  is_test_data?: boolean;
  headhunter_user_id?: string | null;
  current_expiry?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  aprobada: "Aprobada",
  rechazada: "Rechazada",
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  aprobada: "bg-green-100 text-green-700",
  rechazada: "bg-red-100 text-red-700",
};

export default function RequestRow({ request }: { request: Request }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState(30);
  const [extendDays, setExtendDays] = useState(30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const expired =
    request.current_expiry !== null &&
    request.current_expiry !== undefined &&
    new Date(request.current_expiry) <= new Date();

  async function handleApprove() {
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/headhunters/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id, accessDurationDays: days }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Error al aprobar");
      return;
    }
    router.refresh();
  }

  async function handleReject() {
    if (!confirm(`¿Rechazar la solicitud de ${request.full_name}?`)) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/headhunters/reject", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId: request.id }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Error al rechazar");
      return;
    }
    router.refresh();
  }

  async function handleExtend() {
    if (!request.headhunter_user_id) return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/headhunters/extend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: request.headhunter_user_id, days: extendDays }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Error al extender");
      return;
    }
    router.refresh();
  }

  async function handleRevoke() {
    if (!request.headhunter_user_id) return;
    if (
      !confirm(
        `¿Revocar el acceso de ${request.full_name} ahora mismo? La cuenta sigue existiendo, pero pierde acceso de inmediato.`
      )
    )
      return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/headhunters/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: request.headhunter_user_id }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Error al revocar");
      return;
    }
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (!request.headhunter_user_id) return;
    if (
      !confirm(
        `¿Eliminar por completo la cuenta de ${request.full_name}? Esto no se puede deshacer.`
      )
    )
      return;
    setSaving(true);
    setError(null);
    const res = await fetch("/api/admin/accounts/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [request.headhunter_user_id] }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok || data.skipped?.length > 0) {
      setError(data.error ?? data.skipped?.[0]?.reason ?? "Error al eliminar");
      return;
    }
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-900">
            {request.full_name} — {request.company}
            {request.is_test_data && (
              <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                TEST
              </span>
            )}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {request.email} · Solicitada el{" "}
            {new Date(request.created_at).toLocaleDateString("es-CL")}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {request.status === "aprobada" && expired && (
            <span className="rounded-full bg-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600">
              Acceso vencido
            </span>
          )}
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLORS[request.status]}`}
          >
            {STATUS_LABELS[request.status]}
          </span>
          <span
            className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
          >
            ›
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          {request.phone && (
            <p className="text-xs text-slate-500">Teléfono: {request.phone}</p>
          )}
          {request.message && (
            <p className="mt-2 text-sm text-slate-600">
              &ldquo;{request.message}&rdquo;
            </p>
          )}

          {request.status === "pendiente" && (
            <div className="mt-4 flex flex-wrap items-end gap-3 border-t border-slate-100 pt-4">
              <div>
                <label className="text-xs font-medium text-slate-600">
                  Días de acceso
                </label>
                <input
                  type="number"
                  min={1}
                  value={days}
                  onChange={(e) => setDays(Number(e.target.value))}
                  className="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-900"
                />
              </div>
              <button
                onClick={handleApprove}
                disabled={saving}
                className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? "Procesando..." : "Aprobar y crear cuenta"}
              </button>
              <button
                onClick={handleReject}
                disabled={saving}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Rechazar
              </button>
            </div>
          )}

          {request.status === "aprobada" && request.headhunter_user_id && (
            <div className="mt-4 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">
                Acceso {expired ? "venció" : "vigente hasta"} el{" "}
                {request.current_expiry
                  ? new Date(request.current_expiry).toLocaleDateString("es-CL")
                  : "—"}
              </p>
              <div className="mt-3 flex flex-wrap items-end gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-600">
                    Extender por (días)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={extendDays}
                    onChange={(e) => setExtendDays(Number(e.target.value))}
                    className="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-slate-900"
                  />
                </div>
                <button
                  onClick={handleExtend}
                  disabled={saving}
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  Extender acceso
                </button>
                {!expired && (
                  <button
                    onClick={handleRevoke}
                    disabled={saving}
                    className="rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                  >
                    Revocar acceso ahora
                  </button>
                )}
                <button
                  onClick={handleDeleteAccount}
                  disabled={saving}
                  className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                >
                  Eliminar cuenta
                </button>
              </div>
            </div>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
