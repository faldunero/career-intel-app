"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CvPdfViewer from "@/components/cv/pdf-viewer";

export default function LinkedinActions({
  linkedinId,
  storagePath,
  fileName,
  extractedText,
}: {
  linkedinId: string;
  storagePath: string;
  fileName: string;
  extractedText: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [viewLoading, setViewLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(extractedText ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleViewOriginal() {
    setViewLoading(true);
    setError(null);
    const { data, error } = await supabase.storage
      .from("linkedin")
      .createSignedUrl(storagePath, 60);
    setViewLoading(false);

    if (error || !data) {
      setError("No se pudo generar el link para ver el archivo original");
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleSaveText() {
    setSaving(true);
    setError(null);
    const { error } = await supabase
      .from("linkedin_profiles")
      .update({ extracted_text: text })
      .eq("id", linkedinId);
    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    router.refresh();
  }

  if (editing) {
    return (
      <div className="mt-3 flex flex-col gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 font-mono text-xs outline-none focus:border-slate-900"
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveText}
            disabled={saving}
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {saving ? "Guardando…" : "Guardar cambios"}
          </button>
          <button
            onClick={() => {
              setText(extractedText ?? "");
              setEditing(false);
              setError(null);
            }}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-3 flex flex-col gap-3">
      <CvPdfViewer
        storagePath={storagePath}
        fileName={fileName}
        bucket="linkedin"
      />
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500">
        <button
          onClick={handleViewOriginal}
          disabled={viewLoading}
          className="hover:text-slate-900 disabled:opacity-50"
        >
          {viewLoading ? "Abriendo…" : "Ver PDF original"}
        </button>
        {extractedText && (
          <>
            <span className="text-slate-200">·</span>
            <button
              onClick={() => setEditing(true)}
              className="hover:text-slate-900"
            >
              Editar texto
            </button>
          </>
        )}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
