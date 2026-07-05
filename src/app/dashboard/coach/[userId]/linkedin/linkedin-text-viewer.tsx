"use client";

import { useState } from "react";

export default function LinkedinTextViewer({ text }: { text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div className="mt-3">
      <button
        onClick={() => setShow((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-800"
      >
        📄 {show ? "Ocultar" : "Ver"} texto extraído del perfil
      </button>
      {show && (
        <p className="mt-2 max-h-96 overflow-y-auto whitespace-pre-wrap rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
          {text}
        </p>
      )}
    </div>
  );
}
