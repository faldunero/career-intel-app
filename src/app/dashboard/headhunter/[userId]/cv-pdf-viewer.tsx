"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CvPdfViewer({
  storagePath,
  fileName,
}: {
  storagePath: string;
  fileName: string;
}) {
  const supabase = createClient();
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error } = await supabase.storage
        .from("cvs")
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
  }, [storagePath, supabase]);

  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  if (error) {
    return <p className="text-xs text-red-600">{error}</p>;
  }

  if (!url) {
    return (
      <div className="flex h-96 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-400">Cargando vista previa...</p>
      </div>
    );
  }

  return (
    <div>
      <iframe
        src={
          isPdf
            ? url
            : `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`
        }
        title={fileName}
        className="h-[800px] w-full rounded-lg border border-slate-200"
      />
      {!isPdf && (
        <p className="mt-2 text-xs text-slate-400">
          Vista previa de Word vía Microsoft Office Online.
        </p>
      )}
    </div>
  );
}
