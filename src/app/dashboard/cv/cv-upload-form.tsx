"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_EXTENSIONS = [".pdf", ".docx"];
const MAX_SIZE_MB = 10;

export default function CvUploadForm({ userId }: { userId: string }) {
  const router = useRouter();
  const supabase = createClient();

  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "extracting" | "done" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setError(null);
    setPreview(null);
    setStatus("idle");

    if (!selected) {
      setFile(null);
      return;
    }

    const ext = "." + selected.name.split(".").pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setError("Solo se aceptan archivos .pdf o .docx");
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
    setPreview(null);
    setStatus("uploading");

    const ext = file.name.split(".").pop();
    const storagePath = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    // 1. Subir el archivo real a Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("cvs")
      .upload(storagePath, file, {
        contentType: file.type,
      });

    if (uploadError) {
      setError(`Error al subir el archivo: ${uploadError.message}`);
      setStatus("error");
      return;
    }

    // 2. Crear el registro en la tabla `cvs`
    const { data: cvRow, error: insertError } = await supabase
      .from("cvs")
      .insert({
        user_id: userId,
        file_name: file.name,
        storage_path: storagePath,
        mime_type: file.type,
        extraction_status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !cvRow) {
      setError(`Error al registrar el CV: ${insertError?.message}`);
      setStatus("error");
      return;
    }

    // 3. Pedirle al servidor que extraiga el texto
    setStatus("extracting");

    try {
      const res = await fetch("/api/cv/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cvId: cvRow.id }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Error al extraer el texto del CV");
        setStatus("error");
        return;
      }

      setPreview(data.preview);
      setStatus("done");
      setFile(null);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor para extraer el texto");
      setStatus("error");
    }
  }

  const isBusy = status === "uploading" || status === "extracting";

  return (
    <div className="flex flex-col gap-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Selecciona tu CV (.pdf o .docx, máx. {MAX_SIZE_MB}MB)
        </label>
        <input
          type="file"
          accept=".pdf,.docx"
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
              : "Leyendo el contenido del CV…"}
          </p>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {status === "done" && preview && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-3">
          <p className="text-sm font-medium text-green-800">
            CV subido y leído correctamente
          </p>
          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-green-700">
            Vista previa del texto extraído
          </p>
          <p className="mt-1 whitespace-pre-line text-xs text-green-700/90">
            {preview}…
          </p>
        </div>
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
            ? "Leyendo CV…"
            : "Subir CV"}
      </button>
    </div>
  );
}
