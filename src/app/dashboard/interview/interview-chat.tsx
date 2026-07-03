"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Message = { role: "user" | "assistant"; content: string };
type Feedback = {
  evaluacion_general?: string;
  fortalezas?: string[];
  areas_de_mejora?: string[];
  recomendacion?: string;
};

export default function InterviewChat({
  sessionId,
  initialMessages,
  initialStatus,
  initialFeedback,
}: {
  sessionId: string;
  initialMessages: Message[];
  initialStatus: string;
  initialFeedback: Feedback | null;
}) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [status, setStatus] = useState(initialStatus);
  const [feedback, setFeedback] = useState<Feedback | null>(initialFeedback);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userAnswerCount = messages.filter((m) => m.role === "user").length;

  async function handleSend() {
    if (!input.trim() || sending) return;
    setError(null);
    const text = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setSending(true);

    try {
      const res = await fetch("/api/interview/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: text }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al enviar el mensaje");
        setSending(false);
        return;
      }

      setMessages(data.messages);
      setStatus("en_progreso");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setSending(false);
  }

  async function handleFinish() {
    if (!confirm("¿Finalizar la entrevista y recibir tu feedback?")) return;
    setFinishing(true);
    setError(null);

    try {
      const res = await fetch("/api/interview/finish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al finalizar");
        setFinishing(false);
        return;
      }

      setFeedback(data.feedback);
      setStatus("completada");
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setFinishing(false);
  }

  if (status === "completada" && feedback) {
    return (
      <div className="flex flex-col gap-4">
        <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-green-800">
            Feedback de tu entrevista
          </h2>
          {feedback.evaluacion_general && (
            <p className="mt-2 text-sm text-green-900">
              {feedback.evaluacion_general}
            </p>
          )}
          {feedback.fortalezas && feedback.fortalezas.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Fortalezas
              </h4>
              <ul className="mt-1 list-disc pl-5 text-sm text-green-900">
                {feedback.fortalezas.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </div>
          )}
          {feedback.areas_de_mejora && feedback.areas_de_mejora.length > 0 && (
            <div className="mt-3">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-green-700">
                Áreas de mejora
              </h4>
              <ul className="mt-1 list-disc pl-5 text-sm text-green-900">
                {feedback.areas_de_mejora.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {feedback.recomendacion && (
            <p className="mt-3 text-sm text-green-900">
              <span className="font-semibold">Recomendación: </span>
              {feedback.recomendacion}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`rounded-lg p-3 text-sm ${
                m.role === "assistant"
                  ? "bg-slate-100 text-slate-800"
                  : "ml-8 bg-slate-900 text-white"
              }`}
            >
              {m.content}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex max-h-[500px] flex-col gap-3 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4">
        {messages.length === 0 && (
          <p className="text-sm text-slate-400">
            Escribe tu primer mensaje (ej. &quot;Hola, listo para
            empezar&quot;) para que el entrevistador comience.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[85%] rounded-lg p-3 text-sm ${
              m.role === "assistant"
                ? "self-start bg-slate-100 text-slate-800"
                : "self-end bg-slate-900 text-white"
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="self-start rounded-lg bg-slate-100 p-3 text-sm text-slate-400">
            Escribiendo...
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Escribe tu respuesta..."
          className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>

      <button
        onClick={handleFinish}
        disabled={finishing || userAnswerCount < 2}
        className="self-start rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
      >
        {finishing
          ? "Generando feedback..."
          : userAnswerCount < 2
            ? "Responde al menos 2 preguntas para finalizar"
            : "Finalizar entrevista y ver feedback"}
      </button>
    </div>
  );
}
