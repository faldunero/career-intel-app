"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Visor compartido para las 3 vistas de CV (usuario, coach, headhunter).
// Antes existían 3 copias casi idénticas de este componente; se
// consolidan acá para que un cambio de estilo o de comportamiento no
// tenga que replicarse a mano en cada rol.
export default function CvPdfViewer({
  storagePath,
  fileName,
  bucket = "cvs",
}: {
  storagePath: string;
  fileName: string;
  bucket?: string;
}) {
  const supabase = createClient();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(storagePath, 300);
      if (!active) return;
      if (error || !data) {
        setError("No se pudo cargar la vista previa.");
        return;
      }
      setUrl(data.signedUrl);
    }
    load();
    return () => {
      active = false;
    };
  }, [storagePath, bucket, supabase]);

  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  if (error) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-96 animate-pulse items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-400">Cargando vista previa…</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
        <p className="truncate text-xs font-medium text-slate-600">
          {fileName}
        </p>
        <span className="shrink-0 text-[11px] uppercase tracking-wide text-slate-400">
          {isPdf ? "PDF" : "Word"}
        </span>
      </div>
      <iframe
        src={
          isPdf
            ? url
            : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
        }
        title={fileName}
        className="h-[720px] w-full bg-white"
      />
      {!isPdf && (
        <p className="border-t border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-400">
          Vista previa de Word vía Microsoft Office Online. Si no carga,
          usa &quot;Ver archivo original&quot; para descargarlo directo.
        </p>
      )}
    </div>
  );
}
