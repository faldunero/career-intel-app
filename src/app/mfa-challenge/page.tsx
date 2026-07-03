"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function MfaChallengePage() {
  const router = useRouter();
  const supabase = createClient();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data: factors, error: listError } =
      await supabase.auth.mfa.listFactors();

    if (listError || !factors?.totp?.[0]) {
      setError("No se encontró un método de verificación configurado.");
      setLoading(false);
      return;
    }

    const factorId = factors.totp[0].id;

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify(
      {
        factorId,
        code: code.trim(),
      }
    );

    setLoading(false);

    if (verifyError) {
      setError("Código incorrecto o expirado. Intenta de nuevo.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
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
          Verificación en dos pasos
        </h1>
        <p className="mb-6 text-sm text-[#555]">
          Ingresa el código de 6 dígitos de tu app de autenticación.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            inputMode="numeric"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full border border-black px-3 py-3 text-center text-2xl tracking-[0.5em] outline-none"
            placeholder="000000"
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
            {loading ? "Verificando..." : "Verificar"}
          </button>
        </form>

        <button
          onClick={handleLogout}
          className="mt-6 w-full text-center text-sm text-[#555] underline"
        >
          Cancelar y cerrar sesión
        </button>
      </div>
    </main>
  );
}
