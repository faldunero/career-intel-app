"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import TaskCommentThread from "./task-comment-thread";

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
  created_at: string;
};

const STATUS_LABELS: Record<string, string> = {
  pendiente: "Pendiente",
  en_progreso: "En progreso",
  completada: "Completada",
};

const STATUS_COLORS: Record<string, string> = {
  pendiente: "bg-slate-100 text-slate-700",
  en_progreso: "bg-amber-100 text-amber-700",
  completada: "bg-green-100 text-green-700",
};

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

export default function TasksSection({
  coachId,
  userId,
  initialTasks,
  commentsByTask = {},
}: {
  coachId: string;
  userId: string;
  initialTasks: Task[];
  commentsByTask?: Record<string, Comment[]>;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    if (!title.trim()) return;
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("coach_tasks").insert({
      coach_id: coachId,
      user_id: userId,
      title: title.trim(),
      description: description.trim() || null,
      due_date: dueDate || null,
    });

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setTitle("");
    setDescription("");
    setDueDate("");
    router.refresh();
  }

  async function handleDelete(taskId: string) {
    if (!confirm("¿Eliminar esta tarea?")) return;
    await supabase.from("coach_tasks").delete().eq("id", taskId);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3">
        <input
          className={inputClass}
          placeholder="Título de la tarea"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className={inputClass}
          rows={2}
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          type="date"
          className={inputClass}
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          onClick={handleCreate}
          disabled={saving || !title.trim()}
          className="self-start rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Creando..." : "Asignar tarea"}
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {initialTasks.length === 0 && (
          <p className="text-xs text-slate-400">
            No has asignado tareas todavía.
          </p>
        )}
        {initialTasks.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            coachId={coachId}
            comments={commentsByTask[t.id] ?? []}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  coachId,
  comments,
  onDelete,
}: {
  task: Task;
  coachId: string;
  comments: Comment[];
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-100">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5 text-left"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{task.title}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {task.due_date
              ? `Vence: ${new Date(task.due_date + "T00:00:00").toLocaleDateString("es-CL")}`
              : "Sin fecha límite"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {comments.length > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {comments.length} comentario{comments.length !== 1 ? "s" : ""}
            </span>
          )}
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLORS[task.status] ?? ""}`}
          >
            {STATUS_LABELS[task.status] ?? task.status}
          </span>
          <span
            className={`text-slate-400 transition-transform ${open ? "rotate-90" : ""}`}
          >
            ›
          </span>
        </div>
      </button>
      {open && (
        <div className="border-t border-slate-100 px-3 py-3">
          {task.description && (
            <p className="text-xs leading-relaxed text-slate-500">{task.description}</p>
          )}

          <TaskCommentThread
            taskId={task.id}
            coachId={coachId}
            comments={comments}
            placeholder="Feedback sobre esta tarea (ej: si ya la completó, cómo le fue)..."
          />

          <button
            onClick={() => onDelete(task.id)}
            className="mt-2 text-xs font-medium text-red-500 hover:text-red-700"
          >
            Eliminar
          </button>
        </div>
      )}
    </div>
  );
}
