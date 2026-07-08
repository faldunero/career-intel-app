"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_SIZE_MB = 10;

export default function LinkedinUploadForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "extracting" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    setStatus("idle");

    if (!selected) {
      setFile(null);
      return;
    }
    if (!selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Solo se acepta el PDF exportado de LinkedIn");
      setFile(null);
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo supera los ${MAX_SIZE_MB}MB`);
      setFile(null);
      return;
    }
    setFile(selected);
  }

  async function handleUpload() {
    if (!file) return;
    setError(null);
    setStatus("uploading");

    const storagePath = `${userId}/${Date.now()}-${crypto.randomUUID()}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("linkedin")
      .upload(storagePath, file, { contentType: "application/pdf" });

    if (uploadError) {
      setError(`Error al subir el archivo: ${uploadError.message}`);
      setStatus("error");
      return;
    }

    const { data: row, error: insertError } = await supabase
      .from("linkedin_profiles")
      .insert({
        user_id: userId,
        file_name: file.name,
        storage_path: storagePath,
        extraction_status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !row) {
      setError(`Error al registrar el archivo: ${insertError?.message}`);
      setStatus("error");
      return;
    }

    setStatus("extracting");

    try {
      const res = await fetch("/api/linkedin/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedinId: row.id }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al leer el PDF de LinkedIn");
        setStatus("error");
        return;
      }

      setStatus("done");
      setFile(null);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor");
      setStatus("error");
    }
  }

  const isBusy = status === "uploading" || status === "extracting";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          PDF exportado de LinkedIn (máx. {MAX_SIZE_MB}MB)
        </label>
        <input
          type="file"
          accept=".pdf"
          onChange={handleFileChange}
          disabled={isBusy}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white disabled:opacity-50"
        />
      </div>

      {isBusy && (
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
          <span className="h-2 w-2 animate-pulse rounded-full bg-slate-400" />
          <p className="text-sm text-slate-600">
            {status === "uploading"
              ? "Subiendo el archivo…"
              : "Leyendo el perfil…"}
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}
      {status === "done" && (
        <p className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          Perfil de LinkedIn subido y leído correctamente.
        </p>
      )}

      <button
        type="button"
        onClick={handleUpload}
        disabled={!file || isBusy}
        className="self-start rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-50"
      >
        {status === "uploading"
          ? "Subiendo…"
          : status === "extracting"
            ? "Leyendo perfil…"
            : "Subir perfil de LinkedIn"}
      </button>
    </div>
  );
}
