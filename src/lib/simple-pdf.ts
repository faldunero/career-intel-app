// Generador de PDF mínimo, escrito a mano, sin ninguna librería externa
// (para no depender de que alguien corra `npm install` antes de
// desplegar). Alcanza perfecto para una página de texto simple, que es
// todo lo que necesita un CV de prueba.

function escapePdfText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

export function makeSimplePdf(lines: string[]): Buffer {
  const fontSize = 11;
  const lineHeight = 15;
  const startY = 740;

  const contentOps = lines
    .map((line, i) => {
      const y = startY - i * lineHeight;
      return `1 0 0 1 50 ${y} Tm (${escapePdfText(line)}) Tj`;
    })
    .join("\n");

  const streamContent = `BT /F1 ${fontSize} Tf\n${contentOps}\nET`;
  const streamBytes = Buffer.from(streamContent, "latin1");

  const objects: Record<number, string> = {
    1: `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    2: `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    3: `3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n`,
    4: `4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>\nendobj\n`,
  };

  let body = "%PDF-1.4\n";
  const offsets: number[] = [0];

  for (let i = 1; i <= 4; i++) {
    offsets[i] = Buffer.byteLength(body, "latin1");
    body += objects[i];
  }

  offsets[5] = Buffer.byteLength(body, "latin1");
  const obj5Head = `5 0 obj\n<< /Length ${streamBytes.length} >>\nstream\n`;
  const obj5Tail = `\nendstream\nendobj\n`;

  const bodyBuf = Buffer.concat([
    Buffer.from(body, "latin1"),
    Buffer.from(obj5Head, "latin1"),
    streamBytes,
    Buffer.from(obj5Tail, "latin1"),
  ]);

  const xrefOffset = bodyBuf.length;
  const pad = (n: number) => n.toString().padStart(10, "0");

  let xref = `xref\n0 6\n0000000000 65535 f \n`;
  for (let i = 1; i <= 5; i++) {
    xref += `${pad(offsets[i])} 00000 n \n`;
  }

  const trailer = `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;

  return Buffer.concat([
    bodyBuf,
    Buffer.from(xref, "latin1"),
    Buffer.from(trailer, "latin1"),
  ]);
}
