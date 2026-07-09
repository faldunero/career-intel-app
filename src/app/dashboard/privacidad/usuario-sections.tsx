"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function HeadhunterVisibilityCard() {
  const supabase = createClient();
  const [visibleToHeadhunters, setVisibleToHeadhunters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("visible_to_headhunters")
        .eq("id", user.id)
        .single();
      setVisibleToHeadhunters(Boolean(data?.visible_to_headhunters));
      setLoading(false);
    }
    load();
  }, [supabase]);

  async function handleToggle() {
    setSaving(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      return;
    }
    const next = !visibleToHeadhunters;
    const { error } = await supabase
      .from("profiles")
      .update({ visible_to_headhunters: next })
      .eq("id", user.id);
    setSaving(false);
    if (!error) setVisibleToHeadhunters(next);
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-medium text-slate-900">
        Visibilidad para headhunters — consentimiento (Ley 21.719)
      </h2>
      <p className="mt-1 text-sm text-slate-600">
        Si activas esto, tu nombre, cargo, industria y tu CV quedan
        disponibles para headhunters con acceso aprobado por un
        administrador (nunca ven el análisis interno de tu coach ni
        sus comentarios). Está apagado por defecto — nadie ve tu
        perfil hasta que tú lo actives.
      </p>
      {loading ? (
        <p className="mt-4 text-xs text-slate-400">Cargando…</p>
      ) : (
        <button
          onClick={handleToggle}
          disabled={saving}
          className={`mt-4 flex items-center gap-3 rounded-lg border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
            visibleToHeadhunters
              ? "border-green-200 bg-green-50 text-green-700"
              : "border-slate-200 bg-slate-50 text-slate-600"
          }`}
        >
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              visibleToHeadhunters ? "bg-green-500" : "bg-slate-400"
            }`}
          />
          {saving
            ? "Guardando…"
            : visibleToHeadhunters
              ? "Visible para headhunters — click para desactivar"
              : "No visible — click para activar"}
        </button>
      )}
    </div>
  );
}

export function SelfDeleteAccountCard() {
  const router = useRouter();
  const supabase = createClient();
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6">
      <h2 className="text-lg font-medium text-red-900">
        Eliminar mi cuenta — derecho de cancelación (Ley 21.719)
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
        {deleting ? "Eliminando…" : "Eliminar mi cuenta permanentemente"}
      </button>
    </div>
  );
}
