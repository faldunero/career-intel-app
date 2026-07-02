"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ViewFileButton({
  bucket,
  storagePath,
  label = "Ver archivo",
}: {
  bucket: string;
  storagePath: string;
  label?: string;
}) {
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleView() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase.storage
      .from(bucket)
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
        className="text-xs font-medium text-slate-600 underline hover:text-slate-900 disabled:opacity-50"
      >
        {loading ? "Abriendo..." : label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
