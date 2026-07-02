"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "por_postular", label: "Por postular" },
  { value: "postulado", label: "Postulado" },
  { value: "entrevista", label: "En entrevista" },
  { value: "oferta", label: "Oferta recibida" },
  { value: "rechazado", label: "Rechazado" },
  { value: "abandonado", label: "Abandonado" },
];

const PRIORITY_OPTIONS = ["Alta", "Media", "Baja"];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

export default function AddOpportunityForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    company: "",
    job_title: "",
    industry: "",
    source: "",
    url: "",
    status: "por_postular",
    priority: "Media",
    next_action: "",
    next_action_date: "",
    notes: "",
  });

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.company && !form.job_title) {
      setError("Ingresa al menos la empresa o el cargo");
      return;
    }
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("opportunities").insert({
      user_id: userId,
      company: form.company || null,
      job_title: form.job_title || null,
      industry: form.industry || null,
      source: form.source || null,
      url: form.url || null,
      status: form.status,
      priority: form.priority || null,
      next_action: form.next_action || null,
      next_action_date: form.next_action_date || null,
      notes: form.notes || null,
      applied_at: form.status !== "por_postular" ? new Date().toISOString().slice(0, 10) : null,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setForm({
      company: "",
      job_title: "",
      industry: "",
      source: "",
      url: "",
      status: "por_postular",
      priority: "Media",
      next_action: "",
      next_action_date: "",
      notes: "",
    });
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        + Agregar oportunidad
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5"
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
          placeholder="Fuente (LinkedIn, referido, etc.)"
          value={form.source}
          onChange={(e) => update("source", e.target.value)}
        />
      </div>
      <input
        className={inputClass}
        placeholder="URL de la publicación (opcional)"
        value={form.url}
        onChange={(e) => update("url", e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <select
          className={inputClass}
          value={form.status}
          onChange={(e) => update("status", e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
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
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input
          className={inputClass}
          placeholder="Próxima acción (ej: seguimiento por correo)"
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
          {saving ? "Guardando..." : "Guardar oportunidad"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
