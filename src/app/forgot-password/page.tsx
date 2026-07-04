"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSent(true);
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

        {sent ? (
          <>
            <h1 className="mb-2 text-xl font-semibold text-black">
              Revisa tu correo
            </h1>
            <p className="text-sm text-[#555]">
              Si <strong>{email}</strong> tiene una cuenta, te enviamos un
              enlace para restablecer tu contraseña. Puede tardar unos
              minutos en llegar.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333]"
            >
              Volver a iniciar sesión
            </Link>
          </>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-semibold tracking-tight text-black">
              Recuperar contraseña
            </h1>
            <p className="mb-6 text-sm text-[#555]">
              Ingresa tu correo y te enviamos un enlace para crear una
              contraseña nueva.
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-black px-3 py-2 text-sm text-black outline-none"
                placeholder="tu@correo.com"
              />

              {error && (
                <p className="border border-black bg-[#f5f5f5] px-3 py-2 text-sm text-black">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Enviar enlace de recuperación"}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-[#555]">
              <Link href="/login" className="font-medium text-black hover:text-slate-600">
                Volver a iniciar sesión
              </Link>
            </p>
          </>
        )}
      </div>
    </main>
  );
}
