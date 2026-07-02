import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// pdf-parse y mammoth usan APIs de Node (buffers, fs), así que esta
// route no puede correr en el runtime "edge".
export const runtime = "nodejs";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  const body = await request.json();
  const { cvId } = body as { cvId?: string };

  if (!cvId) {
    return NextResponse.json({ error: "Falta cvId" }, { status: 400 });
  }

  // Buscamos el registro del CV (RLS ya garantiza que solo puede ver el suyo)
  const { data: cv, error: cvError } = await supabase
    .from("cvs")
    .select("id, storage_path, mime_type, file_name")
    .eq("id", cvId)
    .single();

  if (cvError || !cv) {
    return NextResponse.json({ error: "CV no encontrado" }, { status: 404 });
  }

  // Descargamos el archivo real desde Storage (bucket privado "cvs")
  const { data: file, error: downloadError } = await supabase.storage
    .from("cvs")
    .download(cv.storage_path);

  if (downloadError || !file) {
    await supabase
      .from("cvs")
      .update({
        extraction_status: "error",
        extraction_error: downloadError?.message ?? "No se pudo descargar el archivo",
      })
      .eq("id", cv.id);

    return NextResponse.json(
      { error: "No se pudo descargar el archivo desde Storage" },
      { status: 500 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  let extractedText = "";

  try {
    if (cv.mime_type === "application/pdf" || cv.file_name.toLowerCase().endsWith(".pdf")) {
      // IMPORTANTE: el import de "pdf-parse/worker" debe evaluarse
      // ANTES que "pdf-parse". Ese módulo configura el CanvasFactory
      // que pdfjs-dist necesita en un entorno serverless (Vercel no
      // tiene DOMMatrix/ImageData como el navegador). Sin este orden,
      // falla con "DOMMatrix is not defined".
      const { CanvasFactory } = await import("pdf-parse/worker");
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer, CanvasFactory });
      const result = await parser.getText();
      await parser.destroy();
      extractedText = result.text;
    } else if (
      cv.file_name.toLowerCase().endsWith(".docx") ||
      cv.mime_type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else {
      throw new Error(
        "Formato no soportado todavía (solo .pdf y .docx en esta fase)"
      );
    }

    const trimmed = extractedText.trim();

    if (!trimmed) {
      throw new Error(
        "No se pudo extraer texto. Puede ser un PDF escaneado (imagen) sin capa de texto."
      );
    }

    await supabase
      .from("cvs")
      .update({
        extracted_text: trimmed,
        extraction_status: "done",
        extraction_error: null,
      })
      .eq("id", cv.id);

    return NextResponse.json({
      status: "done",
      preview: trimmed.slice(0, 800),
      length: trimmed.length,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";

    await supabase
      .from("cvs")
      .update({
        extraction_status: "error",
        extraction_error: message,
      })
      .eq("id", cv.id);

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
