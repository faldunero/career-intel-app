"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ExistingRequest = {
  id: string;
  status: string;
  received_at: string;
  due_at: string;
} | null;

export default function RequestDeletionCard({
  userId,
  userName,
  userEmail,
  existingRequest,
  contextNote,
}: {
  userId: string;
  userName: string;
  userEmail: string;
  existingRequest: ExistingRequest;
  contextNote: string;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    setSaving(true);
    setError(null);

    const { error } = await supabase.from("arco_requests").insert({
      request_type: "cancelacion",
      requester_name: userName,
      requester_email: userEmail,
      target_user_id: userId,
      created_by: userId,
      description: "Solicitud de eliminación de cuenta, enviada por el propio titular desde Privacidad.",
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setConfirming(false);
    router.refresh();
  }

  if (existingRequest) {
    const isOpen = existingRequest.status === "pendiente" || existingRequest.status === "en_proceso";
    return (
      <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
        <h2 className="text-lg font-medium text-slate-900">
          Eliminar mi cuenta — derecho de cancelación (Ley 21.719)
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          {isOpen ? (
            <>
              Ya tienes una solicitud de eliminación en curso, enviada
              el{" "}
              {new Date(existingRequest.received_at).toLocaleDateString("es-CL")}
              . Un administrador debe resolverla antes del{" "}
              {new Date(existingRequest.due_at).toLocaleDateString("es-CL")}
              .
            </>
          ) : (
            <>
              Tu última solicitud de eliminación ya fue resuelta. Si
              quieres enviar una nueva, contacta a un administrador.
            </>
          )}
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
      <h2 className="text-lg font-medium text-slate-900">
        Eliminar mi cuenta — derecho de cancelación (Ley 21.719)
      </h2>
      <p className="mt-1 text-sm text-slate-600">{contextNote}</p>

      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="mt-4 rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Solicitar eliminación de mi cuenta
        </button>
      ) : (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-800">
            Esto envía una solicitud formal a los administradores, con
            un plazo de respuesta de 30 días según la Ley 21.719. No
            elimina tu cuenta al instante — un administrador la va a
            revisar y ejecutar.
          </p>
          {error && <p className="mt-2 text-sm text-red-700">{error}</p>}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleRequest}
              disabled={saving}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {saving ? "Enviando…" : "Confirmar solicitud"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-sm text-slate-500 hover:text-slate-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
