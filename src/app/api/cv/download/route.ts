import { NextResponse } from "next/server";
import { Document, Packer, Paragraph } from "docx";
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
  const { cvId } = body as { cvId?: string };

  if (!cvId) {
    return NextResponse.json({ error: "Falta cvId" }, { status: 400 });
  }

  const { data: cv, error } = await supabase
    .from("cvs")
    .select("file_name, extracted_text")
    .eq("id", cvId)
    .single();

  if (error || !cv || !cv.extracted_text) {
    return NextResponse.json(
      { error: "No se encontró texto para este CV" },
      { status: 404 }
    );
  }

  // Convertimos el texto plano en párrafos de Word. Las líneas que
  // parecen títulos de sección (cortas, en mayúsculas) se marcan en
  // negrita para dar algo de estructura, sin inventar formato que no
  // esté en el texto original.
  const lines = cv.extracted_text.split("\n");
  const paragraphs = lines.map((line: string) => {
    const trimmed = line.trim();
    const looksLikeHeading =
      trimmed.length > 0 &&
      trimmed.length < 45 &&
      trimmed === trimmed.toUpperCase() &&
      /[A-ZÁÉÍÓÚÑ]/.test(trimmed);

    return new Paragraph({
      text: trimmed,
      heading: looksLikeHeading ? "Heading2" : undefined,
      spacing: { after: 120 },
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children:
          paragraphs.length > 0 ? paragraphs : [new Paragraph({ text: "" })],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  const bytes = new Uint8Array(buffer);

  const baseName = (cv.file_name || "CV").replace(/\.(pdf|docx?)$/i, "");

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${baseName}.docx"`,
    },
  });
}
