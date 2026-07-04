"use client";

import { useState } from "react";
import EventList, { type CalendarEvent } from "./event-list";

const WEEKDAYS = ["L", "M", "X", "J", "V", "S", "D"];
const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export default function MonthCalendar({
  events,
  editable,
}: {
  events: CalendarEvent[];
  editable: boolean;
}) {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const eventsByDate = new Map<string, CalendarEvent[]>();
  for (const e of events) {
    const list = eventsByDate.get(e.event_date) ?? [];
    list.push(e);
    eventsByDate.set(e.event_date, list);
  }

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const startWeekday = (firstOfMonth.getDay() + 6) % 7; // Lunes = 0
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const cells: (string | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`);
  }

  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  }

  const selectedEvents = eventsByDate.get(selectedDate) ?? [];
  const selectedLabel = new Date(
    selectedDate + "T00:00:00"
  ).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={prevMonth}
          className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
        >
          ‹
        </button>
        <p className="text-sm font-semibold text-slate-900">
          {MONTH_NAMES[viewMonth]} {viewYear}
        </p>
        <button
          onClick={nextMonth}
          className="rounded-lg px-2 py-1 text-slate-500 hover:bg-slate-100"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-slate-400">
        {WEEKDAYS.map((w) => (
          <div key={w}>{w}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((dateStr, i) => {
          if (!dateStr) return <div key={`empty-${i}`} />;

          const hasEvents = eventsByDate.has(dateStr);
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          const dayNum = parseInt(dateStr.slice(8, 10), 10);

          return (
            <button
              key={dateStr}
              onClick={() => setSelectedDate(dateStr)}
              className={`relative h-9 rounded-lg text-xs transition ${
                isSelected
                  ? "bg-slate-900 font-semibold text-white"
                  : isToday
                    ? "bg-slate-100 font-semibold text-slate-900"
                    : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {dayNum}
              {hasEvents && (
                <span
                  className={`absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                    isSelected ? "bg-white" : "bg-black"
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
          {selectedLabel}
        </p>
        <EventList events={selectedEvents} editable={editable} />
      </div>
    </div>
  );
}
