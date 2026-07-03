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
