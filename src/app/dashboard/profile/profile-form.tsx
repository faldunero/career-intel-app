"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Profile = {
  full_name: string | null;
  country: string | null;
  city: string | null;
  profession: string | null;
  specialty: string | null;
  industry: string | null;
  years_experience: number | null;
  seniority: string | null;
  current_position: string | null;
  target_role: string | null;
  work_mode: string | null;
  target_companies: string | null;
  salary_expectation: string | null;
  languages: string | null;
  certifications: string | null;
  strengths: string | null;
  weaknesses: string | null;
  motivations: string | null;
  restrictions: string | null;
} | null;

const SENIORITY_OPTIONS = [
  "Analista",
  "Especialista",
  "Supervisor",
  "Coordinador",
  "Jefe",
  "Subgerente",
  "Gerente",
  "Director",
  "VP",
  "C-Level",
  "Directorio",
];

const WORK_MODE_OPTIONS = ["Presencial", "Híbrido", "Remoto", "Sin preferencia"];

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900";

export default function ProfileForm({
  userId,
  initialProfile,
}: {
  userId: string;
  initialProfile: Profile;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [form, setForm] = useState({
    full_name: initialProfile?.full_name ?? "",
    country: initialProfile?.country ?? "",
    city: initialProfile?.city ?? "",
    profession: initialProfile?.profession ?? "",
    specialty: initialProfile?.specialty ?? "",
    industry: initialProfile?.industry ?? "",
    years_experience: initialProfile?.years_experience?.toString() ?? "",
    seniority: initialProfile?.seniority ?? "",
    current_position: initialProfile?.current_position ?? "",
    target_role: initialProfile?.target_role ?? "",
    work_mode: initialProfile?.work_mode ?? "",
    target_companies: initialProfile?.target_companies ?? "",
    salary_expectation: initialProfile?.salary_expectation ?? "",
    languages: initialProfile?.languages ?? "",
    certifications: initialProfile?.certifications ?? "",
    strengths: initialProfile?.strengths ?? "",
    weaknesses: initialProfile?.weaknesses ?? "",
    motivations: initialProfile?.motivations ?? "",
    restrictions: initialProfile?.restrictions ?? "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [autofilling, setAutofilling] = useState(false);
  const [autofillMsg, setAutofillMsg] = useState<string | null>(null);
  const [autofillError, setAutofillError] = useState<string | null>(null);

  async function handleAutofill() {
    setAutofilling(true);
    setAutofillError(null);
    setAutofillMsg(null);

    try {
      const res = await fetch("/api/profile/autofill", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setAutofillError(data.error ?? "Error al autocompletar");
        setAutofilling(false);
        return;
      }

      const fields = data.fields as Record<string, string | number | null>;
      let filledCount = 0;

      setForm((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(fields) as (keyof typeof prev)[]) {
          if (key === "target_role") continue; // nunca se autocompleta
          const incoming = fields[key];
          const isEmpty = !prev[key];
          if (isEmpty && incoming !== null && incoming !== undefined) {
            next[key] = String(incoming);
            filledCount++;
          }
        }
        return next;
      });

      setAutofillMsg(
        filledCount > 0
          ? `${filledCount} campo(s) completados desde tu CV. Revisa y guarda.`
          : "No había campos vacíos que completar (o el CV no traía esa información)."
      );
    } catch {
      setAutofillError("No se pudo conectar con el servidor");
    }
    setAutofilling(false);
  }

  function update(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // Consideramos el perfil "completo" si los campos clave de la
  // Etapa 1 - Descubrimiento están llenos.
  function isComplete(f: typeof form) {
    return Boolean(
      f.full_name &&
        f.country &&
        f.profession &&
        f.industry &&
        f.seniority &&
        f.current_position &&
        f.target_role
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name || null,
        country: form.country || null,
        city: form.city || null,
        profession: form.profession || null,
        specialty: form.specialty || null,
        industry: form.industry || null,
        years_experience: form.years_experience
          ? parseInt(form.years_experience, 10)
          : null,
        seniority: form.seniority || null,
        current_position: form.current_position || null,
        target_role: form.target_role || null,
        work_mode: form.work_mode || null,
        target_companies: form.target_companies || null,
        salary_expectation: form.salary_expectation || null,
        languages: form.languages || null,
        certifications: form.certifications || null,
        strengths: form.strengths || null,
        weaknesses: form.weaknesses || null,
        motivations: form.motivations || null,
        restrictions: form.restrictions || null,
        profile_completed: isComplete(form),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-slate-900">
              ¿Ya subiste tu CV?
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              Completa automáticamente los campos vacíos de abajo con lo
              que ya está en tu CV. Nunca sobrescribe lo que ya
              escribiste, y nunca inventa un cargo objetivo — eso lo
              defines tú.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAutofill}
            disabled={autofilling}
            className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            {autofilling ? "Leyendo tu CV..." : "Autocompletar desde mi CV"}
          </button>
        </div>
        {autofillMsg && (
          <p className="mt-2 text-xs text-green-700">{autofillMsg}</p>
        )}
        {autofillError && (
          <p className="mt-2 text-xs text-red-600">{autofillError}</p>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
      {/* Datos básicos */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Datos básicos
        </h2>
        <Field label="Nombre completo">
          <input
            className={inputClass}
            value={form.full_name}
            onChange={(e) => update("full_name", e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="País">
            <input
              className={inputClass}
              value={form.country}
              onChange={(e) => update("country", e.target.value)}
              placeholder="Chile"
            />
          </Field>
          <Field label="Ciudad">
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => update("city", e.target.value)}
              placeholder="Santiago"
            />
          </Field>
        </div>
      </section>

      {/* Perfil profesional */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Perfil profesional
        </h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Profesión">
            <input
              className={inputClass}
              value={form.profession}
              onChange={(e) => update("profession", e.target.value)}
              placeholder="Ingeniero Comercial"
            />
          </Field>
          <Field label="Especialidad">
            <input
              className={inputClass}
              value={form.specialty}
              onChange={(e) => update("specialty", e.target.value)}
              placeholder="Finanzas Corporativas"
            />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Industria">
            <input
              className={inputClass}
              value={form.industry}
              onChange={(e) => update("industry", e.target.value)}
              placeholder="Banca"
            />
          </Field>
          <Field label="Años de experiencia">
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.years_experience}
              onChange={(e) => update("years_experience", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Seniority">
          <select
            className={inputClass}
            value={form.seniority}
            onChange={(e) => update("seniority", e.target.value)}
          >
            <option value="">Selecciona...</option>
            {SENIORITY_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Cargo actual">
            <input
              className={inputClass}
              value={form.current_position}
              onChange={(e) => update("current_position", e.target.value)}
            />
          </Field>
          <Field label="Cargo objetivo">
            <input
              className={inputClass}
              value={form.target_role}
              onChange={(e) => update("target_role", e.target.value)}
            />
          </Field>
        </div>
      </section>

      {/* Búsqueda */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Búsqueda laboral
        </h2>
        <Field label="Modalidad laboral">
          <select
            className={inputClass}
            value={form.work_mode}
            onChange={(e) => update("work_mode", e.target.value)}
          >
            <option value="">Selecciona...</option>
            {WORK_MODE_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Empresas objetivo">
          <input
            className={inputClass}
            value={form.target_companies}
            onChange={(e) => update("target_companies", e.target.value)}
            placeholder="Separadas por coma"
          />
        </Field>
        <Field label="Pretensión salarial">
          <input
            className={inputClass}
            value={form.salary_expectation}
            onChange={(e) => update("salary_expectation", e.target.value)}
            placeholder="Ej: $3.500.000 - $4.200.000 CLP"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Idiomas">
            <input
              className={inputClass}
              value={form.languages}
              onChange={(e) => update("languages", e.target.value)}
              placeholder="Español (nativo), Inglés (avanzado)"
            />
          </Field>
          <Field label="Certificaciones">
            <input
              className={inputClass}
              value={form.certifications}
              onChange={(e) => update("certifications", e.target.value)}
              placeholder="PMP, Scrum Master"
            />
          </Field>
        </div>
      </section>

      {/* Diagnóstico personal */}
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          Diagnóstico personal
        </h2>
        <Field label="Fortalezas">
          <textarea
            className={inputClass}
            rows={2}
            value={form.strengths}
            onChange={(e) => update("strengths", e.target.value)}
          />
        </Field>
        <Field label="Debilidades">
          <textarea
            className={inputClass}
            rows={2}
            value={form.weaknesses}
            onChange={(e) => update("weaknesses", e.target.value)}
          />
        </Field>
        <Field label="Motivaciones">
          <textarea
            className={inputClass}
            rows={2}
            value={form.motivations}
            onChange={(e) => update("motivations", e.target.value)}
          />
        </Field>
        <Field label="Restricciones">
          <textarea
            className={inputClass}
            rows={2}
            value={form.restrictions}
            onChange={(e) => update("restrictions", e.target.value)}
            placeholder="Ej: no disponibilidad para viajar, cuidado de familiares, etc."
          />
        </Field>
      </section>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
          Perfil guardado correctamente.
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
        >
          {saving ? "Guardando..." : "Guardar perfil"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
        >
          Volver al dashboard
        </button>
      </div>
    </form>
    </div>
  );
}
