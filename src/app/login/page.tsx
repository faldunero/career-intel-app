"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/password-input";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setError(
        error.message === "Invalid login credentials"
          ? "Correo o contraseña incorrectos."
          : error.message
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  async function handleOAuth() {
    setError(null);
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
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
          className="mb-4 inline-block text-xs text-[#555] hover:text-black"
        >
          Volver al inicio
        </Link>
        <Link
          href="/"
          className="mb-6 block text-xs font-semibold uppercase tracking-widest text-black"
        >
          EXECUTIVE TRANSITION
        </Link>
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-black">
          Iniciar sesión
        </h1>
        <p className="mb-6 text-sm text-[#555]">
          Un solo acceso para administradores, coaches, usuarios y
          headhunters — tu cuenta define automáticamente qué panel ves.
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleOAuth}
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
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[#ddd]" />
          <span className="text-xs text-[#999]">o con tu correo</span>
          <div className="h-px flex-1 bg-[#ddd]" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-black">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-black px-3 py-2 text-sm text-black outline-none"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-black">
                Contraseña
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-[#555] hover:text-black"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>
            <PasswordInput
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
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
            {loading ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#555]">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="font-medium text-black">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
