"use client";

import { useMemo, useState } from "react";
import RoleSelector from "./role-selector";
import CoachAssignSelector from "./coach-assign-selector";
import DeleteUserButton from "./delete-user-button";

type User = {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  profile_completed: boolean;
  career_score: number | null;
};
type Coach = { id: string; full_name: string | null; email: string | null };

type SortKey = "full_name" | "email" | "career_score" | "profile_completed";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "full_name", label: "Nombre" },
  { key: "email", label: "Email" },
  { key: "profile_completed", label: "Perfil" },
  { key: "career_score", label: "Career Score" },
];

export default function UsuariosTable({
  users,
  coaches,
  userCoachMap,
}: {
  users: User[];
  coaches: Coach[];
  userCoachMap: Record<string, string | null>;
}) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("full_name");
  const [sortAsc, setSortAsc] = useState(true);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(true);
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

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              {COLUMNS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => toggleSort(c.key)}
                  className="cursor-pointer select-none pb-2 pr-4 hover:text-slate-900"
                >
                  {c.label}{" "}
                  {sortKey === c.key && (sortAsc ? "▲" : "▼")}
                </th>
              ))}
              <th className="pb-2 pr-4">Rol</th>
              <th className="pb-2 pr-4">Coach asignado</th>
              <th className="pb-2 pr-4"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id} className="border-b border-slate-100">
                <td className="py-2 pr-4">{u.full_name ?? "—"}</td>
                <td className="py-2 pr-4 text-slate-500">{u.email ?? "—"}</td>
                <td className="py-2 pr-4">
                  {u.profile_completed ? "Completo" : "Pendiente"}
                </td>
                <td className="py-2 pr-4">{u.career_score ?? "—"}</td>
                <td className="py-2 pr-4">
                  <RoleSelector userId={u.id} currentRole={u.role} />
                </td>
                <td className="py-2 pr-4">
                  <CoachAssignSelector
                    userId={u.id}
                    coaches={coaches}
                    currentCoachId={userCoachMap[u.id] ?? null}
                  />
                </td>
                <td className="py-2 pr-4">
                  <DeleteUserButton
                    userId={u.id}
                    label={u.full_name ?? u.email ?? "este usuario"}
                  />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-4 text-center text-sm text-slate-400"
                >
                  {users.length === 0
                    ? "No hay usuarios todavía."
                    : "Sin resultados para tu búsqueda."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
