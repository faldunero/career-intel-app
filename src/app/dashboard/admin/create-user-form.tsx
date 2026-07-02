"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Coach = { id: string; full_name: string | null; email: string | null };

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

export default function CreateUserForm({ coaches }: { coaches: Coach[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [coachId, setCoachId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);

  async function handleCreate() {
    setSaving(true);
    setError(null);
    setWarning(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, coachId: coachId || null }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al crear el usuario");
        setSaving(false);
        return;
      }

      if (data.warning) {
        setWarning(data.warning);
      } else {
        setFullName("");
        setEmail("");
        setPassword("");
        setCoachId("");
        setOpen(false);
      }
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setSaving(false);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
      >
        + Crear usuario
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="grid grid-cols-2 gap-3">
        <input
          className={inputClass}
          placeholder="Nombre completo"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
        <input
          className={inputClass}
          placeholder="Correo"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <input
        className={inputClass}
        placeholder="Contraseña temporal (mínimo 6 caracteres)"
        type="text"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <select
        value={coachId}
        onChange={(e) => setCoachId(e.target.value)}
        className={inputClass}
      >
        <option value="">Sin coach asignado (puedes hacerlo después)</option>
        {coaches.map((c) => (
          <option key={c.id} value={c.id}>
            Asignar a: {c.full_name ?? c.email}
          </option>
        ))}
      </select>
      <p className="text-xs text-slate-500">
        Se crea la cuenta ya confirmada, lista para iniciar sesión.
        Comparte esta contraseña con el usuario para que la cambie
        después.
      </p>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {warning && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          {warning}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={handleCreate}
          disabled={saving || !email || password.length < 6}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Creando..." : "Crear usuario"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
