"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/password-input";
import PasswordChecklist from "@/components/password-checklist";
import { isPasswordValid } from "@/lib/password-rules";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid(password)) {
      setError("La contraseña no cumple los requisitos de abajo.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push("/dashboard");
    }, 1500);
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
        <Link
          href="/"
          className="mb-6 block text-xs font-semibold uppercase tracking-widest text-black"
        >
          EXECUTIVE TRANSITION
        </Link>

        {success ? (
          <p className="text-sm text-green-700">
            Contraseña actualizada. Redirigiendo...
          </p>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-black">
              Crea tu nueva contraseña
            </h1>
            <p className="mb-6 text-sm text-[#555]">
              Elige una contraseña segura para tu cuenta.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Nueva contraseña
                </label>
                <PasswordInput
                  value={password}
                  onChange={setPassword}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                />
                <div className="mt-2">
                  <PasswordChecklist password={password} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-black">
                  Confirmar contraseña
                </label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  autoComplete="new-password"
                  required
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <p className="border border-black bg-[#f5f5f5] px-3 py-2 text-sm text-black">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="mt-2 bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar nueva contraseña"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
