"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type NavItem = { label: string; href: string; badgeTitle?: string; dotOnly?: boolean };
type NavGroup = { id: string; title: string; items: NavItem[] };

const FONT_STYLE = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
};

function ScoreBadge({ score }: { score: number | null }) {
  const color =
    score === null
      ? "bg-[#333] text-[#999]"
      : score >= 75
        ? "bg-white text-black"
        : score >= 50
          ? "bg-[#ccc] text-black"
          : "bg-[#666] text-white";

  return (
    <Link
      href="/dashboard"
      className="mt-4 flex items-center justify-between border border-[#333] bg-[#111] px-3 py-3 transition hover:bg-[#1a1a1a]"
    >
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-[#999]">
          Career Score
        </p>
        <p className="mt-0.5 text-xs text-[#777]">
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

export default function Sidebar({
  role,
  careerScore,
  badges: serverBadges,
}: {
  role: string;
  careerScore: number | null;
  badges: Record<string, number>;
}) {
  const pathname = usePathname();
  const supabase = createClient();

  const viewedUserMatch = pathname.match(/^\/dashboard\/coach\/([0-9a-f-]{36})/);
  const viewedUserId = viewedUserMatch?.[1] ?? null;
  const [viewedUserName, setViewedUserName] = useState<string | null>(null);
  const [viewedUserInterviewBadge, setViewedUserInterviewBadge] = useState(0);

  useEffect(() => {
    if (!viewedUserId) {
      setViewedUserName(null);
      setViewedUserInterviewBadge(0);
      return;
    }
    let cancelled = false;

    supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", viewedUserId)
      .single()
      .then(({ data }) => {
        if (!cancelled) {
          setViewedUserName(data?.full_name ?? data?.email ?? "Usuario");
        }
      });

    // Entrevistas completadas de ESTE usuario que el coach aún no
    // comentó (subconjunto del total que se ve en "Mis usuarios
    // asignados").
    supabase
      .from("interview_sessions")
      .select("id")
      .eq("user_id", viewedUserId)
      .eq("status", "completada")
      .then(async ({ data: sessions }) => {
        if (cancelled || !sessions || sessions.length === 0) {
          if (!cancelled) setViewedUserInterviewBadge(0);
          return;
        }
        const sessionIds = sessions.map((s) => s.id);
        const { data: comments } = await supabase
          .from("interview_comments")
          .select("session_id")
          .in("session_id", sessionIds);
        const commented = new Set((comments ?? []).map((c) => c.session_id));
        const pending = sessionIds.filter((id) => !commented.has(id));
        if (!cancelled) setViewedUserInterviewBadge(pending.length);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedUserId]);

  const badges: Record<string, number> = { ...serverBadges };
  if (viewedUserId && viewedUserInterviewBadge > 0) {
    badges[`/dashboard/coach/${viewedUserId}/entrevistas`] =
      viewedUserInterviewBadge;
  }

  const groups: NavGroup[] = [];

  // Cada rol ve solo lo que le corresponde — nada de herramientas de
  // búsqueda de empleo para admin/coach, esas son propias de "usuario".
  if (role === "administrador") {
    groups.push({
      id: "admin",
      title: "Administración",
      items: [
        { label: "Dashboard", href: "/dashboard/admin" },
        { label: "Administradores", href: "/dashboard/admin/administradores" },
        { label: "Coaches", href: "/dashboard/admin/coaches" },
        {
          label: "Usuarios",
          href: "/dashboard/admin/usuarios",
          badgeTitle: "usuarios sin coach asignado",
        },
        {
          label: "Headhunters",
          href: "/dashboard/admin/headhunters",
          badgeTitle: "solicitudes pendientes",
        },
        { label: "Datos de prueba", href: "/dashboard/admin/datos-prueba" },
        { label: "Mantenedor de cuentas", href: "/dashboard/admin/mantenedor" },
        { label: "Descargas de CV", href: "/dashboard/admin/descargas-cv" },
      ],
    });
  } else if (role === "coach") {
    groups.push({
      id: "coach",
      title: "Coach",
      items: [
        {
          label: "Mis usuarios asignados",
          href: "/dashboard/coach",
          badgeTitle: "entrevistas por comentar entre tus usuarios",
          dotOnly: true,
        },
      ],
    });

    if (viewedUserId) {
      const base = `/dashboard/coach/${viewedUserId}`;
      groups.push({
        id: "viewed-user",
        title: viewedUserName ?? "Usuario en vista",
        items: [
          { label: "CV", href: `${base}/cv` },
          { label: "LinkedIn", href: `${base}/linkedin` },
          { label: "Matching", href: `${base}/matching` },
          { label: "CRM", href: `${base}/crm` },
          { label: "Calendario", href: `${base}/calendario` },
          { label: "Tareas", href: `${base}/tareas` },
          {
            label: "Entrevistas",
            href: `${base}/entrevistas`,
            badgeTitle: "entrevistas por comentar",
          },
          { label: "Notas", href: `${base}/notas` },
        ],
      });
    }
  } else if (role === "headhunter") {
    groups.push({
      id: "headhunter",
      title: "Headhunter",
      items: [
        { label: "Buscar candidatos", href: "/dashboard/headhunter" },
        { label: "Mi acceso", href: "/dashboard/headhunter/mi-acceso" },
      ],
    });
  } else {
    groups.push(
      {
        id: "mi-carrera",
        title: "Mi carrera",
        items: [
          { label: "Resumen", href: "/dashboard" },
          { label: "Perfil profesional", href: "/dashboard/profile" },
          { label: "LinkedIn", href: "/dashboard/linkedin" },
          { label: "Calendario", href: "/dashboard/calendar", badgeTitle: "seguimientos nuevos de tu coach" },
          {
            label: "Tareas",
            href: "/dashboard/tasks",
            badgeTitle: "tareas pendientes",
          },
          {
            label: "Simulador de entrevistas",
            href: "/dashboard/interview",
            badgeTitle: "entrevistas nuevas por empezar",
          },
          {
            label: "Notas de tu coach",
            href: "/dashboard/notes",
            badgeTitle: "notas nuevas de tu coach",
          },
        ],
      },
      {
        id: "documentos",
        title: "Documentos y matching",
        items: [
          { label: "Mi CV", href: "/dashboard/cv" },
          { label: "Matching de vacantes", href: "/dashboard/matching" },
        ],
      },
      {
        id: "oportunidades",
        title: "Oportunidades",
        items: [
          { label: "CRM de oportunidades", href: "/dashboard/opportunities" },
        ],
      }
    );
  }

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(groups.map((g) => [g.id, true]))
  );

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function isActive(href: string) {
    if (href === "/dashboard" || href === "/dashboard/admin") {
      return pathname === href;
    }
    if (viewedUserId && href === `/dashboard/coach/${viewedUserId}`) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  }

  return (
    <aside
      className="flex h-screen w-72 shrink-0 flex-col bg-black"
      style={FONT_STYLE}
    >
      <div className="border-b border-[#222] px-5 py-5">
        <Link
          href="/"
          className="text-[11px] font-semibold uppercase tracking-widest text-white"
        >
          Career Intelligence AI
        </Link>

        {role === "usuario" && <ScoreBadge score={careerScore} />}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {groups.map((group) => {
          const isOpen = openGroups[group.id] ?? true;
          return (
            <div key={group.id} className="mb-3">
              <button
                onClick={() => toggleGroup(group.id)}
                className="flex w-full items-center justify-between px-2 py-1.5 text-left text-[11px] font-bold uppercase tracking-widest text-[#999] hover:text-white"
              >
                <span className="truncate">{group.title}</span>
                <span
                  className={`shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`}
                >
                  ›
                </span>
              </button>
              {isOpen && (
                <div className="mt-1 flex flex-col gap-0.5">
                  {group.items.map((item) => {
                    const badgeCount = badges[item.href];
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center justify-between px-3 py-2 text-sm font-medium transition ${
                          isActive(item.href)
                            ? "bg-white text-black"
                            : "text-[#ccc] hover:bg-[#1a1a1a] hover:text-white"
                        }`}
                      >
                        <span>{item.label}</span>
                        {!!badgeCount && item.dotOnly && (
                          <span
                            title={
                              item.badgeTitle
                                ? `Hay ${item.badgeTitle}`
                                : "Hay pendientes"
                            }
                            className="ml-2 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500"
                          />
                        )}
                        {!!badgeCount && !item.dotOnly && (
                          <span
                            title={
                              item.badgeTitle
                                ? `${badgeCount} ${item.badgeTitle}`
                                : undefined
                            }
                            className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold text-white"
                          >
                            {badgeCount > 99 ? "99+" : badgeCount}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
