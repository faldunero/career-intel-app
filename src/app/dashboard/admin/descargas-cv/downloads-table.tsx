"use client";

import { useMemo, useState } from "react";

type Download = {
  id: string;
  downloaded_at: string;
  headhunter_name: string;
  headhunter_company: string | null;
  headhunter_email: string | null;
  candidate_name: string;
};

type SortKey = "downloaded_at" | "headhunter_name" | "candidate_name";

export default function DownloadsTable({ downloads }: { downloads: Download[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("downloaded_at");
  const [sortAsc, setSortAsc] = useState(false);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc((v) => !v);
    } else {
      setSortKey(key);
      setSortAsc(key !== "downloaded_at");
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = downloads;
    if (q) {
      rows = rows.filter(
        (d) =>
          d.headhunter_name.toLowerCase().includes(q) ||
          d.candidate_name.toLowerCase().includes(q) ||
          d.headhunter_company?.toLowerCase().includes(q)
      );
    }
    return [...rows].sort((a, b) => {
      let av: string;
      let bv: string;
      if (sortKey === "downloaded_at") {
        av = a.downloaded_at;
        bv = b.downloaded_at;
      } else {
        av = a[sortKey].toLowerCase();
        bv = b[sortKey].toLowerCase();
      }
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [downloads, search, sortKey, sortAsc]);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por headhunter, empresa o candidato..."
          className="w-full max-w-sm rounded-lg border border-slate-300 px-3 py-1.5 text-sm outline-none focus:border-slate-900"
        />
        <p className="text-xs text-slate-400">
          {filtered.length} de {downloads.length}
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
              <th
                onClick={() => toggleSort("downloaded_at")}
                className="cursor-pointer select-none px-4 py-2 hover:text-slate-900"
              >
                Fecha y hora {sortKey === "downloaded_at" && (sortAsc ? "▲" : "▼")}
              </th>
              <th
                onClick={() => toggleSort("headhunter_name")}
                className="cursor-pointer select-none px-4 py-2 hover:text-slate-900"
              >
                Headhunter {sortKey === "headhunter_name" && (sortAsc ? "▲" : "▼")}
              </th>
              <th className="px-4 py-2">Empresa</th>
              <th
                onClick={() => toggleSort("candidate_name")}
                className="cursor-pointer select-none px-4 py-2 hover:text-slate-900"
              >
                Candidato {sortKey === "candidate_name" && (sortAsc ? "▲" : "▼")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-slate-100 last:border-0">
                <td className="px-4 py-2 text-slate-500">
                  {new Date(d.downloaded_at).toLocaleString("es-CL", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </td>
                <td className="px-4 py-2 font-medium text-slate-900">
                  {d.headhunter_name}
                  {d.headhunter_email && (
                    <span className="ml-1 text-xs text-slate-400">
                      ({d.headhunter_email})
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-slate-500">
                  {d.headhunter_company ?? "—"}
                </td>
                <td className="px-4 py-2 text-slate-900">{d.candidate_name}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} className="py-4 text-center text-sm text-slate-400">
                  Sin descargas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
