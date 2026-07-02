"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const TYPE_LABELS: Record<string, string> = {
  sesion_coach: "Sesión con coach",
  entrevista_trabajo: "Entrevista de trabajo",
  entrevista_networking: "Entrevista de networking",
};

const TYPE_COLORS: Record<string, string> = {
  sesion_coach: "bg-blue-100 text-blue-700",
  entrevista_trabajo: "bg-green-100 text-green-700",
  entrevista_networking: "bg-purple-100 text-purple-700",
};

export type CalendarEvent = {
  id: string;
  event_type: string;
  title: string;
  description: string | null;
  event_date: string;
  event_time: string | null;
  location: string | null;
};

export default function EventList({
  events,
  editable,
}: {
  events: CalendarEvent[];
  editable: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este evento del calendario?")) return;
    await supabase.from("calendar_events").delete().eq("id", id);
    router.refresh();
  }

  if (events.length === 0) {
    return <p className="text-xs text-slate-400">No hay eventos.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {events.map((e) => (
        <div
          key={e.id}
          className="flex items-start justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
        >
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${TYPE_COLORS[e.event_type] ?? "bg-slate-100 text-slate-700"}`}
              >
                {TYPE_LABELS[e.event_type] ?? e.event_type}
              </span>
            </div>
            <p className="mt-1 font-medium text-slate-900">{e.title}</p>
            <p className="text-xs text-slate-500">
              {new Date(e.event_date + "T00:00:00").toLocaleDateString(
                "es-CL",
                { day: "2-digit", month: "short", year: "numeric" }
              )}
              {e.event_time ? ` · ${e.event_time.slice(0, 5)}` : ""}
              {e.location ? ` · ${e.location}` : ""}
            </p>
            {e.description && (
              <p className="mt-1 text-xs text-slate-500">{e.description}</p>
            )}
          </div>
          {editable && (
            <button
              onClick={() => handleDelete(e.id)}
              className="shrink-0 text-xs font-medium text-red-500 underline hover:text-red-700"
            >
              Eliminar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
