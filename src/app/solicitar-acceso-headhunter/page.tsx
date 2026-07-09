"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function HeadhunterRequestPage() {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!fullName.trim() || !email.trim() || !company.trim()) {
      setError("Nombre, correo y empresa son obligatorios.");
      return;
    }
    if (!acceptedPrivacy) {
      setError("Debes aceptar la Política de Privacidad para continuar.");
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("headhunter_requests").insert({
      full_name: fullName.trim(),
      email: email.trim(),
      company: company.trim(),
      phone: phone.trim() || null,
      message: message.trim() || null,
      consent_accepted_at: new Date().toISOString(),
    });
    setSaving(false);

    if (error) {
      setError("No se pudo enviar la solicitud. Intenta de nuevo.");
      return;
    }
    setDone(true);
  }

  return (
    <main
      className="min-h-screen bg-white px-6 py-16 text-black"
      style={{
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
      }}
    >
        <div className="mx-auto max-w-md">
        <Link
          href="/"
          className="text-sm text-[#666] hover:text-black"
        >
          Volver
        </Link>

        <Link
          href="/"
          className="mt-6 block text-xs font-semibold uppercase tracking-widest text-black"
        >
          EXECUTIVE TRANSITION
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          Acceso para headhunters
        </h1>
        <p className="mt-2 text-sm text-[#666]">
          Solicita acceso a nuestra base de candidatos. Un administrador
          revisa cada solicitud manualmente antes de habilitar el acceso.
        </p>

        {done ? (
          <div className="mt-8 rounded-lg border border-black bg-[#f5f5f5] p-6">
            <p className="text-sm">
              Solicitud enviada. Te vamos a escribir a{" "}
              <strong>{email}</strong> cuando sea revisada.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-4">
            <div>
              <label className="text-xs font-medium text-[#555]">
                Nombre completo *
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-1 w-full border border-black px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#555]">
                Correo *
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full border border-black px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#555]">
                Empresa *
              </label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="mt-1 w-full border border-black px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#555]">
                Teléfono (opcional)
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1 w-full border border-black px-3 py-2 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#555]">
                Cuéntanos qué perfiles buscas (opcional)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
                className="mt-1 w-full border border-black px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="border border-[#ddd] bg-[#f9f9f9] p-3">
              <p className="text-xs leading-relaxed text-[#555]">
                Al enviar este formulario, tratamos tus datos personales
                (nombre, correo, empresa, teléfono) de acuerdo a la Ley
                21.719 de Protección de Datos Personales, para evaluar y
                gestionar tu solicitud de acceso. Puedes leer el detalle
                en nuestra{" "}
                <Link href="/privacidad" target="_blank" className="font-medium text-black">
                  Política de Privacidad
                </Link>
                .
              </p>
              <label className="mt-3 flex items-start gap-2 text-xs text-[#333]">
                <input
                  type="checkbox"
                  checked={acceptedPrivacy}
                  onChange={(e) => setAcceptedPrivacy(e.target.checked)}
                  className="mt-0.5"
                />
                He leído y acepto la Política de Privacidad y el
                tratamiento de mis datos personales descrito en ella. *
              </label>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={saving || !acceptedPrivacy}
              className="mt-2 bg-black px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#333] disabled:opacity-50"
            >
              {saving ? "Enviando…" : "Enviar solicitud"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
