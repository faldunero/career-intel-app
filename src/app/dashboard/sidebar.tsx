"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoutButton from "./logout-button";

type NavItem = { label: string; href: string };
type NavGroup = { title: string; items: NavItem[] };

export default function Sidebar({
  role,
  displayName,
}: {
  role: string;
  displayName: string;
}) {
  const pathname = usePathname();

  const groups: NavGroup[] = [];

  if (role === "administrador") {
    groups.push({
      title: "Administración",
      items: [{ label: "Panel de administrador", href: "/dashboard/admin" }],
    });
  }

  if (role === "coach") {
    groups.push({
      title: "Coach",
      items: [{ label: "Mis usuarios asignados", href: "/dashboard/coach" }],
    });
  }

  groups.push(
    {
      title: "Mi carrera",
      items: [
        { label: "Resumen", href: "/dashboard" },
        { label: "Perfil profesional", href: "/dashboard/profile" },
        { label: "LinkedIn", href: "/dashboard/linkedin" },
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
      items: [{ label: "CRM de oportunidades", href: "/dashboard/opportunities" }],
    }
  );

  // Grupos abiertos por defecto: todos, para no esconder nada al entrar
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
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-5 py-5">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Career Intelligence AI
        </p>
        <p className="mt-1 truncate text-sm font-semibold text-slate-900">
          {displayName}
        </p>
        <div className="mt-3">
          <LogoutButton />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => (
          <div key={group.title} className="mb-2">
            <button
              onClick={() => toggleGroup(group.title)}
              className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 hover:bg-slate-50"
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
                    className={`rounded-lg px-3 py-2 text-sm transition ${
                      isActive(item.href)
                        ? "bg-slate-900 font-medium text-white"
                        : "text-slate-700 hover:bg-slate-100"
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
