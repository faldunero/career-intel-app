"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente", color: "bg-slate-100 text-slate-700" },
  { value: "en_progreso", label: "En progreso", color: "bg-amber-100 text-amber-700" },
  { value: "completada", label: "Completada", color: "bg-green-100 text-green-700" },
];

export default function TaskStatusSelector({
  taskId,
  currentStatus,
}: {
  taskId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(currentStatus);
  const [updating, setUpdating] = useState(false);

  const current =
    STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];

  async function handleChange(newStatus: string) {
    setStatus(newStatus);
    setUpdating(true);

    await supabase
      .from("coach_tasks")
      .update({
        status: newStatus,
        completed_at: newStatus === "completada" ? new Date().toISOString() : null,
      })
      .eq("id", taskId);

    setUpdating(false);
    router.refresh();
  }

  return (
    <select
      value={status}
      disabled={updating}
      onChange={(e) => handleChange(e.target.value)}
      className={`rounded-full border-0 px-3 py-1 text-xs font-medium outline-none ${current.color}`}
    >
      {STATUS_OPTIONS.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
