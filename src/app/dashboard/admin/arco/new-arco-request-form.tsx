"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const REQUEST_TYPES: Record<string, string> = {
  acceso: "Acceso",
  rectificacion: "Rectificación",
  cancelacion: "Cancelación",
  oposicion: "Oposición",
  portabilidad: "Portabilidad",
  bloqueo: "Bloqueo",
};

export default function NewArcoRequestForm({
  usuarios,
  adminId,
}: {
  usuarios: { id: string; full_name: string | null; email: string }[];
  adminId: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [requestType, setRequestType] = useState("acceso");
  const [requesterName, setRequesterName] = useState("");
  const [requesterEmail, setRequesterEmail] = useState("");
  const [targetUserId, setTargetUserId] = useState("");
  const [description, setDescription] = useState("");

  function reset() {
    setRequestType("acceso");
    setRequesterName("");
    setRequesterEmail("");
    setTargetUserId("");
    setDescription("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("arco_requests").insert({
      request_type: requestType,
      requester_name: requesterName,
      requester_email: requesterEmail,
      target_user_id: targetUserId || null,
      description: description || null,
      created_by: adminId,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    reset();
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
      >
        Registrar solicitud
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Tipo de solicitud
          </label>
          <select
            value={requestType}
            onChange={(e) => setRequestType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          >
            {Object.entries(REQUEST_TYPES).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Usuario relacionado (opcional)
          </label>
          <select
            value={targetUserId}
            onChange={(e) => setTargetUserId(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          >
            <option value="">— No corresponde a un usuario —</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name ?? u.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Nombre de quien solicita
          </label>
          <input
            required
            value={requesterName}
            onChange={(e) => setRequesterName(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-700">
            Correo de quien solicita
          </label>
          <input
            required
            type="email"
            value={requesterEmail}
            onChange={(e) => setRequesterEmail(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium text-slate-700">
          Detalle de la solicitud
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          placeholder="Qué pidió exactamente, por qué canal llegó, etc."
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Registrar (plazo: 30 días desde hoy)"}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setOpen(false);
          }}
          className="text-xs text-slate-500 hover:text-slate-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
