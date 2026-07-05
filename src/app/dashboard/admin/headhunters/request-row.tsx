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
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            <p className="text-xs text-slate-500">
              Teléfono: {request.phone}
            </p>
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

          {request.status === "aprobada" && request.access_duration_days && (
            <p className="mt-3 text-xs text-slate-500">
              Aprobada con {request.access_duration_days} días de acceso, el{" "}
              {request.reviewed_at
                ? new Date(request.reviewed_at).toLocaleDateString("es-CL")
                : "—"}
              .
            </p>
          )}

          {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
