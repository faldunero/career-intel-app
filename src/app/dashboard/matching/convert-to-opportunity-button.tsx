"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ConvertToOpportunityButton({
  matchId,
  userId,
  jobTitle,
  company,
}: {
  matchId: string;
  userId: string;
  jobTitle: string | null;
  company: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConvert() {
    setLoading(true);
    setError(null);

    const { error } = await supabase.from("opportunities").insert({
      user_id: userId,
      job_match_id: matchId,
      job_title: jobTitle,
      company: company,
      source: "Matching con IA",
      status: "por_postular",
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <p className="text-xs text-green-700">
        ✅ Agregada al CRM.{" "}
        <a href="/dashboard/opportunities" className="underline">
          Verla ahí
        </a>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={handleConvert}
        disabled={loading}
        className="self-start rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
      >
        {loading ? "Agregando..." : "+ Convertir en oportunidad"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
