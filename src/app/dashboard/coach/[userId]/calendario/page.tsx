import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import MonthCalendar from "../../../calendar/month-calendar";
import AddEventForm from "../../../calendar/add-event-form";

export default async function CoachUserCalendarPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, profile } = await getCoachViewedUser(userId);

  const { data: calendarEvents } = await supabase
    .from("calendar_events")
    .select("id, event_type, title, description, event_date, event_time, location")
    .eq("user_id", userId)
    .order("event_date", { ascending: true });

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/coach"
        className="text-sm text-slate-500 underline hover:text-slate-800"
      >
        ← Volver a mis usuarios
      </Link>
      <p className="mt-3 text-sm text-slate-500">
        {profile.full_name ?? profile.email}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">Calendario</h1>
      <p className="mt-1 text-sm text-slate-500">
        Puedes agendar sesiones directamente en el calendario de este
        usuario.
      </p>

      <div className="mt-6">
        <AddEventForm userId={userId} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <MonthCalendar events={calendarEvents ?? []} editable />
      </div>
    </div>
  );
}
