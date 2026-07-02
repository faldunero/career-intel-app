"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Person = { id: string; full_name: string | null; email: string | null };

export default function AssignCoachForm({
  coaches,
  users,
  adminId,
}: {
  coaches: Person[];
  users: Person[];
  adminId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [coachId, setCoachId] = useState("");
  const [userId, setUserId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAssign() {
    if (!coachId || !userId) {
      setError("Selecciona un coach y un usuario");
      return;
    }
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("coach_assignments").insert({
      coach_id: coachId,
      user_id: userId,
      assigned_by: adminId,
    });

    setSaving(false);

    if (error) {
      setError(
        error.code === "23505"
          ? "Ese coach ya tiene asignado a ese usuario"
          : error.message
      );
      return;
    }

    setCoachId("");
    setUserId("");
    router.refresh();
  }

  const selectClass =
    "rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        <select
          value={coachId}
          onChange={(e) => setCoachId(e.target.value)}
          className={selectClass}
        >
          <option value="">Selecciona un coach...</option>
          {coaches.map((c) => (
            <option key={c.id} value={c.id}>
              {c.full_name ?? c.email ?? c.id}
            </option>
          ))}
        </select>
        <select
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className={selectClass}
        >
          <option value="">Selecciona un usuario...</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name ?? u.email ?? u.id}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        onClick={handleAssign}
        disabled={saving}
        className="self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {saving ? "Asignando..." : "Asignar coach a usuario"}
      </button>
    </div>
  );
}
