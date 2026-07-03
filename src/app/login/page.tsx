"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const ROLE_LABELS: Record<string, string> = {
  administrador: "Acceso Administrador",
  coach: "Acceso Coach",
  usuario: "Acceso Usuario",
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const roleParam = searchParams.get("role");
  const heading = (roleParam && ROLE_LABELS[roleParam]) || "Iniciar sesión";

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
        <h1 className="mb-1 text-2xl font-semibold tracking-tight text-black">
          {heading}
        </h1>
        <p className="mb-6 text-sm text-[#555]">
          Ingresa tus credenciales para continuar.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-black px-3 py-2 text-sm text-black outline-none"
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
            {loading ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#555]">
          ¿No tienes cuenta?{" "}
          <Link href="/signup" className="font-medium text-black underline">
            Regístrate
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
