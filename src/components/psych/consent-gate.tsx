"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function PsychConsentGate() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setSaving(true);
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setSaving(false);
      setError("No se pudo verificar tu sesión. Recarga la página.");
      return;
    }
    const { error } = await supabase
      .from("profiles")
      .update({ psych_consent_at: new Date().toISOString() })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">
        Herramientas psicolaborales
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Antes de continuar, necesitamos tu consentimiento explícito —
        esta sección trata un tipo de dato distinto al resto de la
        plataforma.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Qué necesitas saber antes de aceptar
        </h2>
        <ul className="mt-3 flex flex-col gap-3 text-sm text-slate-700">
          <li className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
            Estas herramientas son una autoevaluación de desarrollo
            profesional creada por Career Intelligence AI — no son un
            instrumento psicométrico certificado ni un diagnóstico
            clínico ni psicológico.
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
            Tus respuestas se usan solo para calcular un resultado que
            ves tú, y que tu coach puede revisar y comentar para
            acompañarte mejor — no se usan para ningún otro fin.
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
            Puedes ver, exportar o pedir la eliminación de estos
            resultados en cualquier momento desde{" "}
            <span className="font-medium">Privacidad</span>, igual que
            el resto de tus datos.
          </li>
          <li className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-slate-400" />
            Responder es voluntario. Si tu coach te asigna una
            herramienta y prefieres no responderla, puedes decírselo
            directamente.
          </li>
        </ul>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          onClick={handleAccept}
          disabled={saving}
          className="mt-6 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Entiendo y acepto continuar"}
        </button>
      </div>
    </div>
  );
}
