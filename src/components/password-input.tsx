"use client";

import { useState } from "react";

export default function PasswordInput({
  value,
  onChange,
  placeholder,
  autoComplete,
  required,
  minLength,
  variant = "light",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
  variant?: "light" | "dark";
}) {
  const [visible, setVisible] = useState(false);

  const inputClass =
    variant === "dark"
      ? "w-full border-0 border-b border-white/40 bg-transparent px-0 py-2 pr-14 text-sm text-white placeholder-white/40 outline-none focus:border-white [text-shadow:0_1px_2px_rgb(0_0_0_/_50%)]"
      : "w-full border border-black px-3 py-2 pr-16 text-sm text-black outline-none";

  const toggleClass =
    variant === "dark"
      ? "absolute right-0 top-1/2 -translate-y-1/2 text-xs font-medium text-white/60 hover:text-white"
      : "absolute right-2 top-1/2 -translate-y-1/2 text-xs font-medium text-[#555] hover:text-black";

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        required={required}
        minLength={minLength}
        autoComplete={autoComplete}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className={toggleClass}
      >
        {visible ? "Ocultar" : "Ver"}
      </button>
    </div>
  );
}
