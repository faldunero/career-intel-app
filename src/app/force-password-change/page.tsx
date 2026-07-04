"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/password-input";
import PasswordChecklist from "@/components/password-checklist";
import { isPasswordValid } from "@/lib/password-rules";

export default function ForcePasswordChangePage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ must_change_password: false })
        .eq("id", user.id);
    }

    setLoading(false);
    router.push("/mfa-setup");
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
          Cambia tu contraseña temporal
        </h1>
        <p className="mb-6 text-sm text-[#555]">
          Por seguridad, debes crear tu propia contraseña antes de
          continuar.
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
              placeholder="Crea una contraseña segura"
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
            {loading ? "Guardando..." : "Continuar"}
          </button>
        </form>
      </div>
    </main>
  );
}
