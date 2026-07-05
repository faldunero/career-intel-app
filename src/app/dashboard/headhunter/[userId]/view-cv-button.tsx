"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ViewCvButton({ storagePath }: { storagePath: string }) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleView() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.storage
      .from("cvs")
      .createSignedUrl(storagePath, 60);
    setLoading(false);

    if (error || !data) {
      setError("No se pudo abrir el archivo");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  return (
    <div>
      <button
        onClick={handleView}
        disabled={loading}
        className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {loading ? "Abriendo..." : "Ver / descargar CV"}
      </button>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
