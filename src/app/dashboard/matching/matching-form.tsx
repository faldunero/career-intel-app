"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConvertToOpportunityButton from "./convert-to-opportunity-button";
import CoverLetterButton from "./cover-letter-button";

type Analysis = {
  empresa: string | null;
  cargo: string | null;
  matching_general: number;
  matching_ats: number | null;
  matching_tecnico: number;
  matching_liderazgo: number | null;
  matching_cultural: number;
  matching_experiencia: number;
  fortalezas: string[];
  brechas: string[];
  riesgos: string[];
  acciones_prioritarias: string[];
};

function ScoreRow({
  label,
  value,
  hideIfNull = false,
}: {
  label: string;
  value: number | null;
  hideIfNull?: boolean;
}) {
  if (value === null) {
    if (hideIfNull) return null;
    return (
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-500">{label}</span>
        <span className="text-slate-400">N/A</span>
      </div>
    );
  }
  const color =
    value >= 75 ? "bg-green-500" : value >= 50 ? "bg-amber-500" : "bg-red-500";
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        <span className="font-medium text-slate-900">{value}</span>
      </div>
      <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100">
        <div
          className={`h-1.5 rounded-full ${color}`}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <ul className="mt-1 list-disc pl-5 text-sm text-slate-700">
        {items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default function MatchingForm({
  userId,
  hasCv,
  cvFileName,
}: {
  userId: string;
  hasCv: boolean;
  cvFileName: string | null;
}) {
  const router = useRouter();
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Analysis | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const res = await fetch("/api/matching/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobDescription }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al analizar el matching");
        setLoading(false);
        return;
      }

      setResult(data.analysis);
      setMatchId(data.id);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setLoading(false);
  }

  function handleClear() {
    setJobDescription("");
    setResult(null);
    setMatchId(null);
    setError(null);
  }

  return (
    <div className="flex flex-col gap-4">
      {!hasCv && (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
          No tienes un CV con texto leído todavía. El matching va a
          basarse solo en tu perfil, que es menos preciso. Te recomendamos{" "}
          <a href="/dashboard/cv" className="underline">
            subir tu CV primero
          </a>
          .
        </p>
      )}
      {hasCv && (
        <p className="text-xs text-slate-400">
          Se usará tu CV más reciente: {cvFileName}
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="text-sm font-medium text-slate-700">
          Texto completo de la oferta laboral
        </label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          rows={8}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
          placeholder="Pega aquí el texto completo de la publicación de la vacante (LinkedIn, portal de empleo, etc.)"
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={loading || jobDescription.trim().length < 50}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Analizando..." : "Analizar matching"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={loading || (!jobDescription && !result && !error)}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Limpiar
          </button>
        </div>
      </form>

      {result && (
        <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-4">
          <div>
            <p className="text-sm text-slate-500">
              {result.cargo ?? "Cargo no identificado"}
              {result.empresa ? ` — ${result.empresa}` : ""}
            </p>
            <p className="text-3xl font-semibold text-slate-900">
              {result.matching_general}
              <span className="text-base font-normal text-slate-400">
                /100 general
              </span>
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ScoreRow label="ATS" value={result.matching_ats} hideIfNull />
            <ScoreRow label="Técnico" value={result.matching_tecnico} />
            <ScoreRow label="Liderazgo" value={result.matching_liderazgo} />
            <ScoreRow
              label="Cultural (estimado)"
              value={result.matching_cultural}
            />
            <ScoreRow
              label="Experiencia"
              value={result.matching_experiencia}
            />
          </div>

          <ListBlock title="Fortalezas" items={result.fortalezas} />
          <ListBlock title="Brechas" items={result.brechas} />
          <ListBlock title="Riesgos" items={result.riesgos} />
          <ListBlock
            title="Acciones prioritarias"
            items={result.acciones_prioritarias}
          />

          {matchId && (
            <div className="flex flex-col gap-3">
              <ConvertToOpportunityButton
                matchId={matchId}
                userId={userId}
                jobTitle={result.cargo}
                company={result.empresa}
              />
              <CoverLetterButton matchId={matchId} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
