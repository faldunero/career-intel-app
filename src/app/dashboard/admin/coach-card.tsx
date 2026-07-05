"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CoachCard({
  coach,
  assignedCount,
}: {
  coach: {
    id: string;
    full_name: string | null;
    email: string | null;
    is_test_data?: boolean;
  };
  assignedCount: number;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(coach.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coaches/${coach.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al guardar");
        setSaving(false);
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (
      !confirm(
        `¿Eliminar la cuenta de ${coach.full_name ?? coach.email}? Esto borra su acceso y sus asignaciones. No se puede deshacer.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coaches/${coach.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Error al eliminar");
        setDeleting(false);
        return;
      }
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setDeleting(false);
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      {editing ? (
        <div className="flex items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "..." : "Guardar"}
          </button>
          <button
            onClick={() => setEditing(false)}
            className="rounded-lg border border-slate-300 px-3 py-1 text-xs text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-900">
              {coach.full_name ?? "Sin nombre"}
              {coach.is_test_data && (
                <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-700">
                  TEST
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500">{coach.email}</p>
            <p className="mt-0.5 text-xs text-slate-400">
              {assignedCount} usuario{assignedCount !== 1 ? "s" : ""} asignado
              {assignedCount !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-slate-500 underline hover:text-slate-800"
            >
              Editar
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="text-xs font-medium text-red-500 underline hover:text-red-700 disabled:opacity-50"
            >
              {deleting ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
