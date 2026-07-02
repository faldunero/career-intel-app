"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Coach = { id: string; full_name: string | null; email: string | null };

export default function CoachAssignSelector({
  userId,
  coaches,
  currentCoachId,
}: {
  userId: string;
  coaches: Coach[];
  currentCoachId: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [value, setValue] = useState(currentCoachId ?? "");
  const [saving, setSaving] = useState(false);

  async function handleChange(newCoachId: string) {
    setSaving(true);
    setValue(newCoachId);

    // Quitamos cualquier asignación previa de este usuario y, si se
    // eligió un coach, creamos la nueva. Así "cambiar de coach" es
    // una sola acción, no dos.
    await supabase.from("coach_assignments").delete().eq("user_id", userId);

    if (newCoachId) {
      await supabase.from("coach_assignments").insert({
        coach_id: newCoachId,
        user_id: userId,
      });
    }

    setSaving(false);
    router.refresh();
  }

  return (
    <select
      value={value}
      disabled={saving}
      onChange={(e) => handleChange(e.target.value)}
      className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none disabled:opacity-50"
    >
      <option value="">Sin coach</option>
      {coaches.map((c) => (
        <option key={c.id} value={c.id}>
          {c.full_name ?? c.email}
        </option>
      ))}
    </select>
  );
}
