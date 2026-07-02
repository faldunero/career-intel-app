"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ROLE_OPTIONS = ["usuario", "coach", "administrador"];

export default function RoleSelector({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [role, setRole] = useState(currentRole);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleChange(newRole: string) {
    if (
      !confirm(
        `¿Cambiar el rol a "${newRole}"? Esto afecta a qué datos puede ver este usuario.`
      )
    ) {
      return;
    }

    setSaving(true);
    setError(null);
    const previous = role;
    setRole(newRole);

    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      setRole(previous);
      setError(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <select
        value={role}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value)}
        className="rounded-lg border border-slate-300 px-2 py-1 text-xs outline-none disabled:opacity-50"
      >
        {ROLE_OPTIONS.map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
