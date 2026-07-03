"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TYPE_OPTIONS = [
  { value: "recruiter", label: "Recruiter (screening inicial)" },
  { value: "rrhh", label: "RR.HH. (fit cultural)" },
  { value: "hiring_manager", label: "Hiring Manager" },
  { value: "director", label: "Director" },
  { value: "ceo", label: "CEO (entrevista final)" },
  { value: "panel_tecnico", label: "Panel Técnico" },
];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

export default function EnableInterviewForm({
  coachId,
  userId,
}: {
  coachId: string;
  userId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [interviewType, setInterviewType] = useState("recruiter");
  const [targetRole, setTargetRole] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("interview_sessions").insert({
      coach_id: coachId,
      user_id: userId,
      interview_type: interviewType,
      target_role: targetRole.trim() || null,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setTargetRole("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        + Habilitar simulación
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <select
        value={interviewType}
        onChange={(e) => setInterviewType(e.target.value)}
        className={inputClass}
      >
        {TYPE_OPTIONS.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <input
        className={inputClass}
        placeholder="Cargo objetivo (opcional)"
        value={targetRole}
        onChange={(e) => setTargetRole(e.target.value)}
      />

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleCreate}
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Habilitando..." : "Habilitar"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
