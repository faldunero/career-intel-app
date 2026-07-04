"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type AssignedUser = {
  id: string;
  full_name: string | null;
  email: string | null;
  profile_completed: boolean;
  career_score: number | null;
  pendingCount: number;
};

type SortKey = "full_name" | "email" | "career_score" | "profile_completed" | "pendingCount";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "full_name", label: "Nombre" },
  { key: "email", label: "Email" },
  { key: "profile_completed", label: "Perfil" },
  { key: "career_score", label: "Career Score" },
  { key: "pendingCount", label: "Pendientes" },
];

export default function AssignedUsersTable({ users }: { users: AssignedUser[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("pendingCount");
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(key === "full_name" || key === "email");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = users;
    if (q) {
      rows = rows.filter(
        (u) =>
          u.full_name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q)
      );
    }
    const sorted = [...rows].sort((a, b) => {
      let av: string | number;
      let bv: string | number;
      if (sortKey === "profile_completed") {
        av = a.profile_completed ? 1 : 0;
        bv = b.profile_completed ? 1 : 0;
      } else if (sortKey === "career_score") {
        av = a.career_score ?? -1;
        bv = b.career_score ?? -1;
      } else if (sortKey === "pendingCount") {
        av = a.pendingCount;
        bv = b.pendingCount;
      } else {
        av = (a[sortKey] ?? "").toString().toLowerCase();
        bv = (b[sortKey] ?? "").toString().toLowerCase();
      }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [users, search, sortKey, sortAsc]);

  if (users.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Todavía no tienes usuarios asignados. Pídele a un administrador
        que te asigne alguno.
      </p>
    );
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="w-full max-w-xs rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
        />
        <p className="text-xs text-slate-400">
          {filtered.length} de {users.length}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className="cursor-pointer select-none px-4 py-2 hover:text-slate-900"
                >
                  {c.label} {sortKey === c.key && (sortAsc ? "▲" : "▼")}
                </th>
              ))}
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 font-medium text-slate-900">
                  {u.full_name ?? "—"}
                </td>
                <td className="px-4 py-2 text-slate-500">{u.email ?? "—"}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      u.profile_completed
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {u.profile_completed ? "Completo" : "Pendiente"}
                  </span>
                </td>
                <td className="px-4 py-2">{u.career_score ?? "—"}</td>
                <td className="px-4 py-2">
                  {u.pendingCount > 0 ? (
                    <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      {u.pendingCount}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">0</span>
                  )}
                </td>
                <td className="px-4 py-2">
                  <Link
                    href={`/dashboard/coach/${u.id}`}
                    className="text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="py-4 text-center text-sm text-slate-400">
                  Sin resultados para tu búsqueda.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
