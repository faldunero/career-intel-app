import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AddEventForm from "./add-event-form";
import EventList from "./event-list";

export default async function CalendarPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: events } = await supabase
    .from("calendar_events")
    .select("id, event_type, title, description, event_date, event_time, location")
    .eq("user_id", user.id)
    .order("event_date", { ascending: true })
    .order("event_time", { ascending: true });

  const all = events ?? [];
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = all.filter((e) => e.event_date >= today);
  const past = all
    .filter((e) => e.event_date < today)
    .sort((a, b) => (a.event_date < b.event_date ? 1 : -1));

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Calendario</h1>
      <p className="mt-1 text-sm text-slate-500">
        Agenda tus sesiones de trabajo con tu coach, entrevistas de
        trabajo y entrevistas de networking. Tu coach puede ver este
        calendario.
      </p>

      <div className="mt-6">
        <AddEventForm userId={user.id} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Próximos ({upcoming.length})
        </h2>
        <div className="mt-4">
          <EventList events={upcoming} editable />
        </div>
      </div>

      {past.length > 0 && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">
            Pasados ({past.length})
          </h2>
          <div className="mt-4">
            <EventList events={past} editable />
          </div>
        </div>
      )}
    </div>
  );
}
