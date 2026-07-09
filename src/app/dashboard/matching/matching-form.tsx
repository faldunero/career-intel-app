"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ConvertToOpportunityButton from "./convert-to-opportunity-button";
import CoverLetterButton from "./cover-letter-button";
import ScoreRing from "@/components/cv/score-ring";
import ScoreBar from "@/components/cv/score-bar";
import { TextList } from "@/components/cv/analysis-section";

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

function ListBlock({ title, items }: { title: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div>
      <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h4>
      <div className="mt-2">
        <TextList items={items} />
      </div>
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
          <a href="/dashboard/cv" className="font-medium hover:text-amber-900">
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
            {loading ? "Analizando…" : "Analizar matching"}
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
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              {result.cargo ?? "Cargo no identificado"}
              {result.empresa ? ` — ${result.empresa}` : ""}
            </p>
          </div>
          <ScoreRing score={result.matching_general} label="Compatibilidad general" />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <ScoreBar label="ATS" score={result.matching_ats} />
            <ScoreBar label="Técnico" score={result.matching_tecnico} />
            <ScoreBar label="Liderazgo" score={result.matching_liderazgo} />
            <ScoreBar label="Cultural (estimado)" score={result.matching_cultural} />
            <ScoreBar label="Experiencia" score={result.matching_experiencia} />
          </div>

          <ListBlock title="Fortalezas" items={result.fortalezas} />
          <ListBlock title="Brechas" items={result.brechas} />
          <ListBlock title="Riesgos" items={result.riesgos} />
          <ListBlock title="Acciones prioritarias" items={result.acciones_prioritarias} />

          {matchId && (
            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
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
