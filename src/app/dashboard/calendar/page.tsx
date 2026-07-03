import { requireUsuario } from "@/lib/require-usuario";
import AddEventForm from "./add-event-form";
import MonthCalendar from "./month-calendar";

export default async function CalendarPage() {
  const { supabase, user } = await requireUsuario();

  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, event_type, title, description, event_date, event_time, location")
    .eq("user_id", user.id)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Calendario</h1>
      <p className="mt-1 text-sm text-slate-500">
        Agenda tus sesiones de trabajo con tu coach, entrevistas de
        trabajo y entrevistas de networking. Tu coach puede ver y
        agendar en este calendario también.
      </p>

      <div className="mt-6">
        <AddEventForm userId={user.id} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <MonthCalendar events={events ?? []} editable />
      </div>
    </div>
  );
}
