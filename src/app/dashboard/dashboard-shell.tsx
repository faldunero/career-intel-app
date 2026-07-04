"use client";

import { useState } from "react";
import Sidebar from "./sidebar";
import GlobalSearch from "@/components/global-search";
import {
  BackHomeNav,
  SidebarToggle,
  UserMenu,
} from "@/components/topbar-actions";

export default function DashboardShell({
  role,
  careerScore,
  badges,
  displayName,
  roleLabel,
  today,
  children,
}: {
  role: string;
  careerScore: number | null;
  badges: Record<string, number>;
  displayName: string;
  roleLabel: string;
  today: string;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen">
      <div
        className={`overflow-hidden transition-all duration-200 ${
          sidebarOpen ? "w-72" : "w-0"
        }`}
      >
        <div className="w-72">
          <Sidebar role={role} careerScore={careerScore} badges={badges} />
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto bg-slate-50">
        <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 py-3">
          <div className="flex items-center gap-3">
            <SidebarToggle onToggle={() => setSidebarOpen((v) => !v)} />
            <BackHomeNav />
          </div>
          <GlobalSearch />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-900">
                {displayName}
              </p>
              <p className="text-xs text-slate-500">
                {roleLabel} · {today}
              </p>
            </div>
            <UserMenu displayName={displayName} />
          </div>
        </div>
        <main className="flex-1 px-6 py-10">{children}</main>
      </div>
    </div>
  );
}
