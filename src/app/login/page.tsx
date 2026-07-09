"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/password-input";

const BACKGROUND_IMAGE =
  "https://files.manuscdn.com/user_upload_by_module/session_file/310519663591706935/ylrhIaSWKKPDepbA.jpg";

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
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-black px-4 py-10"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      }}
    >
      {/* Foto de fondo a pantalla completa */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url('${BACKGROUND_IMAGE}')` }}
      />
      {/* Overlay oscuro para contraste — más fuerte donde va el panel */}
      <div className="absolute inset-0 bg-black/55" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/50" />

      {/* Panel embebido sobre la imagen — vidrio esmerilado, sin fondo blanco */}
      <div className="relative w-full max-w-sm border border-white/25 bg-black/40 p-8 shadow-2xl backdrop-blur-xl">
        <Link
          href="/"
          className="mb-4 inline-block text-xs text-white/60 hover:text-white"
        >
          Volver al inicio
        </Link>
        <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-white">
          Executive Transition
        </p>

        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-white">
          Iniciar sesión
        </h1>
        <p className="mb-6 text-sm text-white/70">
          Ingresa con tu cuenta para acceder a tu panel.
        </p>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleOAuth}
            className="flex items-center justify-center gap-2 border border-white bg-white px-4 py-2.5 text-sm font-medium text-black transition hover:bg-white/90"
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
          <div className="h-px flex-1 bg-white/20" />
          <span className="text-xs text-white/50">o con tu correo</span>
          <div className="h-px flex-1 bg-white/20" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-white">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-white/30 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none focus:border-white"
              placeholder="tu@correo.com"
            />
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between">
              <label className="block text-sm font-medium text-white">
                Contraseña
              </label>
              <Link
                href="/forgot-password"
                className="text-xs text-white/60 hover:text-white"
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
              variant="dark"
            />
          </div>

          {error && (
            <p className="border border-red-400/40 bg-red-500/15 px-3 py-2 text-sm text-white">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90 disabled:opacity-50"
          >
            {loading ? "Ingresando…" : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-white/70">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="font-medium text-white">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}
