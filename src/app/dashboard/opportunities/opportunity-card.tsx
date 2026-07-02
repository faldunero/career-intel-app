"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: "por_postular", label: "Por postular", color: "bg-slate-100 text-slate-700" },
  { value: "postulado", label: "Postulado", color: "bg-blue-100 text-blue-700" },
  { value: "entrevista", label: "En entrevista", color: "bg-amber-100 text-amber-700" },
  { value: "oferta", label: "Oferta recibida", color: "bg-green-100 text-green-700" },
  { value: "rechazado", label: "Rechazado", color: "bg-red-100 text-red-700" },
  { value: "abandonado", label: "Abandonado", color: "bg-slate-100 text-slate-500" },
];

type Opportunity = {
  id: string;
  company: string | null;
  job_title: string | null;
  industry: string | null;
  source: string | null;
  url: string | null;
  status: string;
  priority: string | null;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
};

export default function OpportunityCard({ opp }: { opp: Opportunity }) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(opp.status);
  const [updating, setUpdating] = useState(false);

  const currentOption =
    STATUS_OPTIONS.find((o) => o.value === status) ?? STATUS_OPTIONS[0];

  async function handleStatusChange(newStatus: string) {
    setStatus(newStatus);
    setUpdating(true);
    await supabase
      .from("opportunities")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", opp.id);
    setUpdating(false);
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("¿Eliminar esta oportunidad?")) return;
    await supabase.from("opportunities").delete().eq("id", opp.id);
    router.refresh();
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-900">
            {opp.job_title ?? "Cargo sin definir"}
            {opp.company ? ` — ${opp.company}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {[opp.industry, opp.source, opp.priority ? `Prioridad ${opp.priority}` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </div>
        <button
          onClick={handleDelete}
          className="shrink-0 text-xs font-medium text-red-500 underline hover:text-red-700"
        >
          Eliminar
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={status}
          disabled={updating}
          onChange={(e) => handleStatusChange(e.target.value)}
          className={`rounded-full border-0 px-3 py-1 text-xs font-medium outline-none ${currentOption.color}`}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {opp.url && (
          <a
            href={opp.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-slate-500 underline hover:text-slate-800"
          >
            Ver publicación
          </a>
        )}
      </div>

      {(opp.next_action || opp.next_action_date) && (
        <p className="mt-2 text-xs text-slate-600">
          <span className="font-medium">Próxima acción:</span>{" "}
          {opp.next_action ?? "—"}
          {opp.next_action_date
            ? ` (${new Date(opp.next_action_date + "T00:00:00").toLocaleDateString("es-CL")})`
            : ""}
        </p>
      )}

      {opp.notes && (
        <p className="mt-2 text-xs text-slate-500">{opp.notes}</p>
      )}
    </div>
  );
}
