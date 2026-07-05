"use client";

import { useMemo, useState } from "react";
import CoachCard from "./coach-card";

type Coach = {
  id: string;
  full_name: string | null;
  email: string | null;
  is_test_data?: boolean;
};

export default function CoachesList({
  coaches,
  coachCounts,
}: {
  coaches: Coach[];
  coachCounts: Record<string, number>;
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return coaches;
    return coaches.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q)
    );
  }, [coaches, search]);

  return (
    <div>
      {coaches.length > 0 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="mb-3 w-full max-w-xs rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
        />
      )}
      <div className="flex flex-col gap-2">
        {coaches.length === 0 && (
          <p className="text-sm text-slate-500">
            No hay coaches todavía. Crea el primero con el botón de arriba.
          </p>
        )}
        {filtered.map((c) => (
          <CoachCard
            key={c.id}
            coach={c}
            assignedCount={coachCounts[c.id] ?? 0}
          />
        ))}
        {coaches.length > 0 && filtered.length === 0 && (
          <p className="text-sm text-slate-400">
            Sin resultados para tu búsqueda.
          </p>
        )}
      </div>
    </div>
  );
}
