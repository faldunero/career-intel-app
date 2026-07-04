"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MfaSetupPage() {
  const router = useRouter();
  const supabase = createClient();
  const startedRef = useRef(false);

  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(true);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    async function startEnroll() {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
      });

      if (error) {
        // Si ya existe un factor sin verificar de un intento anterior,
        // lo limpiamos e intentamos de nuevo.
        const { data: existing } = await supabase.auth.mfa.listFactors();
        const unverified = existing?.totp?.find(
          (f) => f.status !== "verified"
        );
        if (unverified) {
          await supabase.auth.mfa.unenroll({ factorId: unverified.id });
          const retry = await supabase.auth.mfa.enroll({
            factorType: "totp",
          });
          if (retry.data) {
            setQrCode(retry.data.totp.qr_code);
            setSecret(retry.data.totp.secret);
            setFactorId(retry.data.id);
            setStarting(false);
            return;
          }
        }
        setError(error.message);
        setStarting(false);
        return;
      }

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setStarting(false);
    }

    startEnroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code: code.trim(),
    });

    setLoading(false);

    if (error) {
      setError(
        "Código incorrecto. Verifica la hora de tu teléfono e intenta de nuevo."
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-4"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      }}
    >
      <div className="w-full max-w-sm border border-black bg-white p-8">
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-black">
          Activa la verificación en dos pasos
        </h1>
        <p className="mb-6 text-sm text-[#555]">
          Es obligatoria para todas las cuentas. Escanea el código con
          Google Authenticator, Authy o similar.
        </p>

        {starting && !qrCode && !error && (
          <p className="text-sm text-[#555]">Generando código...</p>
        )}

        {qrCode && (
          <form onSubmit={handleVerify} className="flex flex-col gap-4">
            <div className="flex flex-col items-center gap-3 border border-black p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="Código QR para 2FA" className="h-40 w-40" />
              <p className="text-center text-xs text-[#555]">
                O ingresa este código manualmente:
              </p>
              <code className="bg-[#f5f5f5] px-2 py-1 text-xs">{secret}</code>
            </div>

            <input
              type="text"
              inputMode="numeric"
              autoFocus
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="Código de 6 dígitos"
              className="w-full border border-black px-3 py-3 text-center text-2xl tracking-[0.5em] outline-none"
            />

            {error && (
              <p className="border border-black bg-[#f5f5f5] px-3 py-2 text-sm text-black">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || code.length < 6}
              className="bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Activar y continuar"}
            </button>
          </form>
        )}

        {error && !qrCode && (
          <p className="border border-black bg-[#f5f5f5] px-3 py-2 text-sm text-black">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
