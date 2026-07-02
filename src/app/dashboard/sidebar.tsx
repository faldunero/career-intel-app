"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./logout-button";

type NavItem = { label: string; href: string };
type NavGroup = { title: string; items: NavItem[] };

function ScoreBadge({ score }: { score: number | null }) {
  const color =
    score === null
      ? "bg-slate-700 text-slate-300"
      : score >= 75
        ? "bg-emerald-500 text-white"
        : score >= 50
          ? "bg-amber-500 text-white"
          : "bg-red-500 text-white";

  return (
    <Link
      href="/dashboard"
      className="mt-4 flex items-center justify-between rounded-xl bg-slate-800 px-3 py-3 transition hover:bg-slate-700"
    >
      <div>
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
          Career Score
        </p>
        <p className="mt-0.5 text-xs text-slate-400">
          {score === null ? "Sin calcular" : "Ver detalle"}
        </p>
      </div>
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${color}`}
      >
        {score ?? "—"}
      </span>
    </Link>
  );
}

const ROLE_LABELS: Record<string, string> = {
  usuario: "Usuario",
  coach: "Coach",
  administrador: "Administrador",
};

export default function Sidebar({
  role,
  displayName,
  careerScore,
}: {
  role: string;
  displayName: string;
  careerScore: number | null;
}) {
  const pathname = usePathname();

  const groups: NavGroup[] = [];

  // Cada rol ve solo lo que le corresponde — nada de herramientas de
  // búsqueda de empleo para admin/coach, esas son propias de "usuario".
  if (role === "administrador") {
    groups.push({
      title: "Administración",
      items: [{ label: "Panel de administrador", href: "/dashboard/admin" }],
    });
  } else if (role === "coach") {
    groups.push({
      title: "Coach",
      items: [{ label: "Mis usuarios asignados", href: "/dashboard/coach" }],
    });
  } else {
    groups.push(
      {
        title: "Mi carrera",
        items: [
          { label: "Resumen", href: "/dashboard" },
          { label: "Perfil profesional", href: "/dashboard/profile" },
          { label: "LinkedIn", href: "/dashboard/linkedin" },
          { label: "Calendario", href: "/dashboard/calendar" },
          { label: "Tareas", href: "/dashboard/tasks" },
        ],
      },
      {
        title: "Documentos y matching",
        items: [
          { label: "Mi CV", href: "/dashboard/cv" },
          { label: "Matching de vacantes", href: "/dashboard/matching" },
        ],
      },
      {
        title: "Oportunidades",
        items: [
          { label: "CRM de oportunidades", href: "/dashboard/opportunities" },
        ],
      }
    );
  }

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((g) => [g.title, true]))
  );

  function toggleGroup(title: string) {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  }

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === "/dashboard"
      : pathname.startsWith(href);
  }

  return (
    <aside className="flex h-screen w-72 shrink-0 flex-col bg-slate-900">
      <div className="border-b border-slate-800 px-5 py-5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-indigo-400">
          Career Intelligence AI
        </p>
        <p className="mt-1 truncate text-base font-semibold text-white">
          {displayName}
        </p>
        <p className="mt-0.5 text-xs font-medium text-slate-400">
          {ROLE_LABELS[role] ?? role}
        </p>

        {role === "usuario" && <ScoreBadge score={careerScore} />}

        <div className="mt-3">
          <LogoutButton />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-3">
            <button
              onClick={() => toggleGroup(group.title)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-widest text-indigo-400 hover:text-indigo-300"
            >
              {group.title}
              <span
                className={`transition-transform ${openGroups[group.title] ? "rotate-90" : ""}`}
              >
                ›
              </span>
            </button>
            {openGroups[group.title] && (
              <div className="mt-1 flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                      isActive(item.href)
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
}
