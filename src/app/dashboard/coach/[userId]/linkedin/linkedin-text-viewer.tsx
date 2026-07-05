"use client";

import { useState } from "react";
import {
  parseLinkedinText,
  CHIP_SECTION_TITLES,
} from "./parse-linkedin-text";

export default function LinkedinTextViewer({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const parsed = parseLinkedinText(text);

  return (
    <div className="mt-3">
      <button
        onClick={() => setShow((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-800"
      >
        📄 {show ? "Ocultar" : "Ver"} perfil extraído
      </button>

      {show && (
        <div className="mt-3 max-h-[32rem] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50 p-4">
          {parsed.intro.length > 0 && (
            <div className="mb-4">
              {parsed.intro.map((line, i) => (
                <p
                  key={i}
                  className={
                    i === 0
                      ? "text-sm font-semibold text-slate-900"
                      : "text-xs text-slate-600"
                  }
                >
                  {line}
                </p>
              ))}
            </div>
          )}

          {parsed.sections.length === 0 && parsed.intro.length === 0 && (
            <p className="whitespace-pre-wrap text-xs text-slate-600">
              {text}
            </p>
          )}

          <div className="flex flex-col gap-4">
            {parsed.sections.map((section, i) => (
              <div key={i}>
                <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  {section.title}
                </h4>
                {CHIP_SECTION_TITLES.has(section.title.toLowerCase()) ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {section.items.map((item, j) => (
                      <span
                        key={j}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs text-slate-700"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                ) : (
                  <ul className="mt-2 flex flex-col gap-1 pl-4 text-xs text-slate-600">
                    {section.items.map((item, j) => (
                      <li key={j} className="list-disc">
                        {item}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
