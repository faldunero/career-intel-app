"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const EVENT_TYPES = [
  { value: "sesion_coach", label: "Sesión de trabajo con mi coach" },
  { value: "entrevista_trabajo", label: "Entrevista de trabajo" },
  { value: "entrevista_networking", label: "Entrevista de networking" },
];

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

export default function AddEventForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [eventType, setEventType] = useState("sesion_coach");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim() || !eventDate) {
      setError("Título y fecha son obligatorios");
      return;
    }
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("calendar_events").insert({
      user_id: userId,
      event_type: eventType,
      title: title.trim(),
      description: description.trim() || null,
      event_date: eventDate,
      event_time: eventTime || null,
      location: location.trim() || null,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setTitle("");
    setDescription("");
    setEventDate("");
    setEventTime("");
    setLocation("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
      >
        + Agendar evento
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <select
        value={eventType}
        onChange={(e) => setEventType(e.target.value)}
        className={inputClass}
      >
        {EVENT_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <input
        className={inputClass}
        placeholder="Título (ej: Entrevista con Empresa X)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-3">
        <input
          type="date"
          className={inputClass}
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
        <input
          type="time"
          className={inputClass}
          value={eventTime}
          onChange={(e) => setEventTime(e.target.value)}
        />
      </div>
      <input
        className={inputClass}
        placeholder="Lugar o link (opcional)"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
      />
      <textarea
        className={inputClass}
        rows={2}
        placeholder="Notas (opcional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
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
          {saving ? "Guardando..." : "Agendar"}
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
