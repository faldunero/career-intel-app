"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminCard({
  admin,
  canDelete,
}: {
  admin: {
    id: string;
    full_name: string | null;
    email: string | null;
    is_super_admin: boolean;
  };
  canDelete: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(admin.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    // Edita el nombre directo (RLS: "administradores actualizan
    // cualquier perfil" ya cubre esto, no toca el rol).
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: name })
      .eq("id", admin.id);
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function handleDelete() {
    if (
      !confirm(
        `¿Eliminar la cuenta de administrador de ${admin.full_name ?? admin.email}? No se puede deshacer.`
      )
    ) {
      return;
    }
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/admins/${admin.id}`, {
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
    <div className="rounded-lg bg-white px-3 py-2 text-sm">
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
            <p className="font-medium text-slate-900">
              {admin.full_name ?? "Sin nombre"}
              {admin.is_super_admin && (
                <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-purple-700">
                  Principal
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500">{admin.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setEditing(true)}
              className="text-xs font-medium text-slate-500 underline hover:text-slate-800"
            >
              Editar
            </button>
            {canDelete && !admin.is_super_admin && (
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs font-medium text-red-500 underline hover:text-red-700 disabled:opacity-50"
              >
                {deleting ? "Eliminando..." : "Eliminar"}
              </button>
            )}
          </div>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
