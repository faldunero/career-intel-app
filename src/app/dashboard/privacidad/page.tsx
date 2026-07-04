"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function PrivacyRightsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [downloading, setDownloading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setDownloading(true);
    const res = await fetch("/api/account/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "mis-datos.json";
    a.click();
    URL.revokeObjectURL(url);
    setDownloading(false);
  }

  async function handleDelete() {
    if (confirmText !== "ELIMINAR") {
      setError('Escribe "ELIMINAR" exactamente para confirmar.');
      return;
    }
    setError(null);
    setDeleting(true);

    const res = await fetch("/api/account/delete", { method: "POST" });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "No se pudo eliminar la cuenta");
      setDeleting(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Privacidad</h1>
      <p className="mt-1 text-sm text-slate-500">
        Gestiona tus datos personales, de acuerdo a la{" "}
        <Link href="/privacidad" target="_blank" className="underline">
          Política de Privacidad
        </Link>
        .
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Acceso y portabilidad
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Descarga una copia de todos los datos personales asociados a tu
          cuenta (perfil, CVs, análisis, oportunidades, tareas, calendario
          y entrevistas) en formato JSON.
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {downloading ? "Preparando..." : "Descargar mis datos"}
        </button>
      </div>

      <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-medium text-red-900">
          Eliminar mi cuenta
        </h2>
        <p className="mt-1 text-sm text-red-700">
          Esta acción es permanente e irreversible. Se eliminan tu perfil,
          CVs, análisis, historial de postulaciones, transcripciones de
          entrevistas y todo dato asociado a tu cuenta.
        </p>

        <div className="mt-4 flex flex-col gap-2">
          <label className="text-xs font-medium text-red-800">
            Escribe ELIMINAR para confirmar
          </label>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full max-w-xs rounded-lg border border-red-300 px-3 py-2 text-sm outline-none"
          />
        </div>

        {error && <p className="mt-2 text-sm text-red-700">{error}</p>}

        <button
          onClick={handleDelete}
          disabled={deleting || confirmText !== "ELIMINAR"}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
        >
          {deleting ? "Eliminando..." : "Eliminar mi cuenta permanentemente"}
        </button>
      </div>
    </div>
  );
}
