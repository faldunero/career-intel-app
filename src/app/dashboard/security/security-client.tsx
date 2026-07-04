"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Factor = { id: string; friendly_name?: string; status: string };

export default function SecurityClient({ canDisable }: { canDisable: boolean }) {
  const supabase = createClient();
  const [factors, setFactors] = useState<Factor[]>([]);
  const [loadingFactors, setLoadingFactors] = useState(true);

  const [enrolling, setEnrolling] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function loadFactors() {
    setLoadingFactors(true);
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors(data?.totp ?? []);
    setLoadingFactors(false);
  }

  useEffect(() => {
    loadFactors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleStartEnroll() {
    setError(null);
    setSuccess(null);
    setEnrolling(true);

    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
    });

    if (error) {
      setError(error.message);
      setEnrolling(false);
      return;
    }

    setQrCode(data.totp.qr_code);
    setSecret(data.totp.secret);
    setPendingFactorId(data.id);
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingFactorId) return;
    setError(null);
    setSaving(true);

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: pendingFactorId,
      code: code.trim(),
    });

    setSaving(false);

    if (error) {
      setError("Código incorrecto. Verifica la hora de tu teléfono e intenta de nuevo.");
      return;
    }

    setSuccess("Verificación en dos pasos activada correctamente.");
    setEnrolling(false);
    setQrCode(null);
    setSecret(null);
    setPendingFactorId(null);
    setCode("");
    loadFactors();
  }

  async function handleCancelEnroll() {
    if (pendingFactorId) {
      await supabase.auth.mfa.unenroll({ factorId: pendingFactorId });
    }
    setEnrolling(false);
    setQrCode(null);
    setSecret(null);
    setPendingFactorId(null);
    setCode("");
    setError(null);
  }

  async function handleRemove(factorId: string) {
    if (!confirm("¿Desactivar la verificación en dos pasos?")) return;
    setError(null);
    const { error } = await supabase.auth.mfa.unenroll({ factorId });
    if (error) {
      setError(error.message);
      return;
    }
    setSuccess("Verificación en dos pasos desactivada.");
    loadFactors();
  }

  const hasActiveFactor = factors.some((f) => f.status === "verified");

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold text-slate-900">Seguridad</h1>
      <p className="mt-1 text-sm text-slate-500">
        Protege tu cuenta con verificación en dos pasos (2FA).
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-medium text-slate-900">
          Verificación en dos pasos
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Usa una app como Google Authenticator, Authy o Microsoft
          Authenticator. Cada vez que inicies sesión, te pedirá un código
          de 6 dígitos además de tu contraseña.
        </p>

        {success && (
          <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
            {success}
          </p>
        )}
        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        {loadingFactors ? (
          <p className="mt-4 text-sm text-slate-400">Cargando...</p>
        ) : hasActiveFactor && !enrolling ? (
          <div className="mt-4 flex flex-col gap-2">
            {factors
              .filter((f) => f.status === "verified")
              .map((f) => (
                <div
                  key={f.id}
                  className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2 text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-green-500" />
                    Activada
                  </span>
                  {canDisable && (
                    <button
                      onClick={() => handleRemove(f.id)}
                      className="text-xs font-medium text-red-500 underline hover:text-red-700"
                    >
                      Desactivar
                    </button>
                  )}
                </div>
              ))}
            {!canDisable && (
              <p className="text-xs text-slate-400">
                Este método de verificación es obligatorio para tu cuenta
                y no se puede desactivar.
              </p>
            )}
          </div>
        ) : enrolling && qrCode ? (
          <form onSubmit={handleVerify} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="Código QR para 2FA" className="h-40 w-40" />
              <p className="text-center text-xs text-slate-500">
                Escanea este código con tu app de autenticación, o ingresa
                este código manualmente:
              </p>
              <code className="rounded bg-slate-100 px-2 py-1 text-xs">
                {secret}
              </code>
            </div>

            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Código de 6 dígitos"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center text-lg tracking-widest outline-none focus:border-slate-900"
            />

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={saving || code.length < 6}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? "Verificando..." : "Activar 2FA"}
              </button>
              <button
                type="button"
                onClick={handleCancelEnroll}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={handleStartEnroll}
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Activar verificación en dos pasos
          </button>
        )}
      </div>
    </div>
  );
}
