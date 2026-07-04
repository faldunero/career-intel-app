import Link from "next/link";
import { getCoachViewedUser } from "@/lib/coach-guard";
import MonthCalendar from "../../../calendar/month-calendar";
import AddEventForm from "../../../calendar/add-event-form";

type Comment = {
  id: string;
  event_id: string;
  comment: string;
  created_at: string;
};

export default async function CoachUserCalendarPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const { supabase, coachId, profile } = await getCoachViewedUser(userId);

  const { data: calendarEvents } = await supabase
    .from("calendar_events")
    .select("id, event_type, title, description, event_date, event_time, location")
    .eq("user_id", userId)
    .order("event_date", { ascending: true });

  const eventIds = (calendarEvents ?? []).map((e) => e.id);
  const { data: allComments } = eventIds.length
    ? await supabase
        .from("calendar_event_comments")
        .select("id, event_id, comment, created_at")
        .in("event_id", eventIds)
        .order("created_at", { ascending: true })
    : { data: [] as Comment[] };

  const commentsByEvent: Record<string, { id: string; comment: string }[]> = {};
  for (const c of (allComments ?? []) as Comment[]) {
    if (!commentsByEvent[c.event_id]) commentsByEvent[c.event_id] = [];
    commentsByEvent[c.event_id].push({ id: c.id, comment: c.comment });
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        href="/dashboard/coach"
        className="text-sm text-slate-500 hover:text-slate-800"
      >
        Volver a mis usuarios
      </Link>
      <p className="mt-3 text-sm text-slate-500">
        {profile.full_name ?? profile.email}
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">Calendario</h1>
      <p className="mt-1 text-sm text-slate-500">
        Puedes agendar sesiones directamente en el calendario de este
        usuario, y dejar seguimiento después de cada evento.
      </p>

      <div className="mt-6">
        <AddEventForm userId={userId} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <MonthCalendar
          events={calendarEvents ?? []}
          editable
          coachId={coachId}
          commentsByEvent={commentsByEvent}
        />
      </div>
    </div>
  );
}
