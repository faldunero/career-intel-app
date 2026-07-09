"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TaskStatusSelector from "./task-status-selector";
import CommentList from "@/components/cv/comment-list";

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
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [dismissing, setDismissing] = useState(false);

  async function handleDismiss() {
    if (
      !confirm(
        "¿Descartar esta tarea? No se marca como completada, pero deja de aparecer como pendiente y no se puede deshacer."
      )
    ) {
      return;
    }
    setDismissing(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("notification_dismissals").insert({
        user_id: user.id,
        item_type: "task",
        item_id: task.id,
      });
    }
    setDismissing(false);
    router.refresh();
  }

  return (
    <div
      className={`rounded-xl border ${completed ? "border-slate-100 bg-slate-50 opacity-70" : "border-slate-200 bg-white"}`}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <div className="min-w-0">
          <p
            className={`truncate text-base font-semibold ${completed ? "text-slate-600 line-through" : "text-slate-900"}`}
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
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
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
            <p className="text-xs leading-relaxed text-slate-500">
              {task.description}
            </p>
          )}
          {comments.length > 0 && (
            <div className="mt-3">
              <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                Comentario de tu coach
              </h4>
              <CommentList comments={comments} />
            </div>
          )}
          {!completed && (
            <button
              onClick={handleDismiss}
              disabled={dismissing}
              className="mt-3 text-xs font-medium text-slate-400 hover:text-slate-700 disabled:opacity-50"
            >
              {dismissing ? "Descartando…" : "Descartar (no aplica / no la voy a hacer)"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
