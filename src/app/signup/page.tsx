"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const fontStyle = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
};

export default function SignupPage() {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
  }

  if (success) {
    return (
      <main
        className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-4"
        style={fontStyle}
      >
        <div className="w-full max-w-sm border border-black bg-white p-8 text-center">
          <h1 className="mb-2 text-xl font-semibold text-black">
            ¡Revisa tu correo!
          </h1>
          <p className="text-sm text-[#555]">
            Te enviamos un enlace de confirmación a <strong>{email}</strong>.
            Confírmalo y luego inicia sesión.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-block bg-black px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#333]"
          >
            Ir a iniciar sesión
          </Link>
        </div>
      </main>
    );
  }

  async function handleOAuth(provider: "google" | "azure") {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        ...(provider === "azure" ? { scopes: "email" } : {}),
      },
    });
  }

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-[#f5f5f5] px-4"
      style={fontStyle}
    >
      <div className="w-full max-w-sm border border-black bg-white p-8">
        <Link
          href="/"
          className="mb-6 block text-xs font-semibold uppercase tracking-widest text-black"
        >
          EXECUTIVE TRANSITION
        </Link>
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-black">
          Crea tu cuenta
        </h1>
        <p className="mb-6 text-sm text-[#555]">
          Comienza tu proceso de asesoría de carrera.
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleOAuth("google")}
            className="flex items-center justify-center gap-2 border border-black px-4 py-2.5 text-sm font-medium text-black transition hover:bg-[#f5f5f5]"
          >
            <svg width="16" height="16" viewBox="0 0 48 48">
              <path
                fill="#FFC107"
                d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.6 4.5-5.9 7.6-11.3 7.6-6.9 0-12.5-5.6-12.5-12.5S17.1 10.2 24 10.2c3.2 0 6.1 1.2 8.3 3.2l5.1-5.1C34.6 5.1 29.6 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.4-.4-3.5z"
              />
              <path
                fill="#FF3D00"
                d="M6.3 14.7l5.9 4.3C13.8 15.6 18.5 12.7 24 12.7c3.2 0 6.1 1.2 8.3 3.2l5.1-5.1C34.6 7.1 29.6 5 24 5 16.3 5 9.7 9.3 6.3 14.7z"
              />
              <path
                fill="#4CAF50"
                d="M24 43c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2.1 1.5-4.7 2.4-7.6 2.4-5.4 0-9.9-3.6-11.5-8.5l-6.1 4.7C9.6 38.4 16.2 43 24 43z"
              />
              <path
                fill="#1976D2"
                d="M43.6 20.5H42V20.4H24v7.2h11.3c-.8 2.2-2.2 4.1-4.1 5.4l6.5 5.5c-.5.4 7.2-5.3 7.2-16.5 0-1.4-.1-2.4-.4-3.5z"
              />
            </svg>
            Continuar con Google
          </button>
          <button
            type="button"
            onClick={() => handleOAuth("azure")}
            className="flex items-center justify-center gap-2 border border-black px-4 py-2.5 text-sm font-medium text-black transition hover:bg-[#f5f5f5]"
          >
            <svg width="16" height="16" viewBox="0 0 23 23">
              <rect x="1" y="1" width="10" height="10" fill="#f25022" />
              <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
              <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
              <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
            </svg>
            Continuar con Microsoft
          </button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#ddd]" />
          <span className="text-xs text-[#999]">o con tu correo</span>
          <div className="h-px flex-1 bg-[#ddd]" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Nombre completo
            </label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full border border-black px-3 py-2 text-sm text-black outline-none"
              placeholder="Tu nombre"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-black px-3 py-2 text-sm text-black outline-none"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-black px-3 py-2 text-sm text-black outline-none"
              placeholder="Mínimo 6 caracteres"
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
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#555]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-black underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
