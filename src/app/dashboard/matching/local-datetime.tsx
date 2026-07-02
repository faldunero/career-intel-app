"use client";

import { useEffect, useState } from "react";

export default function LocalDateTime({ iso }: { iso: string }) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    const d = new Date(iso);
    // Sin especificar timeZone: usa automáticamente la zona horaria
    // del dispositivo de quien está viendo la página (no la del
    // servidor, que en Vercel corre en UTC).
    const date = d.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const time = d.toLocaleTimeString("es-CL", {
      hour: "2-digit",
      minute: "2-digit",
    });
    setFormatted(`${date} · ${time}`);
  }, [iso]);

  // Mientras no se monta en el cliente, no mostramos nada (evita un
  // parpadeo mostrando primero la hora UTC del servidor).
  return <>{formatted ?? "—"}</>;
}
