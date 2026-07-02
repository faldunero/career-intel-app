import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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
  const { linkedinId } = body as { linkedinId?: string };

  if (!linkedinId) {
    return NextResponse.json({ error: "Falta linkedinId" }, { status: 400 });
  }

  const { data: item, error: itemError } = await supabase
    .from("linkedin_profiles")
    .select("id, storage_path")
    .eq("id", linkedinId)
    .single();

  if (itemError || !item) {
    return NextResponse.json(
      { error: "No se encontró el archivo" },
      { status: 404 }
    );
  }

  const { data: file, error: downloadError } = await supabase.storage
    .from("linkedin")
    .download(item.storage_path);

  if (downloadError || !file) {
    await supabase
      .from("linkedin_profiles")
      .update({
        extraction_status: "error",
        extraction_error:
          downloadError?.message ?? "No se pudo descargar el archivo",
      })
      .eq("id", item.id);

    return NextResponse.json(
      { error: "No se pudo descargar el archivo desde Storage" },
      { status: 500 }
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  try {
    // Mismo fix que en la extracción de CV: pdf-parse necesita el
    // CanvasFactory de "pdf-parse/worker" cargado antes, o falla con
    // "DOMMatrix is not defined" en Vercel serverless.
    const { CanvasFactory } = await import("pdf-parse/worker");
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: buffer, CanvasFactory });
    const result = await parser.getText();
    await parser.destroy();

    const trimmed = result.text.trim();

    if (!trimmed) {
      throw new Error(
        "No se pudo extraer texto del PDF. Asegúrate de exportarlo con 'Save to PDF' de LinkedIn, no una captura de pantalla."
      );
    }

    await supabase
      .from("linkedin_profiles")
      .update({
        extracted_text: trimmed,
        extraction_status: "done",
        extraction_error: null,
      })
      .eq("id", item.id);

    return NextResponse.json({
      status: "done",
      preview: trimmed.slice(0, 800),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Error desconocido";

    await supabase
      .from("linkedin_profiles")
      .update({ extraction_status: "error", extraction_error: message })
      .eq("id", item.id);

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
