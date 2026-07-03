"use client";

import { PASSWORD_RULES } from "@/lib/password-rules";

export default function PasswordChecklist({ password }: { password: string }) {
  return (
    <ul className="flex flex-col gap-0.5">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(password);
        return (
          <li
            key={rule.id}
            className={`text-xs ${passed ? "text-green-700" : "text-[#999]"}`}
          >
            {passed ? "✓" : "○"} {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
