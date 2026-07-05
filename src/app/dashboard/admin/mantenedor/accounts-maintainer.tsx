"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Account = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  is_super_admin: boolean;
  created_at: string;
};

const ROLE_LABELS: Record<string, string> = {
  usuario: "Usuario",
  coach: "Coach",
  headhunter: "Headhunter",
  administrador: "Administrador",
};

export default function AccountsMaintainer({
  accounts,
  currentAdminId,
}: {
  accounts: Account[];
  currentAdminId: string;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("todos");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [showBulkConfirm, setShowBulkConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  function isProtected(a: Account) {
    return a.is_super_admin || a.id === currentAdminId;
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter((a) => {
      if (roleFilter !== "todos" && a.role !== roleFilter) return false;
      if (!q) return true;
      return (
        a.full_name?.toLowerCase().includes(q) ||
        a.email?.toLowerCase().includes(q)
      );
    });
  }, [accounts, search, roleFilter]);

  const selectableFiltered = filtered.filter((a) => !isProtected(a));
  const allSelected =
    selectableFiltered.length > 0 &&
    selectableFiltered.every((a) => selected.has(a.id));

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => {
      if (allSelected) {
        const next = new Set(prev);
        selectableFiltered.forEach((a) => next.delete(a.id));
        return next;
      }
      const next = new Set(prev);
      selectableFiltered.forEach((a) => next.add(a.id));
      return next;
    });
  }

  async function handleDeleteOne(account: Account) {
    if (
      !confirm(
        `¿Eliminar la cuenta de ${account.full_name ?? account.email}? Esto borra todo su contenido asociado. No se puede deshacer.`
      )
    ) {
      return;
    }
    setDeletingId(account.id);
    setError(null);
    setResult(null);

    const res = await fetch("/api/admin/accounts/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: [account.id] }),
    });
    const data = await res.json();
    setDeletingId(null);

    if (!res.ok) {
      setError(data.error ?? "Error al eliminar");
      return;
    }
    if (data.skipped?.length > 0) {
      setError(data.skipped[0].reason);
    } else {
      setResult("Cuenta eliminada.");
      router.refresh();
    }
  }

  async function handleBulkDelete() {
    if (confirmText !== "ELIMINAR") {
      setError('Escribe "ELIMINAR" exactamente para confirmar.');
      return;
    }
    setBulkDeleting(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/admin/accounts/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    const data = await res.json();
    setBulkDeleting(false);

    if (!res.ok) {
      setError(data.error ?? "Error al eliminar");
      return;
    }
    setResult(
      `${data.deleted.length} cuenta${data.deleted.length !== 1 ? "s" : ""} eliminada${data.deleted.length !== 1 ? "s" : ""}.` +
        (data.skipped.length > 0
          ? ` ${data.skipped.length} omitida${data.skipped.length !== 1 ? "s" : ""} (protegida o con error).`
          : "")
    );
    setSelected(new Set());
    setConfirmText("");
    setShowBulkConfirm(false);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="min-w-48 flex-1 rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
        />
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
        >
          <option value="todos">Todos los roles</option>
          <option value="usuario">Usuario</option>
          <option value="coach">Coach</option>
          <option value="headhunter">Headhunter</option>
          <option value="administrador">Administrador</option>
        </select>
        <p className="text-xs text-slate-400">
          {filtered.length} de {accounts.length}
        </p>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">
            {selected.size} cuenta{selected.size !== 1 ? "s" : ""} seleccionada
            {selected.size !== 1 ? "s" : ""}
          </p>
          {!showBulkConfirm ? (
            <button
              onClick={() => setShowBulkConfirm(true)}
              className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
            >
              Eliminar seleccionadas
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <input
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Escribe ELIMINAR"
                className="rounded-lg border border-red-300 px-2 py-1 text-xs outline-none"
              />
              <button
                onClick={handleBulkDelete}
                disabled={bulkDeleting}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {bulkDeleting ? "Eliminando..." : "Confirmar"}
              </button>
              <button
                onClick={() => {
                  setShowBulkConfirm(false);
                  setConfirmText("");
                }}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-700">
          {error}
        </p>
      )}
      {result && (
        <p className="mb-3 rounded-lg bg-green-50 p-2 text-xs text-green-700">
          {result}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th className="px-3 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5"
                />
              </th>
              <th className="px-3 py-2">Nombre</th>
              <th className="px-3 py-2">Email</th>
              <th className="px-3 py-2">Rol</th>
              <th className="px-3 py-2">Creada</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((a) => {
              const protected_ = isProtected(a);
              return (
                <tr key={a.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(a.id)}
                      onChange={() => toggleOne(a.id)}
                      disabled={protected_}
                      className="h-3.5 w-3.5 disabled:opacity-30"
                    />
                  </td>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {a.full_name ?? "—"}
                    {a.is_super_admin && (
                      <span className="ml-2 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">
                        Protegido
                      </span>
                    )}
                    {a.id === currentAdminId && !a.is_super_admin && (
                      <span className="ml-2 rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-700">
                        Tú
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{a.email ?? "—"}</td>
                  <td className="px-3 py-2">{ROLE_LABELS[a.role] ?? a.role}</td>
                  <td className="px-3 py-2 text-slate-400">
                    {new Date(a.created_at).toLocaleDateString("es-CL")}
                  </td>
                  <td className="px-3 py-2">
                    {!protected_ && (
                      <button
                        onClick={() => handleDeleteOne(a)}
                        disabled={deletingId === a.id}
                        className="text-xs font-medium text-red-500 underline hover:text-red-700 disabled:opacity-50"
                      >
                        {deletingId === a.id ? "..." : "Eliminar"}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-sm text-slate-400">
                  Sin resultados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
