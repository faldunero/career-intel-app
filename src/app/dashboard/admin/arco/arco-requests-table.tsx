"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REQUEST_TYPE_LABELS: Record<string, string> = {
  acceso: "Acceso",
  rectificacion: "Rectificación",
  cancelacion: "Cancelación",
  oposicion: "Oposición",
  portabilidad: "Portabilidad",
  bloqueo: "Bloqueo",
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_proceso: "En proceso",
  resuelta: "Resuelta",
  rechazada: "Rechazada",
};

const STATUS_CLASS: Record<string, string> = {
  pendiente: "bg-amber-100 text-amber-700",
  en_proceso: "bg-blue-100 text-blue-700",
  resuelta: "bg-green-100 text-green-700",
  rechazada: "bg-slate-200 text-slate-600",
};

type Request = {
  id: string;
  request_type: string;
  requester_name: string;
  requester_email: string;
  target_user_id: string | null;
  description: string | null;
  status: string;
  received_at: string;
  due_at: string;
  resolved_at: string | null;
  resolution_notes: string | null;
  target: { full_name: string | null; email: string } | { full_name: string | null; email: string }[] | null;
};

function daysUntil(dueAt: string) {
  const diff = new Date(dueAt).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function RequestRow({ request, adminId }: { request: Request; adminId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState(request.status);
  const [notes, setNotes] = useState(request.resolution_notes ?? "");
  const [saving, setSaving] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const target = Array.isArray(request.target) ? request.target[0] : request.target;
  const days = daysUntil(request.due_at);
  const isOpen = request.status === "pendiente" || request.status === "en_proceso";
  const overdue = isOpen && days < 0;
  const dueSoon = isOpen && days >= 0 && days <= 5;
  const canExecuteDeletion =
    isOpen && request.request_type === "cancelacion" && !!request.target_user_id;

  async function handleSave() {
    setSaving(true);
    const isClosing = status === "resuelta" || status === "rechazada";
    const { error } = await supabase
      .from("arco_requests")
      .update({
        status,
        resolution_notes: notes || null,
        resolved_at: isClosing ? new Date().toISOString() : null,
        resolved_by: isClosing ? adminId : null,
      })
      .eq("id", request.id);
    setSaving(false);
    if (!error) {
      setOpen(false);
      router.refresh();
    }
  }

  async function handleExecuteDeletion() {
    if (confirmText !== "ELIMINAR") return;
    setDeleting(true);
    setDeleteError(null);

    const res = await fetch("/api/admin/accounts/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [request.target_user_id] }),
    });
    const data = await res.json();

    if (!res.ok) {
      setDeleting(false);
      setDeleteError(data.error ?? "No se pudo eliminar la cuenta");
      return;
    }

    if (data.skipped?.length > 0) {
      setDeleting(false);
      setDeleteError(data.skipped[0].reason);
      return;
    }

    // La cuenta se eliminó — deja la solicitud registrada como resuelta.
    const autoNote = `Cuenta eliminada por el administrador el ${new Date().toLocaleDateString("es-CL")}.`;
    await supabase
      .from("arco_requests")
      .update({
        status: "resuelta",
        resolution_notes: notes ? `${notes}\n\n${autoNote}` : autoNote,
        resolved_at: new Date().toISOString(),
        resolved_by: adminId,
      })
      .eq("id", request.id);

    setDeleting(false);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {REQUEST_TYPE_LABELS[request.request_type]}
            </span>
            <p className="truncate text-sm font-medium text-slate-900">
              {request.requester_name}
            </p>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            {request.requester_email}
            {target && ` · sobre ${target.full_name ?? target.email}`}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {overdue && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              Vencida hace {Math.abs(days)} día{Math.abs(days) !== 1 ? "s" : ""}
            </span>
          )}
          {!overdue && dueSoon && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
              Vence en {days} día{days !== 1 ? "s" : ""}
            </span>
          )}
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASS[request.status]}`}>
            {STATUS_LABELS[request.status]}
          </span>
          <span className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}>
            ›
          </span>
        </div>
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 pb-4 pt-3">
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-500 sm:grid-cols-4">
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-400">Recibida</p>
              <p className="mt-0.5 text-slate-700">
                {new Date(request.received_at).toLocaleDateString("es-CL")}
              </p>
            </div>
            <div>
              <p className="font-semibold uppercase tracking-wide text-slate-400">Vence (30 días)</p>
              <p className="mt-0.5 text-slate-700">
                {new Date(request.due_at).toLocaleDateString("es-CL")}
              </p>
            </div>
            {request.resolved_at && (
              <div>
                <p className="font-semibold uppercase tracking-wide text-slate-400">Resuelta</p>
                <p className="mt-0.5 text-slate-700">
                  {new Date(request.resolved_at).toLocaleDateString("es-CL")}
                </p>
              </div>
            )}
          </div>

          {request.description && (
            <p className="mt-3 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              {request.description}
            </p>
          )}

          {canExecuteDeletion && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-red-700">
                Ejecutar la eliminación
              </p>
              <p className="mt-1 text-xs text-red-700">
                Esto elimina la cuenta de{" "}
                {target?.full_name ?? target?.email ?? "este usuario"} de
                forma permanente e inmediata, y marca esta solicitud
                como resuelta automáticamente.
              </p>

              {!confirmingDelete ? (
                <button
                  onClick={() => setConfirmingDelete(true)}
                  className="mt-2 rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100"
                >
                  Eliminar cuenta ahora
                </button>
              ) : (
                <div className="mt-2 flex flex-col gap-2">
                  <label className="text-xs font-medium text-red-800">
                    Escribe ELIMINAR para confirmar
                  </label>
                  <input
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    className="w-full max-w-xs rounded-lg border border-red-300 px-3 py-1.5 text-sm outline-none"
                  />
                  {deleteError && (
                    <p className="text-xs text-red-700">{deleteError}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleExecuteDeletion}
                      disabled={deleting || confirmText !== "ELIMINAR"}
                      className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleting ? "Eliminando…" : "Confirmar eliminación permanente"}
                    </button>
                    <button
                      onClick={() => {
                        setConfirmingDelete(false);
                        setConfirmText("");
                        setDeleteError(null);
                      }}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-3 flex flex-col gap-2">
            <label className="text-xs font-medium text-slate-700">Estado</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-fit rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
            >
              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>

            <label className="mt-1 text-xs font-medium text-slate-700">
              Notas de resolución
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
              placeholder="Qué se hizo para resolver esta solicitud..."
            />

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-1 w-fit rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar cambios"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ArcoRequestsTable({
  requests,
  adminId,
}: {
  requests: Request[];
  adminId: string;
}) {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-slate-400">
        No hay solicitudes ARCO+ registradas todavía.
      </p>
    );
  }

  const abiertas = requests.filter(
    (r) => r.status === "pendiente" || r.status === "en_proceso"
  );
  const cerradas = requests.filter(
    (r) => r.status === "resuelta" || r.status === "rechazada"
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Abiertas ({abiertas.length})
        </h2>
        <div className="flex flex-col gap-2">
          {abiertas.length === 0 && (
            <p className="text-sm text-slate-400">Sin solicitudes abiertas.</p>
          )}
          {abiertas.map((r) => (
            <RequestRow key={r.id} request={r} adminId={adminId} />
          ))}
        </div>
      </div>

      {cerradas.length > 0 && (
        <div>
          <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            Cerradas ({cerradas.length})
          </h2>
          <div className="flex flex-col gap-2">
            {cerradas.map((r) => (
              <RequestRow key={r.id} request={r} adminId={adminId} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
