"use client";

import { useState } from "react";
import TaskStatusSelector from "./task-status-selector";

type Task = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  status: string;
};

type Comment = {
  id: string;
  comment: string;
};

export default function UserTaskCard({
  task,
  comments = [],
  completed = false,
}: {
  task: Task;
  comments?: Comment[];
  completed?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className={`rounded-xl border ${completed ? "border-slate-100 bg-slate-50 opacity-70" : "border-slate-200 bg-white"}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div>
          <p
            className={`text-sm font-medium ${completed ? "text-slate-700 line-through" : "text-slate-900"}`}
          >
            {task.title}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {task.due_date
              ? `Vence: ${new Date(task.due_date + "T00:00:00").toLocaleDateString("es-CL")}`
              : "Sin fecha límite"}
          </p>
        </div>
        <div
          className="flex shrink-0 items-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {comments.length > 0 && (
            <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {comments.length} comentario{comments.length !== 1 ? "s" : ""}
            </span>
          )}
          <TaskStatusSelector taskId={task.id} currentStatus={task.status} />
          <span
            className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
          >
            ›
          </span>
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-4 py-3">
          {task.description && (
            <p className="text-sm text-slate-600">{task.description}</p>
          )}
          {comments.length > 0 && (
            <div className="mt-2 flex flex-col gap-1.5">
              {comments.map((c) => (
                <p
                  key={c.id}
                  className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-slate-700"
                >
                  💬 <span className="font-medium">Tu coach:</span> {c.comment}
                </p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
