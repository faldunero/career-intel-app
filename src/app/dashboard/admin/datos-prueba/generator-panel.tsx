"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function GeneratorPanel({
  counts,
}: {
  counts: { coaches: number; users: number; headhunters: number };
}) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<{
    coaches: { email: string; full_name: string }[];
    users: { email: string; full_name: string }[];
    headhunters: { email: string; full_name: string }[];
  } | null>(null);

  const total = counts.coaches + counts.users + counts.headhunters;

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/admin/test-data/generate", { method: "POST" });
    const data = await res.json();
    setGenerating(false);

    if (!res.ok) {
      setError(data.error ?? "Error al generar datos de prueba");
      return;
    }
    setResult(
      `Creados: ${data.coaches} coaches, ${data.users} usuarios, ${data.headhunters} headhunters, ${data.opportunities} oportunidades, ${data.tasks} tareas, ${data.events} eventos.`
    );
    setPassword(data.password);
    setAccounts(data.accounts);
    router.refresh();
  }

  async function handleDelete() {
    if (confirmText !== "ELIMINAR PRUEBAS") {
      setError('Escribe "ELIMINAR PRUEBAS" exactamente para confirmar.');
      return;
    }
    setDeleting(true);
    setError(null);
    setResult(null);
    const res = await fetch("/api/admin/test-data/delete", { method: "POST" });
    const data = await res.json();
    setDeleting(false);

    if (!res.ok) {
      setError(data.error ?? "Error al eliminar datos de prueba");
      return;
    }
    setResult(`Se eliminaron ${data.deleted} cuentas de prueba.`);
    setConfirmText("");
    setAccounts(null);
    setPassword(null);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Generar set de prueba
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Crea 5 coaches, 15 usuarios (con rubro/cargo variados, algunos
          asignados a esos coaches y otros sin asignar, algunos
          visibles para headhunters) y 3 headhunters con acceso ya
          aprobado. También genera oportunidades (CRM), tareas y
          eventos de calendario de ejemplo para esos usuarios, con
          algún comentario de coach ya escrito. Todos quedan marcados
          como &quot;TEST&quot; en las listas de Admin, con el prefijo
          <code className="mx-1 rounded bg-slate-100 px-1">test.</code>
          en su correo.
        </p>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {generating ? "Generando..." : "Generar set de prueba"}
        </button>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-medium text-red-900">
          Eliminar todos los datos de prueba
        </h2>
        <p className="mt-1 text-sm text-red-700">
          Actualmente hay <strong>{total}</strong> cuenta{total !== 1 ? "s" : ""}{" "}
          de prueba ({counts.coaches} coaches, {counts.users} usuarios,{" "}
          {counts.headhunters} headhunters). Esto elimina permanentemente
          todas las cuentas marcadas como prueba y todo su contenido
          asociado (CVs, tareas, comentarios, etc.).
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <label className="text-xs font-medium text-red-800">
            Escribe ELIMINAR PRUEBAS para confirmar
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-red-300 px-3 py-2 text-sm outline-none"
          />
        </div>
        <button
          onClick={handleDelete}
          disabled={deleting || total === 0}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Eliminar datos de prueba"}
        </button>
      </div>

      {result && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {result}
        </p>
      )}
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
      )}

      {accounts && password && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-slate-900">
            Cómo entrar a estas cuentas
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Contraseña para TODAS las cuentas de este lote:{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono">
              {password}
            </code>
            . La primera vez que entres a cada una vas a tener que
            configurar 2FA (es el mismo flujo obligatorio de siempre,
            necesitas una app como Google Authenticator).
          </p>

          <AccountGroup title="Coaches" items={accounts.coaches} />
          <AccountGroup title="Usuarios" items={accounts.users} />
          <AccountGroup title="Headhunters" items={accounts.headhunters} />
        </div>
      )}
    </div>
  );
}

function AccountGroup({
  title,
  items,
}: {
  title: string;
  items: { email: string; full_name: string }[];
}) {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  if (items.length === 0) return null;

  function handleCopy(email: string) {
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 1500);
  }

  return (
    <div className="mt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title} ({items.length})
      </h3>
      <div className="mt-2 flex flex-col gap-1">
        {items.map((a) => (
          <div
            key={a.email}
            className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-sm"
          >
            <div>
              <span className="text-slate-900">{a.full_name}</span>{" "}
              <span className="text-slate-500">{a.email}</span>
            </div>
            <button
              onClick={() => handleCopy(a.email)}
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              {copiedEmail === a.email ? "¡Copiado!" : "Copiar correo"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
