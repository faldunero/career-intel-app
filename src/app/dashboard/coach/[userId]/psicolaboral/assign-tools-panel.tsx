"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { TOOL_ORDER, TOOLS, type ToolKey } from "@/lib/psych-tools";

type AssignmentStatus = "asignado" | "completado";

export default function AssignToolsPanel({
  userId,
  coachId,
  assignedByTool,
}: {
  userId: string;
  coachId: string;
  assignedByTool: Partial<Record<ToolKey, { id: string; status: AssignmentStatus }>>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [selected, setSelected] = useState<Set<ToolKey>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableToAssign = TOOL_ORDER.filter((key) => !assignedByTool[key]);

  function toggle(key: ToolKey) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleAssign(keys: ToolKey[]) {
    if (keys.length === 0) return;
    setBusy(true);
    setError(null);

    const { error } = await supabase.from("psych_assignments").insert(
      keys.map((tool_key) => ({
        user_id: userId,
        coach_id: coachId,
        tool_key,
      }))
    );

    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSelected(new Set());
    router.refresh();
  }

  async function handleCancel(assignmentId: string) {
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("psych_assignments")
      .delete()
      .eq("id", assignmentId);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function handleReassign(assignmentId: string) {
    setBusy(true);
    setError(null);
    const { error } = await supabase
      .from("psych_assignments")
      .update({
        status: "asignado",
        answers: null,
        result: null,
        completed_at: null,
        assigned_at: new Date().toISOString(),
      })
      .eq("id", assignmentId);
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {availableToAssign.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
            {availableToAssign.map((key) => (
              <label
                key={key}
                className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 transition hover:border-slate-400"
              >
                <input
                  type="checkbox"
                  checked={selected.has(key)}
                  onChange={() => toggle(key)}
                  className="mt-0.5"
                />
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {TOOLS[key].title}
                  </p>
                  <p className="text-xs text-slate-500">{TOOLS[key].subtitle}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleAssign(Array.from(selected))}
              disabled={busy || selected.size === 0}
              className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
            >
              Asignar seleccionadas ({selected.size})
            </button>
            <button
              onClick={() => handleAssign(availableToAssign)}
              disabled={busy}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 disabled:opacity-50"
            >
              Asignar el set completo
            </button>
          </div>
        </>
      )}

      {error && <p className="text-xs text-red-600">{error}</p>}

      {TOOL_ORDER.filter((key) => assignedByTool[key]).length > 0 && (
        <div className="mt-2 flex flex-col gap-2 border-t border-slate-100 pt-3">
          {TOOL_ORDER.map((key) => {
            const a = assignedByTool[key];
            if (!a) return null;
            return (
              <div
                key={key}
                className="flex items-center justify-between text-xs text-slate-500"
              >
                <span>
                  {TOOLS[key].title} —{" "}
                  <span className="font-medium">
                    {a.status === "completado" ? "Completado" : "Asignado, sin responder"}
                  </span>
                </span>
                {a.status === "asignado" ? (
                  <button
                    onClick={() => handleCancel(a.id)}
                    disabled={busy}
                    className="font-medium text-slate-400 hover:text-red-600 disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                ) : (
                  <button
                    onClick={() => handleReassign(a.id)}
                    disabled={busy}
                    className="font-medium text-slate-400 hover:text-slate-900 disabled:opacity-50"
                  >
                    Reasignar (nuevo intento)
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
