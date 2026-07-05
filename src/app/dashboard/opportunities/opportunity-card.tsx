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

const PRIORITY_OPTIONS = ["Alta", "Media", "Baja"];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

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
  job_match_id?: string | null;
};

type Comment = {
  id: string;
  comment: string;
  seen_by_user?: boolean;
};

export default function OpportunityCard({
  opp,
  comments = [],
}: {
  opp: Opportunity;
  comments?: Comment[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [status, setStatus] = useState(opp.status);
  const [updating, setUpdating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingSeen, setMarkingSeen] = useState(false);

  const unseenComments = comments.filter((c) => c.seen_by_user === false);

  async function handleMarkSeen() {
    setMarkingSeen(true);
    await supabase
      .from("opportunity_comments")
      .update({ seen_by_user: true })
      .in(
        "id",
        unseenComments.map((c) => c.id)
      );
    setMarkingSeen(false);
    router.refresh();
  }

  const [form, setForm] = useState({
    company: opp.company ?? "",
    job_title: opp.job_title ?? "",
    industry: opp.industry ?? "",
    source: opp.source ?? "",
    url: opp.url ?? "",
    priority: opp.priority ?? "Media",
    next_action: opp.next_action ?? "",
    next_action_date: opp.next_action_date ?? "",
    notes: opp.notes ?? "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

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

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error } = await supabase
      .from("opportunities")
      .update({
        company: form.company || null,
        job_title: form.job_title || null,
        industry: form.industry || null,
        source: form.source || null,
        url: form.url || null,
        priority: form.priority || null,
        next_action: form.next_action || null,
        next_action_date: form.next_action_date || null,
        notes: form.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", opp.id);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <form
        onSubmit={handleSaveEdit}
        className="flex flex-col gap-3 rounded-xl border border-slate-300 bg-white p-4"
      >
        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Empresa"
            value={form.company}
            onChange={(e) => update("company", e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Cargo"
            value={form.job_title}
            onChange={(e) => update("job_title", e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Industria"
            value={form.industry}
            onChange={(e) => update("industry", e.target.value)}
          />
          <input
            className={inputClass}
            placeholder="Fuente"
            value={form.source}
            onChange={(e) => update("source", e.target.value)}
          />
        </div>
        <input
          className={inputClass}
          placeholder="URL de la publicación"
          value={form.url}
          onChange={(e) => update("url", e.target.value)}
        />
        <select
          className={inputClass}
          value={form.priority}
          onChange={(e) => update("priority", e.target.value)}
        >
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              Prioridad {p}
            </option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-3">
          <input
            className={inputClass}
            placeholder="Próxima acción"
            value={form.next_action}
            onChange={(e) => update("next_action", e.target.value)}
          />
          <input
            type="date"
            className={inputClass}
            value={form.next_action_date}
            onChange={(e) => update("next_action_date", e.target.value)}
          />
        </div>
        <textarea
          className={inputClass}
          rows={2}
          placeholder="Observaciones"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Guardando..." : "Guardar cambios"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
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
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-medium text-slate-500 underline hover:text-slate-800"
          >
            Editar
          </button>
          <button
            onClick={handleDelete}
            className="text-xs font-medium text-red-500 underline hover:text-red-700"
          >
            Eliminar
          </button>
        </div>
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

      {opp.job_match_id && (
        <p className="mt-2">
          <a
            href="/dashboard/matching"
            className="text-xs text-blue-700 hover:underline"
          >
            🔗 Viene de un análisis de Matching — ver detalle completo
          </a>
        </p>
      )}

      {opp.notes && (
        <p className="mt-2 text-xs text-slate-500">{opp.notes}</p>
      )}

      {comments.length > 0 && (
        <div className="mt-3 flex flex-col gap-1.5 border-t border-slate-100 pt-3">
          {comments.map((c) => (
            <p
              key={c.id}
              className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-slate-700"
            >
              💬 <span className="font-medium">Tu coach:</span> {c.comment}
            </p>
          ))}
          {unseenComments.length > 0 && (
            <button
              onClick={handleMarkSeen}
              disabled={markingSeen}
              className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-800 disabled:opacity-50"
            >
              {markingSeen ? "Marcando..." : "✓ Marcar como visto"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
