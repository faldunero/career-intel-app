"use client";

import { useState } from "react";
import {
  parseLinkedinText,
  CHIP_SECTION_TITLES,
} from "./parse-linkedin-text";
import { KeywordChips, TextList } from "@/components/cv/analysis-section";

export default function LinkedinTextViewer({ text }: { text: string }) {
  const [show, setShow] = useState(false);
  const parsed = parseLinkedinText(text);

  return (
    <div className="mt-3">
      <button
        onClick={() => setShow((v) => !v)}
        className="inline-flex items-center rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-400 hover:text-slate-900"
      >
        {show ? "Ocultar perfil extraído" : "Ver perfil extraído"}
      </button>

      {show && (
        <div className="mt-3 max-h-[32rem] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4">
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
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  {section.title}
                </h4>
                <div className="mt-2">
                  {CHIP_SECTION_TITLES.has(section.title.toLowerCase()) ? (
                    <KeywordChips items={section.items} />
                  ) : (
                    <TextList items={section.items} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
